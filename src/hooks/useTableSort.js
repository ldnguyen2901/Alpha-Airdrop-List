import { useState, useEffect } from 'react';
import { saveSortConfig, loadSortConfig } from '../utils/storage';

export function useTableSort() {
  const [sortConfig, setSortConfig] = useState(() => {
    const savedSort = loadSortConfig();
    return savedSort || { key: 'launchAt', direction: 'desc' };
  });

  useEffect(() => {
    saveSortConfig(sortConfig);
  }, [sortConfig]);

  const requestSort = (key, direction = null) => {
    let newDirection = direction;
    
    // If no direction specified, toggle based on current state
    if (!newDirection) {
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        newDirection = 'desc';
      } else {
        newDirection = 'asc';
      }
    }
    
    setSortConfig({ key, direction: newDirection });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return '↕️';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const sortRows = (rows, searchToken) => {
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
  };

  return {
    sortConfig,
    requestSort,
    getSortIcon,
    sortRows
  };
}
