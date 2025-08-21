import { TABLE_HEADERS } from '../../utils/constants';

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
      Reward: 'value',
      'Highest Price': 'highestPrice',
    };
    return mapping[header];
  };

  return (
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
                <span className='text-[10px] xs:text-xs sm:text-sm'>
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
  );
}
