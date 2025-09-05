import React from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const SortIcons = ({ sortKey, currentSortKey, sortDirection, onSort }) => {
  const isCurrentSort = sortKey === currentSortKey;
  
  const handleAscClick = (e) => {
    e.stopPropagation();
    onSort(sortKey, 'asc');
  };
  
  const handleDescClick = (e) => {
    e.stopPropagation();
    onSort(sortKey, 'desc');
  };
  
  return (
    <div className="flex flex-col items-center gap-0">
      <div 
        onClick={handleAscClick}
        className="cursor-pointer p-0.5 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 -mb-1"
      >
        <KeyboardArrowUpIcon 
          sx={{ 
            fontSize: 14,
            color: isCurrentSort && sortDirection === 'asc' ? '#3b82f6' : '#6b7280',
            fontWeight: isCurrentSort && sortDirection === 'asc' ? 'bold' : 'normal',
            stroke: isCurrentSort && sortDirection === 'asc' ? '#3b82f6' : 'transparent',
            strokeWidth: isCurrentSort && sortDirection === 'asc' ? 1.5 : 0
          }} 
        />
      </div>
      <div 
        onClick={handleDescClick}
        className="cursor-pointer p-0.5 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 -mt-1"
      >
        <KeyboardArrowDownIcon 
          sx={{ 
            fontSize: 14,
            color: isCurrentSort && sortDirection === 'desc' ? '#3b82f6' : '#6b7280',
            fontWeight: isCurrentSort && sortDirection === 'desc' ? 'bold' : 'normal',
            stroke: isCurrentSort && sortDirection === 'desc' ? '#3b82f6' : 'transparent',
            strokeWidth: isCurrentSort && sortDirection === 'desc' ? 1.5 : 0
          }} 
        />
      </div>
    </div>
  );
};

export default SortIcons;
