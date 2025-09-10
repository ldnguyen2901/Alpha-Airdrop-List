// Utility functions for handling multiple contracts per token

/**
 * Expand a single row with multiple contracts into multiple rows
 * @param {Object} row - The original row data
 * @returns {Array} Array of rows, one for each contract
 */
export function expandRowWithMultipleContracts(row) {
  if (!row || !row.contractAddresses || typeof row.contractAddresses !== 'object') {
    // If no contract addresses, return the original row
    return [row];
  }

  const contracts = Object.entries(row.contractAddresses);
  
  if (contracts.length === 0) {
    // If no contracts, return the original row
    return [row];
  }

  if (contracts.length === 1) {
    // If only one contract, update the main contract field and return
    const [chain, contract] = contracts[0];
    return [{
      ...row,
      contract: contract,
      primaryChain: chain
    }];
  }

  // Multiple contracts - create separate rows
  return contracts.map(([chain, contract], index) => ({
    ...row,
    contract: contract,
    primaryChain: chain,
    contractIndex: index,
    isMultiContract: true,
    totalContracts: contracts.length,
    // Add visual indicator for multi-contract tokens
    name: index === 0 ? row.name : `${row.name} (${chain})`,
    symbol: index === 0 ? row.symbol : `${row.symbol}-${chain.slice(0, 3).toUpperCase()}`
  }));
}

/**
 * Expand all rows in an array to handle multiple contracts
 * @param {Array} rows - Array of row data
 * @returns {Array} Expanded array of rows
 */
export function expandAllRowsWithMultipleContracts(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  const expandedRows = [];
  
  rows.forEach(row => {
    if (row && row !== null) {
      const expandedRowSet = expandRowWithMultipleContracts(row);
      expandedRows.push(...expandedRowSet);
    }
  });

  return expandedRows;
}

/**
 * Collapse multiple contract rows back to a single row
 * @param {Array} rows - Array of rows (some may be from same token)
 * @returns {Array} Collapsed array of rows
 */
export function collapseMultipleContractRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  const tokenMap = new Map();
  
  rows.forEach(row => {
    if (!row || row === null) return;
    
    const key = row.apiId;
    
    if (!tokenMap.has(key)) {
      // First time seeing this token
      tokenMap.set(key, {
        ...row,
        contractAddresses: {},
        chains: []
      });
    }
    
    const existingRow = tokenMap.get(key);
    
    // Add contract to contractAddresses
    if (row.contract && row.primaryChain) {
      existingRow.contractAddresses[row.primaryChain] = row.contract;
    }
    
    // Merge chains
    if (row.chains && Array.isArray(row.chains)) {
      existingRow.chains = [...new Set([...existingRow.chains, ...row.chains])];
    }
    
    // Keep the primary contract (first one)
    if (!existingRow.contract && row.contract) {
      existingRow.contract = row.contract;
    }
    
    // Remove multi-contract specific fields
    delete existingRow.contractIndex;
    delete existingRow.isMultiContract;
    delete existingRow.totalContracts;
    delete existingRow.primaryChain;
  });

  return Array.from(tokenMap.values());
}

/**
 * Get contract display info for a row
 * @param {Object} row - Row data
 * @returns {Object} Contract display information
 */
export function getContractDisplayInfo(row) {
  if (!row) {
    return { display: 'N/A', tooltip: '', isMultiContract: false };
  }

  // Hide contracts that contain 'atl-h' pattern
  if (row.contract && row.contract.toLowerCase().includes('atl-h')) {
    return { display: 'N/A', tooltip: '', isMultiContract: false };
  }

  if (row.isMultiContract && row.totalContracts > 1) {
    return {
      display: `${row.contract.slice(0, 6)}...${row.contract.slice(-4)} (${row.primaryChain})`,
      tooltip: `Contract: ${row.contract}\nChain: ${row.primaryChain}\nPart ${row.contractIndex + 1} of ${row.totalContracts}`,
      isMultiContract: true,
      contract: row.contract,
      chain: row.primaryChain
    };
  }

  if (row.contract) {
    return {
      display: row.contract.length > 10 ? `${row.contract.slice(0, 6)}...${row.contract.slice(-4)}` : row.contract,
      tooltip: `Contract: ${row.contract}`,
      isMultiContract: false,
      contract: row.contract,
      chain: row.primaryChain || 'ethereum'
    };
  }

  return { display: 'N/A', tooltip: '', isMultiContract: false };
}

/**
 * Check if a row has multiple contracts
 * @param {Object} row - Row data
 * @returns {boolean} True if row has multiple contracts
 */
export function hasMultipleContracts(row) {
  return row && 
         row.contractAddresses && 
         typeof row.contractAddresses === 'object' && 
         Object.keys(row.contractAddresses).length > 1;
}

/**
 * Get all contracts for a token
 * @param {Object} row - Row data
 * @returns {Array} Array of {chain, contract} objects
 */
export function getAllContractsForToken(row) {
  if (!row || !row.contractAddresses) {
    return row?.contract ? [{ chain: 'ethereum', contract: row.contract }] : [];
  }

  return Object.entries(row.contractAddresses).map(([chain, contract]) => ({
    chain,
    contract
  }));
}
