// API endpoints for frontend to call
const API_BASE = '/api/coingecko';

export const apiEndpoints = {
  // Get prices for multiple tokens
  getPrices: (ids, vs_currencies = 'usd') => 
    `${API_BASE}/prices?ids=${encodeURIComponent(Array.isArray(ids) ? ids.join(',') : ids)}&vs_currencies=${encodeURIComponent(Array.isArray(vs_currencies) ? vs_currencies.join(',') : vs_currencies)}`,
  
  // Get token info (logo, symbol, name)
  getTokenInfo: (id) => 
    `${API_BASE}/token-info?id=${encodeURIComponent(id)}`,
  
  // Get contract addresses
  getContractAddresses: (id) => 
    `${API_BASE}/contract-addresses?id=${encodeURIComponent(id)}`,
  
  // Get ATH data
  getATH: (id, vs_currency = 'usd') => 
    `${API_BASE}/ath?id=${encodeURIComponent(id)}&vs_currency=${encodeURIComponent(vs_currency)}`,
  
  // Batch endpoints
  getBatchPrices: (ids, vs_currencies = 'usd') => 
    `${API_BASE}/batch-prices?ids=${encodeURIComponent(Array.isArray(ids) ? ids.join(',') : ids)}&vs_currencies=${encodeURIComponent(Array.isArray(vs_currencies) ? vs_currencies.join(',') : vs_currencies)}`,
  
  getBatchTokenInfo: (ids) => 
    `${API_BASE}/batch-token-info?ids=${encodeURIComponent(Array.isArray(ids) ? ids.join(',') : ids)}`,
  
  getBatchContractAddresses: (ids) => 
    `${API_BASE}/batch-contract-addresses?ids=${encodeURIComponent(Array.isArray(ids) ? ids.join(',') : ids)}`,
  
  getBatchATH: (ids, vs_currency = 'usd') => 
    `${API_BASE}/batch-ath?ids=${encodeURIComponent(Array.isArray(ids) ? ids.join(',') : ids)}&vs_currency=${encodeURIComponent(vs_currency)}`
};

// Helper function to make API calls
export async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Convenience functions
export const api = {
  // Single token operations
  async getPrices(ids, vs_currencies = 'usd') {
    return await apiCall(apiEndpoints.getPrices(ids, vs_currencies));
  },
  
  async getTokenInfo(id) {
    return await apiCall(apiEndpoints.getTokenInfo(id));
  },
  
  async getContractAddresses(id) {
    return await apiCall(apiEndpoints.getContractAddresses(id));
  },
  
  async getATH(id, vs_currency = 'usd') {
    return await apiCall(apiEndpoints.getATH(id, vs_currency));
  },
  
  // Batch operations
  async getBatchPrices(ids, vs_currencies = 'usd') {
    return await apiCall(apiEndpoints.getBatchPrices(ids, vs_currencies));
  },
  
  async getBatchTokenInfo(ids) {
    return await apiCall(apiEndpoints.getBatchTokenInfo(ids));
  },
  
  async getBatchContractAddresses(ids) {
    return await apiCall(apiEndpoints.getBatchContractAddresses(ids));
  },
  
  async getBatchATH(ids, vs_currency = 'usd') {
    return await apiCall(apiEndpoints.getBatchATH(ids, vs_currency));
  }
};
