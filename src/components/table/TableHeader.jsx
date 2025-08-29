import { TABLE_HEADERS } from '../../utils';
import { SortIcons } from '../SortIcons';

export default function TableHeader({ 
  sortConfig, 
  requestSort, 
  getSortIcon, 
  showHighestPrice 
}) {
  const getColumnKey = (header) => {
    const mapping = {
      Token: 'name',
      Amount: 'amount',
      'Listing time': 'launchAt',
      'API ID': 'apiId',
      'Point (Priority)': 'pointPriority',
      'Point (FCFS)': 'pointFCFS',
      'Token Price': 'price',
      Reward: 'reward',
      'Highest Price': 'highestPrice',
    };
    return mapping[header];
  };

  return (
    <thead className='bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 sticky top-0 z-30 border-b border-gray-200 dark:border-gray-600'>
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
              className={`text-left px-3 py-0.5 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap transition-colors duration-200 ${
                isSortable
                  ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none'
                  : ''
              } ${
                h === 'Token'
                  ? 'sticky left-0 top-0 z-30 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700'
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
                  h === 'Highest Price' ||
                  h === 'Listing time' ||
                  h === 'Point (Priority)' ||
                  h === 'Point (FCFS)'
                    ? 'justify-center'
                    : ''
                }`}
              >
                <span className='text-[10px] xs:text-xs sm:text-sm'>
                  {h === 'Token'
                    ? 'Token'
                    : h === 'Token Price'
                    ? 'Price'
                    : h === 'Point (Priority)'
                    ? 'Priority'
                    : h === 'Point (FCFS)'
                    ? 'FCFS'
                    : h}
                </span>
                                 {isSortable && (
                   <div className='text-xs flex items-center'>
                     <SortIcons 
                       sortKey={columnKey}
                       currentSortKey={sortConfig.key}
                       sortDirection={sortConfig.direction}
                       onSort={requestSort}
                     />
                   </div>
                 )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
