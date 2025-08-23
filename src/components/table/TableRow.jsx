import { formatAmount, formatPrice } from '../../utils/helpers';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRef } from 'react';

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
  const deleteButtonRef = useRef(null);


    const renderPriceAndReward = () => {
    const cd = getCountdownText(row.launchAt, Date.now());
    const priceNum = Number(row.price) || 0;
    
    if (priceNum > 0) {
      return (
        <>
          <td className='px-3 py-3 text-center tabular-nums text-sm dark:text-white'>
            ${formatPrice(priceNum)}
          </td>
          <td className='px-3 py-3 text-center tabular-nums font-medium text-sm dark:text-white'>
            ${formatPrice(row.value)}
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
          ${formatPrice(0)}
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
           {row.logo ? (
             <img
               src={row.logo}
               alt={`${row.name} logo`}
               className="w-6 h-6 rounded-full flex-shrink-0"
               onError={(e) => {
                 e.target.style.display = 'none';
               }}
             />
           ) : row.apiId && tokenLogos[row.apiId] && (
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
            {row.symbol || row.name}
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
          ${formatPrice(row.highestPrice)}
        </td>
      )}

             {/* Actions */}
       <td className='px-3 py-3 text-right sticky right-0 z-10 actions-column' style={{ backgroundColor: 'inherit' }}>
         <div className='flex items-center justify-end gap-2'>
           <button
             onClick={() => onStartEdit(index)}
             className='inline-flex items-center px-3 py-2 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white shadow-sm text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md gap-2'
             title='Edit'
           >
             <EditIcon sx={{ fontSize: 16 }} />
             Edit
           </button>
           <button
             ref={deleteButtonRef}
             onClick={() => {
               const buttonElement = deleteButtonRef.current;
               if (buttonElement) {
                 const rect = buttonElement.getBoundingClientRect();
                 const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                 const position = {
                   top: rect.bottom + scrollTop + 8,
                   left: Math.max(16, Math.min(rect.left, window.innerWidth - 384 - 16))
                 };
                 onDelete(index, position);
               } else {
                 onDelete(index);
               }
             }}
             className='inline-flex items-center px-3 py-2 rounded-2xl bg-red-500 hover:bg-red-600 text-white shadow-sm text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md gap-2'
             title='Delete'
           >
             <DeleteIcon sx={{ fontSize: 16 }} />
             Delete
           </button>
         </div>
       </td>
    </tr>
  );
}
