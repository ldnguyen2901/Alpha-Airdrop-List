import { useEffect, useCallback } from 'react';
import { useGlobalPriceContext } from '../contexts';

// Hook to sync global prices to table rows
export const useGlobalPriceSync = (rows, updateRowPriceOnly) => {
  const globalPriceContext = useGlobalPriceContext();

  // Sync global prices to table rows
  const syncPricesToRows = useCallback(() => {
    if (!rows || rows.length === 0) {
      return;
    }

    if (!globalPriceContext.globalPrices || Object.keys(globalPriceContext.globalPrices).length === 0) {
      return;
    }

    let updatedCount = 0;
    rows.forEach((row, index) => {
      if (row && row.apiId && globalPriceContext.globalPrices[row.apiId]) {
        const newPrice = globalPriceContext.globalPrices[row.apiId].usd;
        
        // Only update if price has changed
        if (newPrice !== row.price) {
          updateRowPriceOnly(index, {
            price: newPrice
          });
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      console.log(`✅ Synced ${updatedCount} token prices from global context to table`);
    }
  }, [rows, updateRowPriceOnly, globalPriceContext.globalPrices]);

  // Auto-sync when global prices change
  useEffect(() => {
    syncPricesToRows();
  }, [syncPricesToRows]);

  return {
    syncPricesToRows
  };
};
