import { useCallback } from 'react';

export const useDuplicateCheck = (rows, setDuplicatesData, setShowDuplicatesModal) => {
  // Function to check for duplicate logos and token names
  const checkDuplicateLogosAndNames = useCallback(async () => {
  
    
    const duplicates = {
      logos: {},
      names: {},
      symbols: {},
      apiIds: {}
    };
    
    // Check for duplicates
    rows.filter(r => r && r !== null).forEach((row, index) => {
      // Check logo duplicates
      if (row.logo && row.logo.trim()) {
        if (!duplicates.logos[row.logo]) {
          duplicates.logos[row.logo] = [];
        }
        duplicates.logos[row.logo].push({
          index,
          apiId: row.apiId,
          name: row.name,
          symbol: row.symbol
        });
      }
      
      // Check name duplicates
      if (row.name && row.name.trim()) {
        if (!duplicates.names[row.name]) {
          duplicates.names[row.name] = [];
        }
        duplicates.names[row.name].push({
          index,
          apiId: row.apiId,
          name: row.name,
          symbol: row.symbol,
          logo: row.logo
        });
      }
      
      // Check symbol duplicates
      if (row.symbol && row.symbol.trim()) {
        if (!duplicates.symbols[row.symbol]) {
          duplicates.symbols[row.symbol] = [];
        }
        duplicates.symbols[row.symbol].push({
          index,
          apiId: row.apiId,
          name: row.name,
          symbol: row.symbol,
          logo: row.logo
        });
      }
      
      // Check API ID duplicates
      if (row.apiId && row.apiId.trim()) {
        if (!duplicates.apiIds[row.apiId]) {
          duplicates.apiIds[row.apiId] = [];
        }
        duplicates.apiIds[row.apiId].push({
          index,
          apiId: row.apiId,
          name: row.name,
          symbol: row.symbol,
          logo: row.logo
        });
      }
    });
    
    // Filter only actual duplicates (more than 1 occurrence)
    const actualDuplicates = {
      logos: Object.entries(duplicates.logos).filter(([logo, items]) => items.length > 1),
      names: Object.entries(duplicates.names).filter(([name, items]) => items.length > 1),
      symbols: Object.entries(duplicates.symbols).filter(([symbol, items]) => items.length > 1),
      apiIds: Object.entries(duplicates.apiIds).filter(([apiId, items]) => items.length > 1)
    };
    
    // Log results

    
    if (actualDuplicates.logos.length > 0) {
      
      
    }
    
    
    
    
    
    
    
    const totalDuplicates = actualDuplicates.logos.length + 
                           actualDuplicates.names.length + 
                           actualDuplicates.symbols.length + 
                           actualDuplicates.apiIds.length;
    
    // Show modal with results
    setDuplicatesData(actualDuplicates);
    setShowDuplicatesModal(true);
    
    return actualDuplicates;
  }, [rows, setDuplicatesData, setShowDuplicatesModal]);

  return {
    checkDuplicateLogosAndNames,
  };
};
