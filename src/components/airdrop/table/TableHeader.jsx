import { TABLE_HEADERS } from '../../../utils';
import SortIcons from '../SortIcons';

export default function TableHeader({ 
  sortConfig, 
  requestSort, 
  getSortIcon, 
  showATH = true
}) {
  const getColumnKey = (header) => {
    const mapping = {
      Token: 'name',
      Amount: 'amount',
      'Listing time': 'launchAt',
      'API ID': 'apiId',
      'Point': 'pointPriority', // Sử dụng pointPriority làm key chính cho sorting
      'Token Price': 'price',
      Reward: 'reward',
      'AT(L-H)': 'ath', // Sử dụng ath làm key chính cho sorting
      'Contract': 'contract', // ⭐ (thêm mới)
      'Exchanges': 'exchanges', // ⭐ (thêm mới)
      'Chains': 'chains', // ⭐ (thêm mới)
      'Categories': 'categories', // ⭐ (thêm mới)
    };
    return mapping[header];
  };

  return (
    <thead className='bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 sticky top-0 z-30 border-b border-gray-200 dark:border-gray-600'>
      <tr>
        {TABLE_HEADERS.map((h) => {
          // Always skip API ID column in table display
          if (h === 'API ID') return null;
          // Skip AT(L-H) column if not showing (same as showATH)
          if (h === 'AT(L-H)' && !showATH) return null;
          // Skip Actions column in header (it's handled separately)
          if (h === 'Actions') return null;
          // Skip exchanges, chains, categories columns (hidden)
          if (h === 'Exchanges' || h === 'Chains' || h === 'Categories') return null;

          const columnKey = getColumnKey(h);
          const isSortable = columnKey && h !== '';

          return (
            <th
              key={h}
              className={`px-3 py-3 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap transition-colors duration-200 ${
                h === 'Token' || h === 'Amount'
                  ? 'text-left'
                  : 'text-center'
              } ${
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
                  h === 'AT(L-H)' || // Gộp ATH và ATL
                  h === 'Contract' || // ⭐ (thêm mới)
                  h === 'Listing time' ||
                  h === 'Point' || // Gộp Priority và FCFS
                  h === 'Exchanges' || // ⭐ (thêm mới)
                  h === 'Chains' || // ⭐ (thêm mới)
                  h === 'Categories' // ⭐ (thêm mới)
                    ? 'justify-center'
                    : ''
                }`}
              >
                <span className='text-[10px] xs:text-xs sm:text-sm'>
                  {h === 'Token'
                    ? 'Token'
                    : h === 'Token Price'
                    ? 'Price'
                    : h === 'Point'
                    ? 'Point'
                    : h === 'AT(L-H)'
                    ? 'AT(L-H)'
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
        {/* Actions Column Header */}
        <th className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap text-center">
          Actions
        </th>
      </tr>
    </thead>
  );
}
