import { formatAmount, formatPrice, normalizeDateTime } from '../../utils/helpers';

export default function TableRow({
  row,
  index,
  onStartEdit,
  onDelete,
  showHighestPrice,
  getCountdownText,
  isHighlighted,
  tokenLogos
}) {


    const renderPriceAndReward = () => {
    const cd = getCountdownText(row.launchAt, Date.now());
    const priceNum = Number(row.price) || 0;
    
    if (priceNum > 0) {
      return (
        <>
          <td className='px-3 py-3 text-center tabular-nums text-sm dark:text-white'>
            {formatPrice(priceNum)}
          </td>
          <td className='px-3 py-3 text-center tabular-nums font-medium text-sm dark:text-white'>
            {formatPrice(row.value)}
          </td>
        </>
      );
    }

    if (cd) {
      return (
        <>
          <td className='px-3 py-3 text-center text-sm dark:text-white font-medium'>
            {cd}
          </td>
          <td className='px-3 py-3 text-center text-sm dark:text-white font-medium'>
            Wait for listing
          </td>
        </>
      );
    }

    return (
      <>
        <td className='px-3 py-3 text-center tabular-nums text-sm dark:text-white'>
          {formatPrice(0)}
        </td>
        <td className='px-3 py-3 text-center tabular-nums font-medium text-sm dark:text-white'>
          Wait for listing
        </td>
      </>
    );
  };

  return (
    <tr
             className={`group border-b border-gray-100 dark:border-gray-700 transition-all duration-200 ${
         String(row.apiId || '').trim() === ''
           ? 'bg-yellow-50 dark:bg-yellow-900'
           : index % 2 === 0
           ? 'bg-white dark:bg-gray-800'
           : 'bg-gray-50 dark:bg-gray-700'
       } hover:bg-blue-50 dark:hover:bg-blue-900 ${
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
        className={`px-3 py-3 sticky left-0`}
        style={{
          position: 'sticky',
          left: 0,
          zIndex: 20,
          backgroundColor: 'inherit',
          boxShadow: '2px 0 8px rgb(0,0,0)',
        }}
      >
                 <div className="flex items-center gap-2">
           {/* Token Logo */}
           {row.apiId && tokenLogos[row.apiId] && (
             <img
               src={tokenLogos[row.apiId].logo}
               alt={`${row.name} logo`}
               className="w-6 h-6 rounded-full flex-shrink-0"
               onError={(e) => {
                 e.target.style.display = 'none';
               }}
             />
           )}
           <span className="text-sm dark:text-white font-medium">
             {row.name}
           </span>
         </div>
      </td>

      {/* Amount */}
      <td className='px-3 py-3 text-left'>
        <span className="text-sm dark:text-white">
          {formatAmount(row.amount)}
        </span>
      </td>

      {/* Listing Time */}
      <td className='px-3 py-3 text-center'>
        <span className="text-sm dark:text-white">
          {row.launchAt || ''}
        </span>
      </td>

      {/* Point Priority */}
      <td className='px-3 py-3 text-center'>
        <span className="text-sm dark:text-white">
          {row.pointPriority}
        </span>
      </td>

      {/* Point FCFS */}
      <td className='px-3 py-3 text-center'>
        <span className="text-sm dark:text-white">
          {row.pointFCFS}
        </span>
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
       <td className='px-3 py-3 text-right sticky right-0 bg-inherit z-10'>
         <div className='flex items-center justify-end gap-2'>
           <button
             onClick={() => onStartEdit(index)}
             className='inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-medium transition-all duration-200 hover:scale-105 hover:shadow-md'
             title='Edit'
           >
             <svg className='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
               <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
             </svg>
             Edit
           </button>
           <button
             onClick={() => onDelete(index)}
             className='inline-flex items-center px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900 border border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-800 text-xs font-medium transition-all duration-200 hover:scale-105 hover:shadow-md'
             title='Delete'
           >
             <svg className='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
               <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
             </svg>
             Delete
           </button>
         </div>
       </td>
    </tr>
  );
}
