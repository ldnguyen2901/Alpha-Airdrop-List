import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3002;

// CoinGecko API base URL
const CG_BASE = "https://api.coingecko.com/api/v3";

// Rate limiting configuration
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests (increased for safety)

// Cache for responses
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

// Helper function to wait for rate limiting
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
};

// Helper function to get cached response
const getCachedResponse = (key) => {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

// Helper function to set cached response
const setCachedResponse = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Main proxy function with retry logic
async function coinGeckoProxy(endpoint, params = {}, maxRetries = 3) {
  const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
  
  // Check cache first
  const cached = getCachedResponse(cacheKey);
  if (cached) {
    console.log(`📦 Returning cached response for: ${endpoint}`);
    return cached;
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Wait for rate limiting
    await waitForRateLimit();
    
    try {
      const url = `${CG_BASE}${endpoint}`;
      console.log(`🌐 Making request to: ${url} (attempt ${attempt}/${maxRetries})`);
      
      const response = await axios.get(url, {
        params,
        timeout: 90000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; AirdropTracker/1.0)'
        }
      });
      
      console.log(`✅ Success: ${endpoint}`);
      
      // Cache the response
      setCachedResponse(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`❌ Error in ${endpoint} (attempt ${attempt}/${maxRetries}):`, error.response?.status, error.response?.data || error.message);
      
      // If it's a 429 error and we have retries left, wait longer and retry
      if (error.response?.status === 429 && attempt < maxRetries) {
        const retryAfter = parseInt(error.response.headers['retry-after']) || 60;
        console.log(`⏳ Rate limited. Waiting ${retryAfter} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      // For other errors or final attempt, throw the error
      throw error;
    }
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/coingecko/prices', async (req, res) => {
  try {
    const { ids, vs_currencies = 'usd' } = req.query;
    if (!ids) {
      return res.status(400).json({ error: 'ids parameter is required' });
    }
    
    const idArray = ids.split(',');
    const result = await coinGeckoProxy('/simple/price', {
      ids: idArray.join(','),
      vs_currencies,
      include_last_updated_at: false
    });
    res.json(result);
  } catch (error) {
    console.error('Error in /api/coingecko/prices:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/coingecko/token-info', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'id parameter is required' });
    }
    
    const result = await coinGeckoProxy(`/coins/${id}`, {
      localization: false,
      tickers: false,
      market_data: false,
      community_data: false,
      developer_data: false,
      sparkline: false
    });
    res.json(result);
  } catch (error) {
    console.error('Error in /api/coingecko/token-info:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/coingecko/contract-addresses', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'id parameter is required' });
    }
    
    const result = await coinGeckoProxy(`/coins/${id}/contract/contract_addresses`);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/coingecko/contract-addresses:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/coingecko/ath', async (req, res) => {
  try {
    const { id, vs_currency = 'usd' } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'id parameter is required' });
    }
    
    const result = await coinGeckoProxy(`/coins/${id}/ohlc`, {
      vs_currency,
      days: 'max'
    });
    res.json(result);
  } catch (error) {
    console.error('Error in /api/coingecko/ath:', error);
    res.status(500).json({ error: error.message });
  }
});

// Batch endpoints - Fetch BTC/ETH/BNB first, then other tokens in batches
app.get('/api/coingecko/batch-prices', async (req, res) => {
  try {
    const { ids, vs_currencies = 'usd' } = req.query;
    if (!ids) {
      return res.status(400).json({ error: 'ids parameter is required' });
    }
    
    const idArray = ids.split(',');
    console.log(`📊 Total tokens to fetch: ${idArray.length}`);
    
    const results = {};
    
    // Step 1: Fetch BTC, ETH, BNB first (main tokens)
    const mainTokens = ['bitcoin', 'ethereum', 'binancecoin'];
    const mainTokensToFetch = mainTokens.filter(token => idArray.includes(token));
    
    if (mainTokensToFetch.length > 0) {
      console.log(`🏆 Fetching main tokens first: ${mainTokensToFetch.join(', ')}`);
      
      try {
        const mainTokensResult = await coinGeckoProxy('/simple/price', {
          ids: mainTokensToFetch.join(','),
          vs_currencies,
          include_last_updated_at: false
        });
        
        Object.assign(results, mainTokensResult);
        console.log(`✅ Main tokens completed: ${Object.keys(mainTokensResult).length} prices fetched`);
        
        // Minimal delay after main tokens to respect pacing
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ Error fetching main tokens:`, error);
      }
    }
    
    // Step 2: Fetch other tokens in batches of 50
    const otherTokens = idArray.filter(token => !mainTokens.includes(token));
    
    if (otherTokens.length > 0) {
      console.log(`📦 Fetching other tokens: ${otherTokens.length} tokens`);
      
      const batchSize = 50;
      
      for (let i = 0; i < otherTokens.length; i += batchSize) {
        const batch = otherTokens.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(otherTokens.length / batchSize);
        
        console.log(`📦 Fetching other tokens batch ${batchNumber}/${totalBatches}: ${batch.length} tokens`);
        
        try {
          const batchResult = await coinGeckoProxy('/simple/price', {
            ids: batch.join(','),
            vs_currencies,
            include_last_updated_at: false
          });
          
          Object.assign(results, batchResult);
          console.log(`✅ Other tokens batch ${batchNumber} completed: ${Object.keys(batchResult).length} prices fetched`);
          
          // Minimal delay between batches; global limiter handles spacing
          if (i + batchSize < otherTokens.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          console.error(`❌ Error in other tokens batch ${batchNumber}:`, error);
          // Continue with next batch even if current fails
        }
      }
    }
    
    console.log(`🎉 All batches completed. Total prices fetched: ${Object.keys(results).length}`);
    res.json(results);
  } catch (error) {
    console.error('Error in /api/coingecko/batch-prices:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/coingecko/batch-token-info', async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ error: 'ids parameter is required' });
    }
    
    const idArray = ids.split(',');
    console.log(`📊 Total tokens to fetch info: ${idArray.length}`);
    
    const results = {};
    const batchSize = 50;
    
    for (let i = 0; i < idArray.length; i += batchSize) {
      const batch = idArray.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(idArray.length / batchSize);
      
      console.log(`📦 Fetching token info batch ${batchNumber}/${totalBatches}: ${batch.length} tokens`);
      
      for (const id of batch) {
        try {
          const info = await coinGeckoProxy(`/coins/${id}`, {
            localization: false,
            tickers: false,
            market_data: false,
            community_data: false,
            developer_data: false,
            sparkline: false
          });
          results[id] = {
            id: info.id,
            symbol: info.symbol,
            name: info.name,
            image: info.image
          };
        } catch (error) {
          console.error(`❌ Error fetching info for ${id}:`, error);
        }
      }
      
      console.log(`✅ Token info batch ${batchNumber} completed: ${Object.keys(results).length} total tokens processed`);
      
      // Minimal delay between batches; global limiter handles spacing
      if (i + batchSize < idArray.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`🎉 All token info batches completed. Total tokens processed: ${Object.keys(results).length}`);
    res.json(results);
  } catch (error) {
    console.error('Error in /api/coingecko/batch-token-info:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/coingecko/batch-contract-addresses', async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ error: 'ids parameter is required' });
    }
    
    const idArray = ids.split(',');
    console.log(`📊 Total tokens to fetch contracts: ${idArray.length}`);
    
    const results = {};
    const batchSize = 50;
    
    for (let i = 0; i < idArray.length; i += batchSize) {
      const batch = idArray.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(idArray.length / batchSize);
      
      console.log(`📦 Fetching contract addresses batch ${batchNumber}/${totalBatches}: ${batch.length} tokens`);
      
      for (const id of batch) {
        try {
          const contracts = await coinGeckoProxy(`/coins/${id}/contract/contract_addresses`);
          if (contracts && contracts.length > 0) {
            results[id] = {
              contractAddress: contracts[0].contract_address
            };
          }
        } catch (error) {
          console.error(`❌ Error fetching contract for ${id}:`, error);
        }
      }
      
      console.log(`✅ Contract addresses batch ${batchNumber} completed: ${Object.keys(results).length} total contracts found`);
      
      // Minimal delay between batches; global limiter handles spacing
      if (i + batchSize < idArray.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`🎉 All contract addresses batches completed. Total contracts found: ${Object.keys(results).length}`);
    res.json(results);
  } catch (error) {
    console.error('Error in /api/coingecko/batch-contract-addresses:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/coingecko/batch-ath', async (req, res) => {
  try {
    const { ids, vs_currency = 'usd' } = req.query;
    if (!ids) {
      return res.status(400).json({ error: 'ids parameter is required' });
    }
    
    const idArray = ids.split(',');
    console.log(`📊 Total tokens to fetch ATH: ${idArray.length}`);
    
    const results = {};
    const batchSize = 50;
    
    for (let i = 0; i < idArray.length; i += batchSize) {
      const batch = idArray.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(idArray.length / batchSize);
      
      console.log(`📦 Fetching ATH batch ${batchNumber}/${totalBatches}: ${batch.length} tokens`);
      
      for (const id of batch) {
        try {
          const ohlc = await coinGeckoProxy(`/coins/${id}/ohlc`, {
            vs_currency,
            days: 'max'
          });
          if (ohlc && ohlc.length > 0) {
            // Find highest price from OHLC data
            const prices = ohlc.map(candle => candle[2]); // candle[2] is high price
            const ath = Math.max(...prices);
            results[id] = ath;
          }
        } catch (error) {
          console.error(`❌ Error fetching ATH for ${id}:`, error);
        }
      }
      
      console.log(`✅ ATH batch ${batchNumber} completed: ${Object.keys(results).length} total ATH values found`);
      
      // Add delay between batches
      if (i + batchSize < idArray.length) {
        console.log(`⏳ Waiting 2 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`🎉 All ATH batches completed. Total ATH values found: ${Object.keys(results).length}`);
    res.json(results);
  } catch (error) {
    console.error('Error in /api/coingecko/batch-ath:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CoinGecko Proxy Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api/coingecko`);
});

export default app;
