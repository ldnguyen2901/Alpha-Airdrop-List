import axios from 'axios';

const CG_BASE = 'https://api.coingecko.com/api/v3';

// Per-instance limiter (best-effort in serverless)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 5000; // 5s

// Lightweight in-memory cache (best-effort)
const cache = new Map();
const CACHE_TTL = 30 * 1000;

const waitForRateLimit = async () => {
  const now = Date.now();
  const delta = now - lastRequestTime;
  if (delta < MIN_REQUEST_INTERVAL) {
    await new Promise(r => setTimeout(r, MIN_REQUEST_INTERVAL - delta));
  }
  lastRequestTime = Date.now();
};

const getCached = (key) => {
  const v = cache.get(key);
  if (v && (Date.now() - v.t) < CACHE_TTL) return v.d;
  return null;
};

const setCached = (key, data) => {
  cache.set(key, { d: data, t: Date.now() });
};

export async function coinGeckoProxy(endpoint, params = {}, maxRetries = 3) {
  const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await waitForRateLimit();
    try {
      const url = `${CG_BASE}${endpoint}`;
      const res = await axios.get(url, {
        params,
        timeout: 90000,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; AirdropTracker/1.0)'
        }
      });
      setCached(cacheKey, res.data);
      return res.data;
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 && attempt < maxRetries) {
        const retryAfter = parseInt(err.response?.headers?.['retry-after']) || 60;
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      throw err;
    }
  }
}

export function ok(res, data) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify(data));
}

export function badRequest(res, message) {
  res.status(400).json({ error: message });
}

export function serverError(res, error) {
  res.status(500).json({ error: error?.message || 'Internal Server Error' });
}


