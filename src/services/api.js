import { api } from '../api/endpoints';

// Clear contract cache (for compatibility)
export const clearContractCache = () => {
  console.log('🧹 Contract cache cleared (using new proxy)');
};

// Clear logo cache (for compatibility)
export function clearLogoCache() {
  console.log('🧹 Logo cache cleared (using new proxy)');
}

/**
 * Fetch crypto prices using the new proxy
 */
export async function fetchCryptoPrices(ids, currency = 'usd') {
  if (!ids.length) return {};
  
  console.log(`🌐 Fetching prices for ${ids.length} tokens: ${ids.join(', ')}`);

  try {
    const data = await api.getBatchPrices(ids, currency);
    console.log(`✅ Crypto prices fetched successfully: ${Object.keys(data).length} tokens`);
    return data;
  } catch (error) {
    console.error('🌐 Error in fetchCryptoPrices:', error);
    throw error;
  }
}

/**
 * Fetch token logos and metadata using the new proxy
 */
export async function fetchTokenLogos(ids) {
  if (!ids.length) return {};
  
  console.log(`🖼️ Fetching logos for ${ids.length} tokens: ${ids.join(', ')}`);

  try {
    const metaData = await api.getBatchTokenInfo(ids);
    
    // Transform to match expected format
    const result = {};
    for (const [id, meta] of Object.entries(metaData)) {
      if (meta) {
        result[id] = {
          logo: meta.image?.large || meta.image?.small || meta.image?.thumb || '',
          symbol: meta.symbol || '',
          name: meta.name || ''
        };
      }
    }
    
    console.log(`✅ Token logos fetched successfully: ${Object.keys(result).length} tokens`);
    return result;
  } catch (error) {
    console.error('🖼️ Error in fetchTokenLogos:', error);
    throw error;
  }
}

/**
 * Fetch token info (for single token)
 */
export async function fetchTokenInfo(apiId) {
  if (!apiId) return null;
  
  console.log(`🔄 Fetching token info for: ${apiId}`);

  try {
    const meta = await api.getTokenInfo(apiId);
    
    if (meta) {
      return {
        logo: meta.image?.large || meta.image?.small || meta.image?.thumb || '',
        symbol: meta.symbol || '',
        name: meta.name || ''
      };
    }
    
    return null;
  } catch (error) {
    console.error('🔄 Error in fetchTokenInfo:', error);
    throw error;
  }
}

/**
 * Fetch contract addresses using the new proxy
 */
export async function fetchContractAddresses(ids) {
  if (!ids.length) return {};
  
  console.log(`🔍 Fetching contract addresses for ${ids.length} tokens: ${ids.join(', ')}`);

  try {
    const contractData = await api.getBatchContractAddresses(ids);
    console.log(`✅ Contract addresses fetched successfully: ${Object.keys(contractData).length} tokens`);
    return contractData;
  } catch (error) {
    console.error('🔍 Error in fetchContractAddresses:', error);
    throw error;
  }
}

/**
 * Fetch ATH (All-Time High) data using the new proxy
 */
export async function fetchATH(ids) {
  if (!ids.length) return {};
  
  console.log(`📈 Fetching ATH for ${ids.length} tokens: ${ids.join(', ')}`);

  try {
    const athData = await api.getBatchATH(ids);
    console.log(`✅ ATH data fetched successfully: ${Object.keys(athData).length} tokens`);
    return athData;
  } catch (error) {
    console.error('📈 Error in fetchATH:', error);
    throw error;
  }
}




