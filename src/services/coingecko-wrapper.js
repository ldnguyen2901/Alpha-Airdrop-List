import axios from "axios";

/**
 * CoinGecko public wrapper với:
 * - Batching + Throttling để tránh 429
 * - Exponential backoff khi 429
 * - Cache (memory) cho price & metadata
 */
export class CoinGeckoClient {
  constructor({
    baseURL = "https://api.coingecko.com/api/v3",
    // throttling
    requestsPerWindow = 25,   // số request tối đa mỗi cửa sổ
    windowMs = 60_000,        // cửa sổ thời gian (ms)
    minGapMs = 1_200,         // nghỉ tối thiểu giữa 2 request thực tế (ms)
    // cache
    priceTTL = 30_000,        // TTL cache price (ms)
    metaTTL = 3600_000,       // TTL cache metadata (ms)
    // retry
    maxRetries = 4,           // tối đa retry khi 429/5xx
    backoffBaseMs = 1_500,    // backoff = base * 2^attempt
  } = {}) {
    this.http = axios.create({ baseURL, timeout: 12_000 });
    this.requestsPerWindow = requestsPerWindow;
    this.windowMs = windowMs;
    this.minGapMs = minGapMs;
    this.maxRetries = maxRetries;
    this.backoffBaseMs = backoffBaseMs;

    // token bucket / sliding window counters
    this._timestamps = [];        // dấu thời gian các request đã gửi
    this._lastSentAt = 0;

    // queue batching cho /simple/price
    this._priceQueue = new Map(); // key: vsKey -> { ids:Set, resolvers: [resolve] }
    this._priceFlushTimer = null;
    this._batchDelayMs = 100;     // gom yêu cầu trong ~100ms

    // cache
    this._cachePrice = new Map(); // key: `${id}|${vsKey}` -> { t, data }
    this._cacheMeta  = new Map(); // key: id -> { t, data }
    this.priceTTL = priceTTL;
    this.metaTTL = metaTTL;
  }

  // ====== Public APIs ======

  /**
   * Lấy giá cho nhiều ids và nhiều vs_currencies trong 1 call batched
   * @param {string[]} ids
   * @param {string[]|string} vs ("usd" | ["usd","vnd"])
   * @returns {Promise<Object>} { [id]: { usd: number, vnd?: number, ... } }
   */
  async getPrices(ids, vs = ["usd"]) {
    const vsKey = Array.isArray(vs) ? vs.join(",") : vs;
    const now = Date.now();

    // trả từ cache nếu đủ
    const result = {};
    const miss = [];
    for (const id of ids) {
      const key = `${id}|${vsKey}`;
      const c = this._cachePrice.get(key);
      if (c && (now - c.t) < this.priceTTL) {
        result[id] = c.data;
      } else {
        miss.push(id);
      }
    }
    if (miss.length === 0) return result;

    // gom vào queue batch
    const batchPromise = new Promise((resolve, reject) => {
      const item = this._priceQueue.get(vsKey) || { ids: new Set(), resolvers: [] };
      miss.forEach(id => item.ids.add(id));
      item.resolvers.push({ resolve, reject, want: miss });
      this._priceQueue.set(vsKey, item);
      this._schedulePriceFlush();
    });

    const fresh = await batchPromise;
    return { ...result, ...fresh };
  }

  /**
   * Lấy metadata 1 hoặc nhiều id (name, symbol, image)
   * /coins/{id} (market_data=false để nhẹ) — có cache
   * @param {string|string[]} ids
   */
  async getMeta(ids) {
    const list = Array.isArray(ids) ? ids : [ids];
    const now = Date.now();
    const result = {};
    const misses = [];

    for (const id of list) {
      const c = this._cacheMeta.get(id);
      if (c && (now - c.t) < this.metaTTL) {
        result[id] = c.data;
      } else {
        misses.push(id);
      }
    }
    if (misses.length === 0) return result;

    // gọi tuần tự để an toàn rate-limit; bạn có thể tối ưu song song có throttle
    for (const id of misses) {
      const data = await this._request(() =>
        this.http.get(`/coins/${encodeURIComponent(id)}`, {
          params: {
            localization: false,
            tickers: false,
            market_data: false,
            community_data: false,
            developer_data: false,
            sparkline: false,
          },
        })
      );
      const meta = {
        id: data.data.id,
        symbol: data.data.symbol,
        name: data.data.name,
        image: data.data.image, // {thumb, small, large}
      };
      this._cacheMeta.set(id, { t: Date.now(), data: meta });
      result[id] = meta;
    }
    return result;
  }

  /**
   * Lấy contract addresses cho nhiều ids
   * @param {string[]} ids
   * @returns {Promise<Object>} { [id]: { contractAddress: string } }
   */
  async getContractAddresses(ids) {
    const result = {};
    
    for (const id of ids) {
      try {
        const data = await this._request(() =>
          this.http.get(`/coins/${encodeURIComponent(id)}/contract/contract_addresses`)
        );
        
        if (data.data && data.data.length > 0) {
          // Lấy contract đầu tiên (thường là mainnet)
          result[id] = {
            contractAddress: data.data[0].contract_address
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch contract for ${id}:`, error.message);
      }
    }
    
    return result;
  }

  /**
   * Lấy ATH (All-Time High) cho nhiều ids
   * @param {string[]} ids
   * @returns {Promise<Object>} { [id]: number }
   */
  async getATH(ids) {
    const result = {};
    
    for (const id of ids) {
      try {
        const data = await this._request(() =>
          this.http.get(`/coins/${encodeURIComponent(id)}/ohlc`, {
            params: {
              vs_currency: 'usd',
              days: 'max'
            }
          })
        );
        
        if (data.data && data.data.length > 0) {
          // Tìm giá cao nhất trong lịch sử
          const prices = data.data.map(candle => candle[2]); // candle[2] là high price
          const ath = Math.max(...prices);
          result[id] = ath;
        }
      } catch (error) {
        console.warn(`Failed to fetch ATH for ${id}:`, error.message);
      }
    }
    
    return result;
  }

  // ====== Internal: batching & scheduling ======

  _schedulePriceFlush() {
    if (this._priceFlushTimer) return;
    this._priceFlushTimer = setTimeout(() => this._flushPriceBatches().catch(() => {}), this._batchDelayMs);
  }

  async _flushPriceBatches() {
    clearTimeout(this._priceFlushTimer);
    this._priceFlushTimer = null;

    // lấy snapshot rồi clear queue
    const entries = Array.from(this._priceQueue.entries());
    this._priceQueue.clear();

    for (const [vsKey, { ids, resolvers }] of entries) {
      const idsArr = Array.from(ids);
      try {
        const data = await this._request(() =>
          this.http.get("/simple/price", {
            params: {
              ids: idsArr.join(","),
              vs_currencies: vsKey,
              include_last_updated_at: false,
            },
          })
        );

        const now = Date.now();
        const payload = data.data || {};
        // cập nhật cache & build subset cho từng resolver
        const globalRet = {};
        for (const id of idsArr) {
          const val = payload[id] || null;
          const key = `${id}|${vsKey}`;
          this._cachePrice.set(key, { t: now, data: val });
          globalRet[id] = val;
        }

        // trả kết quả cho từng nhóm yêu cầu
        for (const r of resolvers) {
          const obj = {};
          r.want.forEach(id => { obj[id] = globalRet[id] || null; });
          r.resolve(obj);
        }
      } catch (err) {
        for (const r of resolvers) r.reject(err);
      }
    }
  }

  // ====== Internal: request with throttling & backoff ======

  async _request(doHttp) {
    await this._throttle();
    let attempt = 0;
    while (true) {
      try {
        const res = await doHttp();
        this._markSent();
        return res;
      } catch (err) {
        const status = err?.response?.status;
        // nếu bị 429 hoặc 5xx → retry
        if ((status === 429 || (status >= 500 && status < 600)) && attempt < this.maxRetries) {
          attempt += 1;
          const retryAfter = parseInt(err?.response?.headers?.["retry-after"] || "", 10);
          const wait = Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : this.backoffBaseMs * 2 ** (attempt - 1);
          await this._sleep(wait);
          continue;
        }
        // không retry được nữa
        throw err;
      }
    }
  }

  async _throttle() {
    const now = Date.now();
    // đảm bảo min gap giữa 2 request
    const gap = now - this._lastSentAt;
    if (gap < this.minGapMs) await this._sleep(this.minGapMs - gap);

    // sliding window: giữ tối đa requestsPerWindow trong windowMs
    const t = Date.now();
    this._timestamps = this._timestamps.filter(ts => t - ts < this.windowMs);
    if (this._timestamps.length >= this.requestsPerWindow) {
      const until = this.windowMs - (t - this._timestamps[0]);
      await this._sleep(until + 10);
    }
  }

  _markSent() {
    const t = Date.now();
    this._timestamps.push(t);
    this._lastSentAt = t;
  }

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

// Tạo instance global để sử dụng trong toàn app
export const coinGeckoClient = new CoinGeckoClient({
  requestsPerWindow: 25,
  windowMs: 60_000,
  minGapMs: 1200,
  priceTTL: 30_000,
  metaTTL: 3600_000,
  maxRetries: 4,
  backoffBaseMs: 1500,
});
