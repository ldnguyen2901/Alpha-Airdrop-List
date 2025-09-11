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


