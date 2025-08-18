import React, { useEffect, useMemo, useRef, useState } from 'react';
import { newRow, CSV_HEADERS } from './utils/constants';
import { splitCSV } from './utils/helpers';
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
  const [refreshSec, setRefreshSec] = useState(60);
  const [loading, setLoading] = useState(false);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [btcPrice, setBtcPrice] = useState(0);
  const [ethPrice, setEthPrice] = useState(0);
  const [bnbPrice, setBnbPrice] = useState(0);
  const [showApiId, setShowApiId] = useState(false);
  const [showHighestPrice, setShowHighestPrice] = useState(false);
  const [searchToken, setSearchToken] = useState('');
  const timerRef = useRef(null);
  const unsubRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);
  const [syncing, setSyncing] = useState(false);

  // Lấy danh sách id hợp lệ
  const ids = useMemo(
    () => rows.map((r) => r.apiId.trim()).filter(Boolean),
    [rows],
  );

  async function fetchPrices() {
    // Luôn lấy giá BTC/ETH/BNB cho thẻ thống kê, đồng thời lấy các ID trong bảng
    const baseIds = ['bitcoin', 'ethereum', 'binancecoin'];
    const fetchIds = Array.from(new Set([...ids, ...baseIds].filter(Boolean)));
    if (!fetchIds.length) return;
    setLoading(true);
    try {
      const data = await fetchCryptoPrices(fetchIds, 'usd'); // mặc định USD

      // Update BTC and ETH prices
      setBtcPrice(data?.bitcoin?.usd ? Number(data.bitcoin.usd) : 0);
      setEthPrice(data?.ethereum?.usd ? Number(data.ethereum.usd) : 0);
      setBnbPrice(data?.binancecoin?.usd ? Number(data.binancecoin.usd) : 0);

      setRows((prev) =>
        prev.map((r) => {
          const key = r.apiId?.trim();
          const p = key && data[key]?.usd ? Number(data[key].usd) : 0;
          const amount = Number(r.amount) || 0;
          const currentValue = +(amount * p).toFixed(6);

          // Update highest price if current price is higher
          const highestPrice = Math.max(r.highestPrice || 0, p);

          return {
            ...r,
            price: p,
            value: currentValue,
            highestPrice: highestPrice,
          };
        }),
      );
    } catch (e) {
      console.error(e);
      toast.error('Failed to fetch prices. Please try again.', {
        position: 'bottom-right',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  }

  // Tự động refresh
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      fetchPrices();
    }, Math.max(5, Number(refreshSec) || 60) * 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(','), refreshSec]);

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
      const newRows = prev.map((r, i) => (i === idx ? { ...r, ...patch } : r));
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
  }

  function addEmptyRow() {
    setRows((prev) => {
      // luôn thêm dòng mới ở đầu và ghim tạm (_forceTop) cho đến khi Save
      const newRows = [newRow({ _forceTop: true }), ...prev];
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
    toast.success('New row added successfully!');
  }

  function removeRow(idx) {
    setRows((prev) => {
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
    const parsed = rowsText.map((line) => {
      const parts = line.includes('\t') ? line.split('\t') : splitCSV(line);
      const [
        name = '',
        amount = '',
        launchAt = '',
        apiId = '',
        pPri = '',
        pFcfs = '',
        price = '',
        value = '',
      ] = parts;
      return newRow({
        name: name?.trim(),
        amount: Number(amount) || 0,
        launchAt: launchAt?.trim(),
        apiId: apiId?.trim(),
        pointPriority: pPri?.trim(),
        pointFCFS: pFcfs?.trim(),
        price: Number(price) || 0,
        value: Number(value) || 0,
      });
    });

    // Kiểm tra trùng lặp
    const duplicates = checkDuplicates(parsed, rows);
    if (duplicates.length > 0) {
      handleDuplicateImport(duplicates, parsed);
    } else {
      setRows((prev) => {
        const newRows = [...prev, ...parsed];
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
        `Imported ${parsed.length} rows from clipboard successfully!`,
      );
    }
  }

  function handleImportExcel(data) {
    const parsedData = data.map((item) => newRow(item));

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
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6'>
        <div className='max-w-full mx-auto'>
          <Header
            refreshSec={refreshSec}
            setRefreshSec={setRefreshSec}
            loading={loading}
            onRefresh={fetchPrices}
            syncing={syncing}
          />

          <StatsCards
            rowsCount={rows.length}
            loading={loading}
            btcPrice={btcPrice}
            ethPrice={ethPrice}
            bnbPrice={bnbPrice}
            syncing={syncing}
          />

          <ActionButtons
            onAddRow={addEmptyRow}
            onPasteText={handlePaste}
            onExportCSV={exportCSV}
            onClearAll={clearAll}
            onImportExcel={() => setShowExcelUpload(true)}
            showApiId={showApiId}
            setShowApiId={setShowApiId}
            showHighestPrice={showHighestPrice}
            setShowHighestPrice={setShowHighestPrice}
            searchToken={searchToken}
            setSearchToken={setSearchToken}
          />

          <SortableTable
            rows={rows}
            onUpdateRow={updateRow}
            onRemoveRow={removeRow}
            showApiId={showApiId}
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
        <footer className='mt-2 text-center text-xs text-gray-500 dark:text-gray-400'>
          <div className='py-1'>
            <div className='inline-block px-3 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 border dark:border-gray-700 shadow-sm'>
              © <span className='font-semibold'>Nguyenwolf - Karama</span> 2025
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
