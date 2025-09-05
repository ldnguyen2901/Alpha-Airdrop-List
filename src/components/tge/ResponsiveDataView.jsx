import React, { useState, useEffect } from 'react';
import { SortableTable, CardView } from './index';

export default function ResponsiveDataView({
  rows,
  onUpdateRow,
  onEditRow,
  onDeleteRow,
  searchToken,
  tokenLogos,
  highlightRowRef,
  showHighestPrice,
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint - mobile
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isMobile) {
    return (
      <CardView
        rows={rows}
        onEditRow={onEditRow}
        onDeleteRow={onDeleteRow}
        searchToken={searchToken}
        tokenLogos={tokenLogos}
        highlightRowRef={highlightRowRef}
        showHighestPrice={showHighestPrice}
      />
    );
  }

  return (
    <SortableTable
      rows={rows}
      onUpdateRow={onUpdateRow}
      onRemoveRow={onDeleteRow}
      searchToken={searchToken}
      tokenLogos={tokenLogos}
      ref={highlightRowRef}
      showHighestPrice={showHighestPrice}
    />
  );
}
