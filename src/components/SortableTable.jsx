import { useState, useMemo, useEffect } from 'react';
import { TABLE_HEADERS } from '../utils/constants';
import { normalizeDateTime, formatAmount, formatPrice } from '../utils/helpers';
import { saveSortConfig, loadSortConfig } from '../utils/storage';

export default function SortableTable({
  rows,
  onUpdateRow,
  onRemoveRow,
  showHighestPrice: showHighestPriceProp,
  searchToken,
}) {
  const [sortConfig, setSortConfig] = useState(() => {
    const savedSort = loadSortConfig();
    return savedSort || { key: null, direction: 'asc' };
  });
  const [rowDrafts, setRowDrafts] = useState({});
  const showHighestPrice = !!showHighestPriceProp;
  const [now, setNow] = useState(Date.now());
  const [editingModal, setEditingModal] = useState({ open: false, idx: -1 });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    idx: -1,
    token: '',
    input: '',
    error: '',
  });

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const isEditing = (sortedIndex) => {
    const actual = getActualIndex(sortedIndex);
    return rowDrafts[actual] !== undefined;
  };

  const startEditRow = (sortedIndex) => {
    const actual = getActualIndex(sortedIndex);
    if (actual === -1) return;
    // open inline modal for editing
    setRowDrafts((prev) => ({ ...prev, [actual]: { ...rows[actual] } }));
    setEditingModal({ open: true, idx: actual });
  };

  const saveRow = (sortedIndex) => {
    // Accept either a sortedIndex or an actual rows index (modal passes actual)
    let actual = getActualIndex(sortedIndex);
    if (
      actual === -1 &&
      Number.isInteger(sortedIndex) &&
      sortedIndex >= 0 &&
      sortedIndex < rows.length
    ) {
      actual = sortedIndex;
    }
    if (actual === -1) return;
    const draft = rowDrafts[actual];
    if (!draft) return;
    // normalize launchAt before saving and ensure date-only gets 00:00:00
    let normalizedLaunch = draft.launchAt
      ? normalizeDateTime(draft.launchAt) || draft.launchAt
      : draft.launchAt;
    if (normalizedLaunch && /^\d{2}\/\d{2}\/\d{4}$/.test(normalizedLaunch)) {
      normalizedLaunch = normalizedLaunch + ' 00:00:00';
    }
    const toSave = { ...draft, launchAt: normalizedLaunch, _forceTop: false };
    onUpdateRow(actual, toSave);
    setRowDrafts((prev) => {
      const next = { ...prev };
      delete next[actual];
      return next;
    });
    // close modal if open for this row
    setEditingModal((m) =>
      m && m.idx === actual ? { open: false, idx: -1 } : m,
    );
  };

  const handleDeleteRow = (rowIndex) => {
    // Open delete confirmation modal; require typing the token name to confirm deletion
    const rowToDelete = sortedRows[rowIndex];
    const actualIndex = rows.findIndex((r) => r === rowToDelete);
    if (actualIndex === -1) return;
    const tokenName = String(rows[actualIndex].name || '').trim();
    setDeleteModal({
      open: true,
      idx: actualIndex,
      token: tokenName,
      input: '',
      error: '',
    });
  };

  const confirmDelete = () => {
    const actual = deleteModal.idx;
    if (actual === -1) return;
    onRemoveRow(actual);
    setDeleteModal({ open: false, idx: -1, token: '', input: '', error: '' });
  };

  const sortedRows = useMemo(() => {
    const filtered = searchToken
      ? rows.filter((r) =>
          (r.name || '').toLowerCase().includes(searchToken.toLowerCase()),
        )
      : rows;
    const pinned = filtered.filter((r) => r._forceTop);
    const normal = filtered.filter((r) => !r._forceTop);
    if (!sortConfig.key) return [...pinned, ...normal];

    const sortedNormal = [...normal].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Xử lý các trường hợp đặc biệt
      if (
        sortConfig.key === 'amount' ||
        sortConfig.key === 'price' ||
        sortConfig.key === 'value'
      ) {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (sortConfig.key === 'launchAt') {
        // Sort by parsed Date object: accept DD/MM/YYYY or DD/MM/YYYY HH:mm:ss
        const parse = (v) => {
          if (!v) return null;
          const parts = v.trim().split(' ');
          const dateParts = parts[0].split('/');
          if (dateParts.length !== 3) return null;
          const d = Number(dateParts[0]);
          const mo = Number(dateParts[1]);
          const y = Number(dateParts[2]);
          let h = 0,
            mi = 0,
            s = 0;
          if (parts[1]) {
            const t = parts[1].split(':');
            h = Number(t[0] || 0);
            mi = Number(t[1] || 0);
            s = Number(t[2] || 0);
          }
          const dt = new Date(y, mo - 1, d, h, mi, s);
          return isNaN(dt.getTime()) ? null : dt;
        };

        const aDt = parse(aValue);
        const bDt = parse(bValue);
        if (aDt && bDt) {
          return sortConfig.direction === 'asc' ? aDt - bDt : bDt - aDt;
        }
        if (aDt && !bDt) return sortConfig.direction === 'asc' ? -1 : 1;
        if (!aDt && bDt) return sortConfig.direction === 'asc' ? 1 : -1;
        // fallback to string compare
        return sortConfig.direction === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return [...pinned, ...sortedNormal];
  }, [rows, sortConfig, searchToken]);

  // Save sort config when it changes
  useEffect(() => {
    saveSortConfig(sortConfig);
  }, [sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return '↕️';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const getActualIndex = (sortedIndex) => {
    const rowRef = sortedRows[sortedIndex];
    return rows.findIndex((r) => r === rowRef);
  };

  const getDraftField = (sortedIndex, field) => {
    const actual = getActualIndex(sortedIndex);
    const draft = rowDrafts[actual];
    return draft ? draft[field] : undefined;
  };

  const getColumnKey = (header) => {
    const mapping = {
      Token: 'name',
      Amount: 'amount',
      'Listing time': 'launchAt',
      'API ID': 'apiId',
      'Point (Priority)': 'pointPriority',
      'Point (FCFS)': 'pointFCFS',
      'Token Price': 'price',
      Reward: 'value',
      'Highest Price': 'highestPrice',
    };
    return mapping[header];
  };

  const formatDateTime = (value) => {
    if (!value) return value;
    const v = String(value).trim();

    // date-only: DD/MM/YYYY -> normalize to DD/MM/YYYY 00:00:00
    const dateOnly = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dateOnly) {
      const [, d, mo, y] = dateOnly;
      return `${String(d).padStart(2, '0')}/${String(mo).padStart(
        2,
        '0',
      )}/${y} 00:00:00`;
    }

    // full datetime: DD/MM/YYYY HH:mm:ss
    const full = v.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/,
    );
    if (full) {
      const [, d, mo, y, hh, mm, ss] = full;
      const D = Number(d);
      const M = Number(mo);
      const Y = Number(y);
      const H = Number(hh);
      const MIN = Number(mm);
      const S = Number(ss);
      if (
        D >= 1 &&
        D <= 31 &&
        M >= 1 &&
        M <= 12 &&
        Y >= 1900 &&
        Y <= 2100 &&
        H >= 0 &&
        H <= 23 &&
        MIN >= 0 &&
        MIN <= 59 &&
        S >= 0 &&
        S <= 59
      ) {
        return `${String(d).padStart(2, '0')}/${String(mo).padStart(
          2,
          '0',
        )}/${y} ${String(hh).padStart(2, '0')}:${String(mm).padStart(
          2,
          '0',
        )}:${String(ss).padStart(2, '0')}`;
      }
    }
    return value;
  };

  const parseLaunchAt = (value) => {
    if (!value) return null;
    const v = String(value).trim();
    const dateOnly = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dateOnly) {
      const [, d, mo, y] = dateOnly;
      const dt = new Date(Number(y), Number(mo) - 1, Number(d), 0, 0, 0);
      return isNaN(dt.getTime()) ? null : dt;
    }
    const m = v.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/,
    );
    if (!m) return null;
    const [, d, mo, y, h, mi, s] = m;
    const dt = new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      Number(s),
    );
    return isNaN(dt.getTime()) ? null : dt;
  };

  const getCountdownText = (launchAt) => {
    const dt = parseLaunchAt(launchAt);
    if (!dt) return null;
    const diff = dt.getTime() - now;
    if (diff <= 0) return null;
    const sec = Math.floor(diff / 1000);
    const hh = String(Math.floor(sec / 3600)).padStart(2, '0');
    const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const ss = String(sec % 60).padStart(2, '0');
    return `⏳ ${hh}:${mm}:${ss}`;
  };

  return (
    <div className='overflow-auto rounded-2xl border bg-white dark:bg-gray-800 shadow max-h-[calc(100vh-140px)] md:max-h-[calc(100vh-170px)] lg:max-h-[calc(100vh-200px)]'>
      <table className='w-full text-sm'>
        <thead className='bg-gray-100 dark:bg-gray-700 sticky top-0 z-30'>
          <tr>
            {TABLE_HEADERS.map((h) => {
              // Always skip API ID column in table display
              if (h === 'API ID') return null;
              // Skip Highest Price column if not showing
              if (h === 'Highest Price' && !showHighestPrice) return null;

              const columnKey = getColumnKey(h);
              const isSortable = columnKey && h !== '';

              return (
                <th
                  key={h}
                  className={`text-left px-1 py-2 font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap ${
                    isSortable
                      ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none'
                      : ''
                  } ${
                    h === 'Token'
                      ? 'sticky left-0 top-0 z-30 bg-gray-100 dark:bg-gray-700 sticky'
                      : ''
                  }`}
                  onClick={
                    isSortable ? () => requestSort(columnKey) : undefined
                  }
                  title={isSortable ? `Click to sort by ${h}` : ''}
                >
                  <div
                    className={`flex items-center gap-1 ${
                      h === 'Token Price' ||
                      h === 'Reward' ||
                      h === 'Highest Price'
                        ? 'justify-center'
                        : ''
                    }`}
                  >
                    <span className='text-xs sm:text-sm'>
                      {h === 'Token Price'
                        ? 'Price'
                        : h === 'Point (Priority)'
                        ? 'Priority'
                        : h === 'Point (FCFS)'
                        ? 'FCFS'
                        : h}
                    </span>
                    {isSortable && (
                      <span className='text-xs'>{getSortIcon(columnKey)}</span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((r, idx) => (
            <tr
              key={idx}
              className={`group border-t dark:border-gray-600 transition-colors duration-200 ${
                String(r.apiId || '').trim() === ''
                  ? 'bg-yellow-50 dark:bg-yellow-50'
                  : idx % 2 === 0
                  ? 'bg-white dark:bg-gray-800'
                  : 'bg-gray-50 dark:bg-gray-700'
              } hover:bg-gray-100 dark:hover:bg-gray-600`}
              style={
                typeof document !== 'undefined' &&
                document.documentElement.classList.contains('dark') &&
                String(r.apiId || '').trim() === ''
                  ? { backgroundColor: '#A29D85' }
                  : undefined
              }
            >
              <td
                className={`px-1 py-2 sticky left-0`}
                style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 20,
                  backgroundColor: 'inherit',
                  boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
                }}
              >
                <input
                  className={`w-20 sm:w-24 lg:w-28 xl:w-32 border rounded-lg px-2 py-1 text-xs sm:text-sm ${
                    isEditing(idx)
                      ? 'bg-white dark:bg-gray-700 dark:text-white'
                      : 'bg-transparent dark:bg-transparent dark:text-white'
                  }`}
                  value={
                    isEditing(idx) ? getDraftField(idx, 'name') ?? '' : r.name
                  }
                  onChange={(e) => {
                    if (!isEditing(idx)) return;
                    const actual = getActualIndex(idx);
                    setRowDrafts((prev) => ({
                      ...prev,
                      [actual]: { ...prev[actual], name: e.target.value },
                    }));
                  }}
                  placeholder='Bitcoin'
                  maxLength={20}
                  disabled={!isEditing(idx)}
                  style={
                    isEditing(idx)
                      ? undefined
                      : { backgroundColor: 'transparent' }
                  }
                />
              </td>
              <td
                className='px-1 py-2'
                style={{ position: 'relative', zIndex: 1 }}
              >
                <input
                  className={`w-16 sm:w-20 lg:w-24 xl:w-28 border rounded-lg px-2 py-1 text-xs sm:text-sm ${
                    isEditing(idx)
                      ? 'bg-white dark:bg-gray-700 dark:text-white'
                      : 'bg-transparent dark:bg-transparent dark:text-white'
                  }`}
                  type={isEditing(idx) ? 'number' : 'text'}
                  value={
                    isEditing(idx)
                      ? getDraftField(idx, 'amount') ?? ''
                      : formatAmount(r.amount)
                  }
                  onChange={(e) => {
                    if (!isEditing(idx)) return;
                    const actual = getActualIndex(idx);
                    setRowDrafts((prev) => ({
                      ...prev,
                      [actual]: { ...prev[actual], amount: e.target.value },
                    }));
                  }}
                  placeholder='1.23'
                  step='0.000001'
                  maxLength={10}
                  disabled={!isEditing(idx)}
                />
              </td>
              <td
                className='px-1 py-2'
                style={{ position: 'relative', zIndex: 1 }}
              >
                <input
                  className={`w-24 sm:w-28 lg:w-32 xl:w-36 border rounded-lg px-2 py-1 text-xs sm:text-sm ${
                    isEditing(idx)
                      ? 'bg-white dark:bg-gray-700 dark:text-white'
                      : 'bg-transparent dark:bg-transparent dark:text-white'
                  }`}
                  value={
                    isEditing(idx)
                      ? getDraftField(idx, 'launchAt') ?? ''
                      : r.launchAt || ''
                  }
                  onChange={(e) => {
                    if (!isEditing(idx)) return;
                    const value = e.target.value;
                    const sanitizedValue = value.replace(/[^0-9/\s:]/g, '');
                    const actual = getActualIndex(idx);
                    setRowDrafts((prev) => ({
                      ...prev,
                      [actual]: { ...prev[actual], launchAt: sanitizedValue },
                    }));
                  }}
                  onBlur={(e) => {
                    if (!isEditing(idx)) return;
                    const value = e.target.value.trim();
                    if (value) {
                      const normalized = normalizeDateTime(value) || value;
                      const formattedValue = formatDateTime(normalized);
                      const actual = getActualIndex(idx);
                      setRowDrafts((prev) => ({
                        ...prev,
                        [actual]: {
                          ...prev[actual],
                          launchAt:
                            formattedValue === value
                              ? normalized
                              : formattedValue,
                        },
                      }));
                    }
                  }}
                  placeholder='DD/MM/YYYY HH:mm:ss'
                  maxLength={19}
                  disabled={!isEditing(idx)}
                />
              </td>
              {/* API ID column removed from table rows; API ID is available only in Add/Edit forms */}
              <td
                className='px-1 py-2'
                style={{ position: 'relative', zIndex: 1 }}
              >
                <input
                  className={`w-16 sm:w-20 lg:w-24 xl:w-28 border rounded-lg px-2 py-1 text-xs sm:text-sm ${
                    isEditing(idx)
                      ? 'bg-white dark:bg-gray-700 dark:text-white'
                      : 'bg-transparent dark:bg-transparent dark:text-white'
                  }`}
                  value={
                    isEditing(idx)
                      ? getDraftField(idx, 'pointPriority') ?? ''
                      : r.pointPriority
                  }
                  onChange={(e) => {
                    if (!isEditing(idx)) return;
                    const actual = getActualIndex(idx);
                    setRowDrafts((prev) => ({
                      ...prev,
                      [actual]: {
                        ...prev[actual],
                        pointPriority: e.target.value,
                      },
                    }));
                  }}
                  placeholder=''
                  maxLength={8}
                  disabled={!isEditing(idx)}
                />
              </td>
              <td
                className='px-1 py-2'
                style={{ position: 'relative', zIndex: 1 }}
              >
                <input
                  className={`w-16 sm:w-20 lg:w-24 xl:w-28 border rounded-lg px-2 py-1 text-xs sm:text-sm ${
                    isEditing(idx)
                      ? 'bg-white dark:bg-gray-700 dark:text-white'
                      : 'bg-transparent dark:bg-transparent dark:text-white'
                  }`}
                  value={
                    isEditing(idx)
                      ? getDraftField(idx, 'pointFCFS') ?? ''
                      : r.pointFCFS
                  }
                  onChange={(e) => {
                    if (!isEditing(idx)) return;
                    const actual = getActualIndex(idx);
                    setRowDrafts((prev) => ({
                      ...prev,
                      [actual]: { ...prev[actual], pointFCFS: e.target.value },
                    }));
                  }}
                  placeholder=''
                  maxLength={8}
                  disabled={!isEditing(idx)}
                />
              </td>
              {(() => {
                const cd = getCountdownText(r.launchAt);
                // If countdown exists, show countdown and placeholder
                if (cd) {
                  return (
                    <>
                      <td className='px-1 py-2 text-center text-xs sm:text-sm dark:text-white font-medium'>
                        {cd}
                      </td>
                      <td className='px-1 py-2 text-center text-xs sm:text-sm dark:text-white font-medium'>
                        Wait for listing
                      </td>
                    </>
                  );
                }

                // Countdown ended or no valid date: if price is 0, show Wait for listing, otherwise show price and reward
                if (Number(r.price) === 0) {
                  return (
                    <>
                      <td className='px-1 py-2 text-center tabular-nums text-xs sm:text-sm dark:text-white'>
                        {formatPrice(r.price)}
                      </td>
                      <td className='px-1 py-2 text-center tabular-nums font-medium text-xs sm:text-sm dark:text-white'>
                        Wait for listing
                      </td>
                    </>
                  );
                }

                return (
                  <>
                    <td className='px-1 py-2 text-center tabular-nums text-xs sm:text-sm dark:text-white'>
                      {formatPrice(r.price)}
                    </td>
                    <td className='px-1 py-2 text-center tabular-nums font-medium text-xs sm:text-sm dark:text-white'>
                      {formatPrice(r.value)}
                    </td>
                  </>
                );
              })()}
              {showHighestPrice && (
                <td className='px-1 py-2 text-center tabular-nums text-xs sm:text-sm dark:text-white'>
                  {formatPrice(r.highestPrice)}
                </td>
              )}
              <td className='px-1 py-2 text-right'>
                <div className='flex items-center justify-end gap-2'>
                  <button
                    onClick={() => startEditRow(idx)}
                    className='px-2 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs'
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRow(idx)}
                    className='px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-900 border text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-800 text-xs'
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {sortedRows.length === 0 && (
            <tr>
              <td
                colSpan={
                  TABLE_HEADERS.filter((h) => {
                    // Always hide API ID column in table display
                    if (h === 'API ID') return false;
                    if (h === 'Highest Price' && !showHighestPrice)
                      return false;
                    return true;
                  }).length
                }
                className='px-3 py-6 text-center text-gray-500 dark:text-gray-400 text-sm'
              >
                No data. Click Add Row or Paste from Sheet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {/* Edit Modal - simple inline modal using editingModal state */}
      {editingModal && editingModal.open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4'>
          <div className='bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-xl'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold dark:text-white'>
                Edit Row
              </h3>
              <button
                onClick={() => setEditingModal({ open: false, idx: -1 })}
                className='text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100'
              >
                ✕
              </button>
            </div>

            {/* form fields bound to rowDrafts[editingModal.idx] */}
            <div className='grid grid-cols-1 gap-3'>
              {editingModal.idx !== -1 && rowDrafts[editingModal.idx] && (
                <>
                  <input
                    value={rowDrafts[editingModal.idx].name}
                    onChange={(e) =>
                      setRowDrafts((p) => ({
                        ...p,
                        [editingModal.idx]: {
                          ...p[editingModal.idx],
                          name: e.target.value,
                        },
                      }))
                    }
                    className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
                    placeholder='Token (required)'
                  />

                  <input
                    value={rowDrafts[editingModal.idx].amount}
                    onChange={(e) =>
                      setRowDrafts((p) => ({
                        ...p,
                        [editingModal.idx]: {
                          ...p[editingModal.idx],
                          amount: e.target.value,
                        },
                      }))
                    }
                    className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
                    placeholder='Amount'
                    type='number'
                    step='0.000001'
                  />

                  <input
                    value={rowDrafts[editingModal.idx].launchAt}
                    onChange={(e) =>
                      setRowDrafts((p) => ({
                        ...p,
                        [editingModal.idx]: {
                          ...p[editingModal.idx],
                          launchAt: e.target.value,
                        },
                      }))
                    }
                    className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
                    placeholder='Listing time (required): DD/MM/YYYY or DD/MM/YYYY HH:mm:ss'
                  />

                  <input
                    value={rowDrafts[editingModal.idx].apiId}
                    onChange={(e) =>
                      setRowDrafts((p) => ({
                        ...p,
                        [editingModal.idx]: {
                          ...p[editingModal.idx],
                          apiId: e.target.value,
                        },
                      }))
                    }
                    className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
                    placeholder='API ID'
                  />

                  <input
                    value={rowDrafts[editingModal.idx].pointPriority}
                    onChange={(e) =>
                      setRowDrafts((p) => ({
                        ...p,
                        [editingModal.idx]: {
                          ...p[editingModal.idx],
                          pointPriority: e.target.value,
                        },
                      }))
                    }
                    className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
                    placeholder='Point (Priority)'
                  />

                  <input
                    value={rowDrafts[editingModal.idx].pointFCFS}
                    onChange={(e) =>
                      setRowDrafts((p) => ({
                        ...p,
                        [editingModal.idx]: {
                          ...p[editingModal.idx],
                          pointFCFS: e.target.value,
                        },
                      }))
                    }
                    className='border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:text-white w-full'
                    placeholder='Point (FCFS)'
                  />

                  <div className='flex justify-end gap-2 mt-2'>
                    <button
                      onClick={() => setEditingModal({ open: false, idx: -1 })}
                      className='px-3 py-2 rounded-xl border dark:border-gray-600 text-sm dark:text-white'
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveRow(editingModal.idx)}
                      className='px-3 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-sm'
                    >
                      Save changes
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {deleteModal && deleteModal.open && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4'>
          <div className='bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-xl'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold dark:text-white'>
                Confirm Delete
              </h3>
              <button
                onClick={() =>
                  setDeleteModal({
                    open: false,
                    idx: -1,
                    token: '',
                    input: '',
                    error: '',
                  })
                }
                className='text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100'
              >
                ✕
              </button>
            </div>

            <div className='space-y-3'>
              <p className='text-sm text-gray-700 dark:text-gray-300'>
                You're about to delete this token. Review the details below and
                confirm to proceed.
              </p>

              {/* Show read-only summary of the row (use rowDrafts if present for the selected index) */}
              {deleteModal.idx !== -1 &&
                (() => {
                  const r =
                    rowDrafts[deleteModal.idx] || rows[deleteModal.idx] || {};
                  return (
                    <div className='grid grid-cols-1 gap-2'>
                      <input
                        value={r.name || ''}
                        readOnly
                        className='border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white w-full'
                        placeholder='Token'
                      />
                      <input
                        value={formatAmount(r.amount || '')}
                        readOnly
                        className='border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white w-full'
                        placeholder='Amount'
                      />
                      <input
                        value={r.launchAt || ''}
                        readOnly
                        className='border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white w-full'
                        placeholder='Listing time'
                      />
                      <input
                        value={r.apiId || ''}
                        readOnly
                        className='border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white w-full'
                        placeholder='API ID'
                      />
                      <input
                        value={r.pointPriority || ''}
                        readOnly
                        className='border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white w-full'
                        placeholder='Point (Priority)'
                      />
                      <input
                        value={r.pointFCFS || ''}
                        readOnly
                        className='border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white w-full'
                        placeholder='Point (FCFS)'
                      />
                    </div>
                  );
                })()}

              <div className='flex justify-end gap-2 mt-2'>
                <button
                  onClick={() =>
                    setDeleteModal({
                      open: false,
                      idx: -1,
                      token: '',
                      input: '',
                      error: '',
                    })
                  }
                  className='px-3 py-2 rounded-xl border dark:border-gray-600 text-sm dark:text-white'
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className='px-3 py-2 rounded-xl bg-rose-600 text-white text-sm'
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
