import React, { useEffect, useMemo, useRef, useState } from 'react';
import { newRow, CSV_HEADERS } from './utils/constants';
import { splitCSV, normalizeDateTime } from './utils/helpers';
import { fetchCryptoPrices } from './services/api';
import { saveDataToStorage, loadDataFromStorage } from './utils/storage';
import {
  ensureAnonymousLogin,
  saveWorkspaceData,
  loadWorkspaceDataOnce,
  subscribeWorkspace,
} from './services/firebase';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import StatsCards from './components/StatsCards';
import ActionButtons from './components/ActionButtons';
import SortableTable from './components/SortableTable';
import ExcelUpload from './components/ExcelUpload';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * React Airdrop Alpha Tracker
 * - Dữ liệu các cột khớp Google Sheet: A..H
 * - Tự động fetch giá từ CoinGecko qua Api Id (cột D)
 * - G = Token Price (từ API) | H = B x G
 * - Hỗ trợ thêm dòng nhanh, dán dữ liệu từ Sheet (CSV/TSV), export CSV
 * - Tùy chỉnh chu kỳ làm mới
 */

export default function App() {
  const [rows, setRows] = useState(() => {
    // Load dữ liệu từ localStorage khi khởi tạo
    const savedData = loadDataFromStorage();
    if (savedData) {
      return savedData;
    }
    return [
      newRow({ name: 'Bitcoin', amount: 0.01, apiId: 'bitcoin' }),
      newRow({ name: 'Ethereum', amount: 0.2, apiId: 'ethereum' }),
      newRow({ name: 'BNB', amount: 0.5, apiId: 'binancecoin' }),
    ];
  });
  // Refs and state used throughout the component (some were accidentally removed)
  const timerRef = useRef(null);
  const unsubRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);
  const fetchPendingRef = useRef(null);

  // refresh interval fixed to 60 seconds (user control removed)
  const refreshSec = 60;
  const [workspaceId, setWorkspaceId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [btcPrice, setBtcPrice] = useState(0);
  const [ethPrice, setEthPrice] = useState(0);
  const [bnbPrice, setBnbPrice] = useState(0);

  const [showHighestPrice, setShowHighestPrice] = useState(false);
  const [searchToken, setSearchToken] = useState('');
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [addForm, setAddForm] = useState({
    name: '',
    amount: '',
    launchAt: '',
    apiId: '',
    pointPriority: '',
    pointFCFS: '',
  });
  const [addErrors, setAddErrors] = useState({});

  // derived list of api ids for fetching prices (unique, non-empty)
  const ids = useMemo(() => {
    return Array.from(
      new Set(rows.map((r) => (r.apiId || '').trim()).filter(Boolean)),
    );
  }, [rows]);

  // Fetch prices and update rows' price/value/highestPrice
  async function fetchPrices() {
    // Always include common coins so BTC/ETH/BNB cards show even when table ids missing
    const idsToFetch = Array.from(
      new Set([...(ids || []), 'bitcoin', 'ethereum', 'binancecoin']),
    );
    if (!idsToFetch.length) return;
    setLoading(true);
    try {
      const priceMap = await fetchCryptoPrices(idsToFetch, 'usd');

      setRows((prev) =>
        prev.map((r) => {
          const id = (r.apiId || '').trim();
          const priceRaw =
            id && priceMap[id] && priceMap[id].usd
              ? priceMap[id].usd
              : r.price || 0;
          const price = Number(priceRaw) || 0;
          const amount = Number(r.amount) || 0;
          const highest = Math.max(Number(r.highestPrice) || 0, price || 0);
          return { ...r, price, value: amount * price, highestPrice: highest };
        }),
      );

      // record last updated time once prices have been applied
      setLastUpdated(new Date());

      // small convenience: set common coin displays if present; fallback to any existing row prices
      if (priceMap.bitcoin && priceMap.bitcoin.usd)
        setBtcPrice(Number(priceMap.bitcoin.usd) || 0);
      else
        setBtcPrice(
          (
            rows.find(
              (r) => (r.apiId || '').trim().toLowerCase() === 'bitcoin',
            ) || {}
          ).price || 0,
        );

      if (priceMap.ethereum && priceMap.ethereum.usd)
        setEthPrice(Number(priceMap.ethereum.usd) || 0);
      else
        setEthPrice(
          (
            rows.find(
              (r) => (r.apiId || '').trim().toLowerCase() === 'ethereum',
            ) || {}
          ).price || 0,
        );

      if (priceMap.binancecoin && priceMap.binancecoin.usd)
        setBnbPrice(Number(priceMap.binancecoin.usd) || 0);
      else
        setBnbPrice(
          (
            rows.find(
              (r) => (r.apiId || '').trim().toLowerCase() === 'binancecoin',
            ) || {}
          ).price || 0,
        );
    } catch (e) {
      console.error('fetchPrices error', e);
    } finally {
      setLoading(false);
    }
  }

  // Debounced trigger to fetch prices to coalesce multiple rapid changes
  function requestFetchPrices(delayMs = 150) {
    if (fetchPendingRef.current) {
      clearTimeout(fetchPendingRef.current);
    }
    fetchPendingRef.current = setTimeout(() => {
      fetchPendingRef.current = null;
      fetchPrices();
    }, delayMs);
  }

  // Form submit wrapper used by the Add Row modal form (form object passed)
  function handleAddRowSubmit(form) {
    // validate and insert immediately (mirror addRowFromForm behavior)
    const errs = validateAddForm(form);
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) {
      setAddForm(form);
      return;
    }

    // normalize launchAt: date-only -> DD/MM/YYYY 00:00:00, keep time if provided
    const normalizedLaunch = form.launchAt
      ? (function (v) {
          const n = normalizeDateTime(v);
          // If normalizeDateTime returned date-only (no time), append 00:00:00
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(n)) return n + ' 00:00:00';
          return n;
        })(form.launchAt)
      : '';

    const nr = newRow({
      name: String(form.name || '')
        .trim()
        .toUpperCase(),
      amount: Number(form.amount) || 0,
      launchAt: normalizedLaunch || '',
      apiId: form.apiId || '',
      pointPriority: form.pointPriority || '',
      pointFCFS: form.pointFCFS || '',
    });

    setRows((prev) => {
      const newRows = [nr, ...prev];
      saveDataToStorage(newRows);
      if (!isRemoteUpdateRef.current) {
        setSyncing(true);
        saveWorkspaceData('global', newRows)
          .catch((e) => {
            console.error('Save cloud failed:', e);
            toast.error('Failed to sync data to cloud. Please try again.');
          })
          .finally(() => setSyncing(false));
      }
      return newRows;
    });

    setShowAddModal(false);
    setAddForm({
      name: '',
      amount: '',
      launchAt: '',
      apiId: '',
      pointPriority: '',
      pointFCFS: '',
    });
    setAddErrors({});
    toast.success(`New ${nr.name || 'token'} added successfully!`);
  }

  // Tự động refresh
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      fetchPrices();
    }, 60 * 1000);
    // Trigger an immediate debounced fetch when ids set changes so prices show up right away
    requestFetchPrices(100);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);

  // Fetch lần đầu
  useEffect(() => {
    fetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đọc workspaceId từ query param (?ws=...) nếu có
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ws = params.get('ws');
    if (ws && ws !== workspaceId) {
      setWorkspaceId(ws);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth then subscribe to a single global workspace document
  useEffect(() => {
    let cleanup = () => {};
    (async () => {
      try {
        await ensureAnonymousLogin();

        // cleanup previous
        if (unsubRef.current) {
          unsubRef.current();
          unsubRef.current = null;
        }

        const GLOBAL_WS = 'global';

        // bootstrap if empty
        try {
          const cloudRows = await loadWorkspaceDataOnce(GLOBAL_WS);
          if (Array.isArray(cloudRows) && cloudRows.length > 0) {
            isRemoteUpdateRef.current = true;
            setRows(cloudRows);
            saveDataToStorage(cloudRows);
            setTimeout(() => (isRemoteUpdateRef.current = false), 0);
            // After cloud rows loaded, fetch prices (debounced)
            requestFetchPrices(50);
          } else if (!cloudRows || cloudRows.length === 0) {
            // ensure document exists so other devices can subscribe immediately
            await saveWorkspaceData(GLOBAL_WS, []);
          }
        } catch (e) {
          console.warn('Bootstrap workspace failed:', e);
        }

        unsubRef.current = subscribeWorkspace(GLOBAL_WS, (cloudRows) => {
          isRemoteUpdateRef.current = true;
          setRows(cloudRows);
          saveDataToStorage(cloudRows);
          setTimeout(() => (isRemoteUpdateRef.current = false), 0);
          // Fetch latest prices when cloud data changes (debounced)
          requestFetchPrices(100);
        });

        cleanup = () => {
          if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
          }
        };
      } catch (e) {
        console.error('Auth/subscribe error:', e);
        toast.error(
          'Failed to connect to cloud sync. Please refresh the page.',
        );
      }
    })();
    return cleanup;
  }, []);

  function updateRow(idx, patch) {
    setRows((prev) => {
      const normalizedPatch = { ...patch };
      if (normalizedPatch.name !== undefined) {
        normalizedPatch.name = String(normalizedPatch.name || '')
          .trim()
          .toUpperCase();
      }
      const newRows = prev.map((r, i) =>
        i === idx ? { ...r, ...normalizedPatch } : r,
      );
      saveDataToStorage(newRows);
      if (!isRemoteUpdateRef.current) {
        setSyncing(true);
        saveWorkspaceData('global', newRows)
          .catch((e) => {
            console.error('Save cloud failed:', e);
            toast.error('Failed to sync data to cloud. Please try again.');
          })
          .finally(() => setSyncing(false));
      }
      // notify user which token was updated
      try {
        const updatedName = (newRows[idx] && newRows[idx].name) || 'token';
        toast.success(`Updated ${updatedName} successfully!`);
      } catch (e) {
        /* ignore */
      }
      return newRows;
    });
  }

  function openAddRowModal() {
    setShowAddModal(true);
  }

  function validateAddForm(form) {
    const errs = {};
    if (!form.name || !String(form.name).trim())
      errs.name = 'Token (A) is required';

    if (!form.launchAt || !String(form.launchAt).trim()) {
      errs.launchAt = 'Listing time (C) is required';
    } else {
      // accept DD/MM/YYYY or DD/MM/YYYY HH:mm:ss
      const regexDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const regexDateTime =
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
      const val = String(form.launchAt).trim();
      if (!(regexDate.test(val) || regexDateTime.test(val))) {
        errs.launchAt =
          'Listing time must be DD/MM/YYYY or DD/MM/YYYY HH:mm:ss';
      }
    }

    if (form.amount !== undefined && String(form.amount).trim() !== '') {
      const n = Number(form.amount);
      if (isNaN(n) || n < 0)
        errs.amount = 'Amount (B) must be a non-negative number';
    }

    return errs;
  }

  function addRowFromForm() {
    const errs = validateAddForm(addForm);
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const normalizedLaunch = addForm.launchAt
      ? (function (v) {
          const n = normalizeDateTime(v);
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(n)) return n + ' 00:00:00';
          return n;
        })(addForm.launchAt)
      : '';

    const nr = newRow({
      name: String(addForm.name || '')
        .trim()
        .toUpperCase(),
      amount: Number(addForm.amount) || 0,
      launchAt: normalizedLaunch || '',
      apiId: addForm.apiId || '',
      pointPriority: addForm.pointPriority || '',
      pointFCFS: addForm.pointFCFS || '',
    });

    setRows((prev) => {
      const newRows = [nr, ...prev];
      saveDataToStorage(newRows);
      if (!isRemoteUpdateRef.current) {
        setSyncing(true);
        saveWorkspaceData('global', newRows)
          .catch((e) => {
            console.error('Save cloud failed:', e);
            toast.error('Failed to sync data to cloud. Please try again.');
          })
          .finally(() => setSyncing(false));
      }
      return newRows;
    });

    setShowAddModal(false);
    setAddForm({
      name: '',
      amount: '',
      launchAt: '',
      apiId: '',
      pointPriority: '',
      pointFCFS: '',
    });
    setAddErrors({});
    toast.success('New row added successfully!');
  }

  function removeRow(idx) {
    setRows((prev) => {
      const removed = prev[idx];
      const newRows = prev.filter((_, i) => i !== idx);
      saveDataToStorage(newRows);
      if (!isRemoteUpdateRef.current) {
        setSyncing(true);
        saveWorkspaceData('global', newRows)
          .catch((e) => {
            console.error('Save cloud failed:', e);
            toast.error('Failed to sync data to cloud. Please try again.');
          })
          .finally(() => setSyncing(false));
      }
      try {
        const name = (removed && removed.name) || 'token';
        toast.success(`Deleted ${name} successfully!`);
      } catch (e) {
        /* ignore */
      }
      return newRows;
    });
  }

  function clearAll() {
    if (confirm('Delete all rows?')) {
      setRows([]);
      saveDataToStorage([]);
      if (!isRemoteUpdateRef.current) {
        setSyncing(true);
        saveWorkspaceData('global', [])
          .catch((e) => {
            console.error('Save cloud failed:', e);
            toast.error('Failed to sync data to cloud. Please try again.');
          })
          .finally(() => setSyncing(false));
      }
      toast.success('All data cleared successfully!');
    }
  }

  function checkDuplicates(newRows, existingRows) {
    const duplicates = [];
    const existingApiIds = new Set(
      existingRows.map((r) => r.apiId.trim().toLowerCase()).filter(Boolean),
    );

    newRows.forEach((row, index) => {
      if (
        row.apiId.trim() &&
        existingApiIds.has(row.apiId.trim().toLowerCase())
      ) {
        duplicates.push({ ...row, originalIndex: index });
      }
    });

    return duplicates;
  }

  function handleDuplicateImport(duplicates, newRows) {
    const duplicateNames = duplicates.map((d) => d.name || d.apiId).join(', ');
    const shouldImport = confirm(
      `Found ${duplicates.length} duplicate(s): ${duplicateNames}\n\n` +
        'Do you want to import all data (duplicates will be skipped) or cancel?',
    );

    if (shouldImport) {
      // Filter out duplicates
      const filteredNewRows = newRows.filter((row, index) => {
        return !duplicates.some((d) => d.originalIndex === index);
      });

      setRows((prev) => {
        const newRows = [...prev, ...filteredNewRows];
        saveDataToStorage(newRows);
        return newRows;
      });

      toast.success(
        `Imported ${filteredNewRows.length} rows successfully! ${duplicates.length} duplicates skipped.`,
      );
    }
  }

  function exportCSV() {
    if (rows.length === 0) {
      toast.warning('No data to export. Please add some data first.');
      return;
    }

    const lines = rows.map((r) =>
      [
        r.name,
        r.amount,
        r.launchAt,
        r.apiId,
        r.pointPriority,
        r.pointFCFS,
        r.price,
        r.value,
        r.highestPrice,
      ]
        .map((v) => String(v ?? '').replaceAll('"', '""'))
        .map((v) => `"${v}"`)
        .join(','),
    );
    const csv = [CSV_HEADERS.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crypto-tracker-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${rows.length} rows to CSV successfully!`);
  }

  function handlePaste(text) {
    // Hỗ trợ dán từ Google Sheet: nhận TSV hoặc CSV
    const rowsText = text.trim().split(/\r?\n/);
    const errors = [];
    const parsedRows = [];

    // Validate each pasted line: only columns A-F allowed (indices 0..5)
    rowsText.forEach((line, idx) => {
      const parts = line.includes('\t') ? line.split('\t') : splitCSV(line);

      // If extra columns beyond F (index >=6) contain non-empty values -> reject
      if (parts.length > 6) {
        const extras = parts
          .slice(6)
          .some((v) => String(v || '').trim() !== '');
        if (extras) {
          errors.push(
            `Row ${
              idx + 1
            }: contains columns beyond F. Only columns A-F are allowed.`,
          );
          return;
        }
      }

      const [
        name = '',
        amount = '',
        launchAt = '',
        apiId = '',
        pPri = '',
        pFcfs = '',
      ] = parts;

      // Basic field validation
      const rowErrors = [];
      if (!String(name || '').trim()) rowErrors.push('name (A) is required');
      const amountNum = Number(amount);
      if (amount !== '' && (isNaN(amountNum) || amountNum < 0))
        rowErrors.push('amount (B) must be a non-negative number');
      if (launchAt && launchAt.trim()) {
        const regex =
          /^(\d{1,2})\/(\d{1,2})\/(\d{4})(\s+\d{1,2}:\d{1,2}:\d{1,2})?$/;
        if (!regex.test(launchAt.trim()))
          rowErrors.push(
            'listing time (C) should be DD/MM/YYYY or DD/MM/YYYY HH:mm:ss',
          );
      }

      if (rowErrors.length) {
        errors.push(`Row ${idx + 1}: ${rowErrors.join('; ')}`);
        return;
      }

      parsedRows.push(
        newRow({
          name: String(name || '')
            .trim()
            .toUpperCase(),
          amount: Number(amount) || 0,
          launchAt: launchAt?.trim(),
          apiId: apiId?.trim(),
          pointPriority: pPri?.trim(),
          pointFCFS: pFcfs?.trim(),
        }),
      );
    });

    if (errors.length) {
      toast.error(`Paste failed:\n${errors.join('\n')}`, { autoClose: 5000 });
      return;
    }

    // Kiểm tra trùng lặp
    const duplicates = checkDuplicates(parsedRows, rows);
    if (duplicates.length > 0) {
      handleDuplicateImport(duplicates, parsedRows);
    } else {
      setRows((prev) => {
        const newRows = [...prev, ...parsedRows];
        saveDataToStorage(newRows);
        if (!isRemoteUpdateRef.current) {
          setSyncing(true);
          saveWorkspaceData('global', newRows)
            .catch((e) => {
              console.error('Save cloud failed:', e);
              toast.error('Failed to sync data to cloud. Please try again.');
            })
            .finally(() => setSyncing(false));
        }
        return newRows;
      });
      toast.success(
        `Imported ${parsedRows.length} rows from clipboard successfully!`,
      );
    }
  }

  function handleImportExcel(data) {
    const parsedData = data.map((item) =>
      newRow({
        ...item,
        name: String(item.name || '')
          .trim()
          .toUpperCase(),
      }),
    );

    // Kiểm tra trùng lặp
    const duplicates = checkDuplicates(parsedData, rows);
    if (duplicates.length > 0) {
      handleDuplicateImport(duplicates, parsedData);
    } else {
      setRows((prev) => {
        const newRows = [...prev, ...parsedData];
        saveDataToStorage(newRows);
        if (!isRemoteUpdateRef.current) {
          setSyncing(true);
          saveWorkspaceData('global', newRows)
            .catch((e) => {
              console.error('Save cloud failed:', e);
              toast.error('Failed to sync data to cloud. Please try again.');
            })
            .finally(() => setSyncing(false));
        }
        return newRows;
      });
      toast.success(
        `Imported ${parsedData.length} rows from Excel successfully!`,
      );
    }
    setShowExcelUpload(false);
  }

  // Removed legacy backup/restore UI

  return (
    <ThemeProvider>
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 sm:p-6'>
        <div className='max-w-full mx-auto'>
          <Header loading={loading} onRefresh={fetchPrices} syncing={syncing} />

          <StatsCards
            rowsCount={rows.length}
            loading={loading}
            btcPrice={btcPrice}
            ethPrice={ethPrice}
            bnbPrice={bnbPrice}
            syncing={syncing}
            lastUpdated={lastUpdated}
          />

          <ActionButtons
            onAddRow={openAddRowModal}
            onPasteText={handlePaste}
            onExportCSV={exportCSV}
            onClearAll={clearAll}
            onImportExcel={() => setShowExcelUpload(true)}
            onRefresh={fetchPrices}
            loading={loading}
            showHighestPrice={showHighestPrice}
            setShowHighestPrice={setShowHighestPrice}
            searchToken={searchToken}
            setSearchToken={setSearchToken}
          />

          <SortableTable
            rows={rows}
            onUpdateRow={updateRow}
            onRemoveRow={removeRow}
            showHighestPrice={showHighestPrice}
            searchToken={searchToken}
          />
        </div>

        {/* Excel Upload Modal */}
        {showExcelUpload && (
          <div className='fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl p-6 shadow-xl'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold dark:text-white'>
                  Import from Excel file
                </h3>
                <button
                  onClick={() => setShowExcelUpload(false)}
                  className='text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100'
                >
                  ✕
                </button>
              </div>
              <ExcelUpload onImportData={handleImportExcel} />
              <div className='mt-4 text-xs text-gray-500 dark:text-gray-400'>
                <p>
                  <strong>Note:</strong> Excel file should have columns A-F as
                  follows:
                </p>
                <p>
                  A: Token | B: Amount | C: Date Claim | D: Full Name | E: Point
                  (Priority) | F: Point (FCFS)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Row Modal */}
        {showAddModal && (
          <div className='fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-xl'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold dark:text-white'>
                  Add Row
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className='text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100'
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddRowSubmit(addForm);
                }}
              >
                <div className='grid grid-cols-1 gap-3'>
                  <div>
                    <input
                      name='name'
                      value={addForm.name}
                      onChange={(e) =>
                        setAddForm((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder='Token (required)'
                      className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
                    />
                    {addErrors.name && (
                      <div className='text-yellow-800 bg-yellow-50 px-2 py-1 rounded text-sm mt-1'>
                        {addErrors.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      name='amount'
                      value={addForm.amount}
                      onChange={(e) =>
                        setAddForm((p) => ({ ...p, amount: e.target.value }))
                      }
                      placeholder='Amount'
                      type='number'
                      step='0.000001'
                      className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
                    />
                    {addErrors.amount && (
                      <div className='text-yellow-800 bg-yellow-50 px-2 py-1 rounded text-sm mt-1'>
                        {addErrors.amount}
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      name='launchAt'
                      value={addForm.launchAt}
                      onChange={(e) =>
                        setAddForm((p) => ({ ...p, launchAt: e.target.value }))
                      }
                      placeholder='Listing time (required): DD/MM/YYYY or DD/MM/YYYY HH:mm:ss'
                      className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
                    />
                    {addErrors.launchAt && (
                      <div className='text-yellow-800 bg-yellow-50 px-2 py-1 rounded text-sm mt-1'>
                        {addErrors.launchAt}
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      name='apiId'
                      value={addForm.apiId}
                      onChange={(e) =>
                        setAddForm((p) => ({ ...p, apiId: e.target.value }))
                      }
                      placeholder='API ID'
                      className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
                    />
                  </div>

                  <div>
                    <input
                      name='pointPriority'
                      value={addForm.pointPriority}
                      onChange={(e) =>
                        setAddForm((p) => ({
                          ...p,
                          pointPriority: e.target.value,
                        }))
                      }
                      placeholder='Point (Priority)'
                      className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
                    />
                  </div>

                  <div>
                    <input
                      name='pointFCFS'
                      value={addForm.pointFCFS}
                      onChange={(e) =>
                        setAddForm((p) => ({ ...p, pointFCFS: e.target.value }))
                      }
                      placeholder='Point (FCFS)'
                      className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
                    />
                  </div>
                </div>

                <div className='mt-4 flex justify-end gap-2'>
                  <button
                    type='button'
                    onClick={() => setShowAddModal(false)}
                    className='px-3 py-2 rounded-xl border dark:border-gray-600 text-sm dark:text-white'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    className='px-3 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-sm'
                  >
                    Add to table
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <footer className='mt-2 text-center text-xs text-gray-500 dark:text-gray-400'>
          <div className='py-1'>
            <div className='inline-block px-3 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 border dark:border-gray-700 shadow-sm'>
              © 2025 ~ <span className='font-semibold'>Nguyenwolf</span>
            </div>
          </div>
        </footer>

        {/* Toast Container */}
        <ToastContainer
          position='bottom-right'
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme='colored'
          limit={3}
        />
      </div>
    </ThemeProvider>
  );
}
