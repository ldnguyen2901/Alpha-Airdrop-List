import { formatAmount, formatPrice, normalizeDateTime } from '../../utils/helpers';

export default function TableRow({
  row,
  index,
  isEditing,
  getDraftField,
  onStartEdit,
  onDelete,
  showHighestPrice,
  getActualIndex,
  setRowDrafts,
  getCountdownText,
  sortedRows,
  rows,
  isHighlighted
}) {
  const handleNameChange = (e) => {
    if (!isEditing(index)) return;
    const actual = getActualIndex(index, sortedRows, rows);
    setRowDrafts((prev) => ({
      ...prev,
      [actual]: { ...prev[actual], name: e.target.value.toUpperCase() },
    }));
  };

  const handleAmountChange = (e) => {
    if (!isEditing(index)) return;
    const actual = getActualIndex(index, sortedRows, rows);
    setRowDrafts((prev) => ({
      ...prev,
      [actual]: { ...prev[actual], amount: e.target.value },
    }));
  };

  const handleLaunchAtChange = (e) => {
    if (!isEditing(index)) return;
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^0-9/\s:]/g, '');
    const actual = getActualIndex(index, sortedRows, rows);
    setRowDrafts((prev) => ({
      ...prev,
      [actual]: { ...prev[actual], launchAt: sanitizedValue },
    }));
  };

  const handleLaunchAtBlur = (e) => {
    if (!isEditing(index)) return;
    const value = e.target.value.trim();
    if (value) {
      const normalized = normalizeDateTime(value);
      if (normalized && normalized !== value) {
        const actual = getActualIndex(index, sortedRows, rows);
        setRowDrafts((prev) => ({
          ...prev,
          [actual]: { ...prev[actual], launchAt: normalized },
        }));
      }
    }
  };

  const handlePointPriorityChange = (e) => {
    if (!isEditing(index)) return;
    const actual = getActualIndex(index, sortedRows, rows);
    setRowDrafts((prev) => ({
      ...prev,
      [actual]: {
        ...prev[actual],
        pointPriority: e.target.value,
      },
    }));
  };

  const handlePointFCFSChange = (e) => {
    if (!isEditing(index)) return;
    const actual = getActualIndex(index, sortedRows, rows);
    setRowDrafts((prev) => ({
      ...prev,
      [actual]: { ...prev[actual], pointFCFS: e.target.value },
    }));
  };

  const renderPriceAndReward = () => {
    const cd = getCountdownText(row.launchAt, Date.now());
    const priceNum = Number(row.price) || 0;
    
    if (priceNum > 0) {
      return (
        <>
          <td className='px-1 py-2 text-center tabular-nums text-[11px] sm:text-sm dark:text-white'>
            {formatPrice(priceNum)}
          </td>
          <td className='px-1 py-2 text-center tabular-nums font-medium text-[11px] sm:text-sm dark:text-white'>
            {formatPrice(row.value)}
          </td>
        </>
      );
    }

    if (cd) {
      return (
        <>
          <td className='px-1 py-2 text-center text-[11px] sm:text-sm dark:text-white font-medium'>
            {cd}
          </td>
          <td className='px-1 py-2 text-center text-[11px] sm:text-sm dark:text-white font-medium'>
            Wait for listing
          </td>
        </>
      );
    }

    return (
      <>
        <td className='px-1 py-2 text-center tabular-nums text-[11px] sm:text-sm dark:text-white'>
          {formatPrice(0)}
        </td>
        <td className='px-1 py-2 text-center tabular-nums font-medium text-[11px] sm:text-sm dark:text-white'>
          Wait for listing
        </td>
      </>
    );
  };

  return (
    <tr
      className={`group border-t dark:border-gray-600 transition-colors duration-200 ${
        String(row.apiId || '').trim() === ''
          ? 'bg-yellow-50 dark:bg-yellow-50'
          : index % 2 === 0
          ? 'bg-white dark:bg-gray-800'
          : 'bg-gray-50 dark:bg-gray-700'
      } hover:bg-gray-100 dark:hover:bg-gray-600 ${
        isHighlighted ? 'row-highlight' : ''
      }`}
      style={
        typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark') &&
        String(row.apiId || '').trim() === ''
          ? { backgroundColor: '#A29D85' }
          : undefined
      }
    >
      {/* Token Name */}
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
          className={`w-20 sm:w-24 lg:w-28 xl:w-32 border rounded-lg px-2 py-1 text-[11px] sm:text-sm ${
            isEditing(index)
              ? 'bg-white dark:bg-gray-700 dark:text-white'
              : 'bg-transparent dark:bg-transparent dark:text-white'
          }`}
                     value={
             isEditing(index) ? getDraftField(index, 'name', sortedRows, rows) ?? '' : row.name
           }
          onChange={handleNameChange}
          maxLength={20}
          disabled={!isEditing(index)}
          style={
            isEditing(index)
              ? undefined
              : { backgroundColor: 'transparent' }
          }
        />
      </td>

      {/* Amount */}
      <td
        className='px-1 py-2'
        style={{ position: 'relative', zIndex: 1 }}
      >
        <input
          className={`w-16 sm:w-20 lg:w-24 xl:w-28 border rounded-lg px-2 py-1 text-[11px] sm:text-sm ${
            isEditing(index)
              ? 'bg-white dark:bg-gray-700 dark:text-white'
              : 'bg-transparent dark:bg-transparent dark:text-white'
          }`}
          type={isEditing(index) ? 'number' : 'text'}
                     value={
             isEditing(index)
               ? getDraftField(index, 'amount', sortedRows, rows) ?? ''
               : formatAmount(row.amount)
           }
          onChange={handleAmountChange}
          step='0.000001'
          maxLength={10}
          disabled={!isEditing(index)}
        />
      </td>

      {/* Listing Time */}
      <td
        className='px-1 py-2'
        style={{ position: 'relative', zIndex: 1 }}
      >
        <input
          className={`w-24 sm:w-28 lg:w-32 xl:w-36 border rounded-lg px-2 py-1 text-[11px] sm:text-sm ${
            isEditing(index)
              ? 'bg-white dark:bg-gray-700 dark:text-white'
              : 'bg-transparent dark:bg-transparent dark:text-white'
          }`}
                     value={
             isEditing(index)
               ? getDraftField(index, 'launchAt', sortedRows, rows) ?? ''
               : row.launchAt || ''
           }
          onChange={handleLaunchAtChange}
          onBlur={handleLaunchAtBlur}
          maxLength={19}
          disabled={!isEditing(index)}
        />
      </td>

      {/* Point Priority */}
      <td
        className='px-1 py-2'
        style={{ position: 'relative', zIndex: 1 }}
      >
        <input
          className={`w-16 sm:w-20 lg:w-24 xl:w-28 border rounded-lg px-2 py-1 text-[11px] sm:text-sm ${
            isEditing(index)
              ? 'bg-white dark:bg-gray-700 dark:text-white'
              : 'bg-transparent dark:bg-transparent dark:text-white'
          }`}
                     value={
             isEditing(index)
               ? getDraftField(index, 'pointPriority', sortedRows, rows) ?? ''
               : row.pointPriority
           }
          onChange={handlePointPriorityChange}
          maxLength={8}
          disabled={!isEditing(index)}
        />
      </td>

      {/* Point FCFS */}
      <td
        className='px-1 py-2'
        style={{ position: 'relative', zIndex: 1 }}
      >
        <input
          className={`w-16 sm:w-20 lg:w-24 xl:w-28 border rounded-lg px-2 py-1 text-[11px] sm:text-sm ${
            isEditing(index)
              ? 'bg-white dark:bg-gray-700 dark:text-white'
              : 'bg-transparent dark:bg-transparent dark:text-white'
          }`}
                     value={
             isEditing(index)
               ? getDraftField(index, 'pointFCFS', sortedRows, rows) ?? ''
               : row.pointFCFS
           }
          onChange={handlePointFCFSChange}
          maxLength={8}
          disabled={!isEditing(index)}
        />
      </td>

      {/* Price and Reward */}
      {renderPriceAndReward()}

      {/* Highest Price */}
      {showHighestPrice && (
        <td className='px-1 py-2 text-center tabular-nums text-[11px] sm:text-sm dark:text-white'>
          {formatPrice(row.highestPrice)}
        </td>
      )}

             {/* Actions */}
       <td className='px-1 py-2 text-right'>
         <div className='flex items-center justify-end gap-2'>
           <button
             onClick={() => onStartEdit(index)}
             className='px-2 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-[11px] sm:text-xs transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md'
           >
             Edit
           </button>
           <button
             onClick={() => onDelete(index)}
             className='px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-900 border text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-800 text-[11px] sm:text-xs transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md'
           >
             Delete
           </button>
         </div>
       </td>
    </tr>
  );
}
