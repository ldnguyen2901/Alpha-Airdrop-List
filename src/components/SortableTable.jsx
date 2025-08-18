import { useState, useMemo, useEffect } from 'react';
import { TABLE_HEADERS } from '../utils/constants';
import { formatNumber } from '../utils/helpers';
import { saveSortConfig, loadSortConfig } from '../utils/storage';

export default function SortableTable({
  rows,
  onUpdateRow,
  onRemoveRow,
  showApiId: showApiIdProp,
  showHighestPrice: showHighestPriceProp,
  searchToken,
}) {
  const [sortConfig, setSortConfig] = useState(() => {
    const savedSort = loadSortConfig();
    return savedSort || { key: null, direction: 'asc' };
  });
  const [rowDrafts, setRowDrafts] = useState({});
  const showApiId = !!showApiIdProp;
  const showHighestPrice = !!showHighestPriceProp;
  const [now, setNow] = useState(Date.now());

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
    setRowDrafts((prev) => ({ ...prev, [actual]: { ...rows[actual] } }));
  };

  const saveRow = (sortedIndex) => {
    const actual = getActualIndex(sortedIndex);
    if (actual === -1) return;
    const draft = rowDrafts[actual];
    if (!draft) return;
    const toSave = { ...draft, _forceTop: false };
    onUpdateRow(actual, toSave);
    setRowDrafts((prev) => {
      const next = { ...prev };
      delete next[actual];
      return next;
    });
  };

  const handleDeleteRow = (rowIndex) => {
    // Find the actual row in the original rows array
    const rowToDelete = sortedRows[rowIndex];
    const actualIndex = rows.findIndex((r) => r === rowToDelete);
    if (actualIndex !== -1) {
      onRemoveRow(actualIndex);
    }
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
        // Sort theo thứ tự dd/mm/yyyy rồi mới đến hh:mm:ss
        aValue = aValue || '';
        bValue = bValue || '';
        if (aValue && bValue) {
          const aParts = aValue.split(' ');
          const bParts = bValue.split(' ');
          if (aParts.length === 2 && bParts.length === 2) {
            const aDate = aParts[0].split('/');
            const bDate = bParts[0].split('/');
            if (aDate.length === 3 && bDate.length === 3) {
              const aDateObj = new Date(aDate[2], aDate[1] - 1, aDate[0]);
              const bDateObj = new Date(bDate[2], bDate[1] - 1, bDate[0]);
              if (aDateObj.getTime() !== bDateObj.getTime()) {
                return sortConfig.direction === 'asc'
                  ? aDateObj - bDateObj
                  : bDateObj - aDateObj;
              }
              // Nếu cùng ngày thì sort theo thời gian
              const aTime = aParts[1];
              const bTime = bParts[1];
              return sortConfig.direction === 'asc'
                ? aTime.localeCompare(bTime)
                : bTime.localeCompare(aTime);
            }
          }
        }
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
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
    // Validate DD/MM/YYYY HH:mm:ss format
    const regex =
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    const match = value.match(regex);

    if (match) {
      const [, day, month, year, hour, minute, second] = match;

      // Validate ranges
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      const hourNum = parseInt(hour);
      const minuteNum = parseInt(minute);
      const secondNum = parseInt(second);

      if (
        dayNum >= 1 &&
        dayNum <= 31 &&
        monthNum >= 1 &&
        monthNum <= 12 &&
        yearNum >= 1900 &&
        yearNum <= 2100 &&
        hourNum >= 0 &&
        hourNum <= 23 &&
        minuteNum >= 0 &&
        minuteNum <= 59 &&
        secondNum >= 0 &&
        secondNum <= 59
      ) {
        // Return formatted string with leading zeros
        return `${day.padStart(2, '0')}/${month.padStart(
          2,
          '0',
        )}/${year} ${hour.padStart(2, '0')}:${minute.padStart(
          2,
          '0',
        )}:${second.padStart(2, '0')}`;
      }
    }
    return value; // Return original if invalid format
  };

  const parseLaunchAt = (value) => {
    if (!value) return null;
    const m = value.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/,
    );
    if (!m) return null;
    const [_, d, mo, y, h, mi, s] = m;
    const dt = new Date(+y, +mo - 1, +d, +h, +mi, +s);
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
              // Skip API ID column if not showing
              if (h === 'API ID' && !showApiId) return null;
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
                      ? 'sticky left-0 top-0 z-30 bg-gray-100 dark:bg-gray-700'
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
                      {h === 'Token Price' ? 'Token Price (USD)' : h}
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
              className={`border-t dark:border-gray-600 ${
                idx % 2 === 0
                  ? 'bg-white dark:bg-gray-800'
                  : 'bg-gray-50 dark:bg-gray-700'
              } hover:bg-gray-100 dark:hover:bg-gray-600`}
            >
              <td className='px-1 py-2 sticky left-0 z-10 bg-white dark:bg-gray-800'>
                <input
                  className='w-20 sm:w-24 lg:w-28 xl:w-32 border rounded-lg px-2 py-1 text-xs sm:text-sm bg-white dark:bg-gray-700 dark:text-white'
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
                />
              </td>
              <td className='px-1 py-2'>
                <input
                  className='w-16 sm:w-20 lg:w-24 xl:w-28 border rounded-lg px-2 py-1 text-xs sm:text-sm bg-white dark:bg-gray-700 dark:text-white'
                  type='number'
                  value={
                    isEditing(idx)
                      ? getDraftField(idx, 'amount') ?? ''
                      : r.amount
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
              <td className='px-1 py-2'>
                <input
                  className='w-24 sm:w-28 lg:w-32 xl:w-36 border rounded-lg px-2 py-1 text-xs sm:text-sm bg-white dark:bg-gray-700 dark:text-white'
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
                      const formattedValue = formatDateTime(value);
                      if (formattedValue !== value) {
                        const actual = getActualIndex(idx);
                        setRowDrafts((prev) => ({
                          ...prev,
                          [actual]: {
                            ...prev[actual],
                            launchAt: formattedValue,
                          },
                        }));
                      }
                    }
                  }}
                  placeholder='DD/MM/YYYY HH:mm:ss'
                  maxLength={19}
                  disabled={!isEditing(idx)}
                />
              </td>
              {showApiId && (
                <td className='px-1 py-2'>
                  <input
                    className='w-20 sm:w-24 lg:w-28 xl:w-32 border rounded-lg px-2 py-1 text-xs sm:text-sm bg-white dark:bg-gray-700 dark:text-white'
                    value={
                      isEditing(idx)
                        ? getDraftField(idx, 'apiId') ?? ''
                        : r.apiId
                    }
                    onChange={(e) => {
                      if (!isEditing(idx)) return;
                      const actual = getActualIndex(idx);
                      setRowDrafts((prev) => ({
                        ...prev,
                        [actual]: { ...prev[actual], apiId: e.target.value },
                      }));
                    }}
                    placeholder='bitcoin'
                    maxLength={15}
                    disabled={!isEditing(idx)}
                  />
                </td>
              )}
              <td className='px-1 py-2'>
                <input
                  className='w-16 sm:w-20 lg:w-24 xl:w-28 border rounded-lg px-2 py-1 text-xs sm:text-sm bg-white dark:bg-gray-700 dark:text-white'
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
                  placeholder='Priority'
                  maxLength={8}
                  disabled={!isEditing(idx)}
                />
              </td>
              <td className='px-1 py-2'>
                <input
                  className='w-16 sm:w-20 lg:w-24 xl:w-28 border rounded-lg px-2 py-1 text-xs sm:text-sm bg-white dark:bg-gray-700 dark:text-white'
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
                  placeholder='FCFS'
                  maxLength={8}
                  disabled={!isEditing(idx)}
                />
              </td>
              {(() => {
                const cd = getCountdownText(r.launchAt);
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
                return (
                  <>
                    <td className='px-1 py-2 text-center tabular-nums text-xs sm:text-sm dark:text-white'>
                      {formatNumber(r.price)}
                    </td>
                    <td className='px-1 py-2 text-center tabular-nums font-medium text-xs sm:text-sm dark:text-white'>
                      {formatNumber(r.value)}
                    </td>
                  </>
                );
              })()}
              {showHighestPrice && (
                <td className='px-1 py-2 text-center tabular-nums text-xs sm:text-sm dark:text-white'>
                  {formatNumber(r.highestPrice)}
                </td>
              )}
              <td className='px-1 py-2 text-right'>
                {isEditing(idx) ? (
                  <div className='flex items-center justify-end gap-2'>
                    <button
                      onClick={() => saveRow(idx)}
                      className='px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs'
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handleDeleteRow(idx)}
                      className='px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-900 border text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-800 text-xs'
                    >
                      Delete
                    </button>
                  </div>
                ) : (
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
                )}
              </td>
            </tr>
          ))}
          {sortedRows.length === 0 && (
            <tr>
              <td
                colSpan={
                  TABLE_HEADERS.filter((h) => {
                    if (h === 'API ID' && !showApiId) return false;
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
    </div>
  );
}
