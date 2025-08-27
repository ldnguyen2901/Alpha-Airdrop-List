import { coinGeckoProxy, ok, badRequest, serverError } from './_client.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return badRequest(res, 'GET only');
  try {
    const { ids, vs_currency = 'usd' } = req.query || {};
    if (!ids) return badRequest(res, 'ids parameter is required');
    const idArray = String(ids).split(',');

    const results = {};
    const batchSize = 50;
    for (let i = 0; i < idArray.length; i += batchSize) {
      const batch = idArray.slice(i, i + batchSize);
      for (const id of batch) {
        try {
          const ohlc = await coinGeckoProxy(`/coins/${id}/ohlc`, {
            vs_currency,
            days: 'max',
          });
          if (Array.isArray(ohlc) && ohlc.length) {
            const ath = Math.max(...ohlc.map((c) => c[2]));
            results[id] = ath;
          }
        } catch {}
      }
      if (i + batchSize < idArray.length) await new Promise(r => setTimeout(r, 200));
    }
    return ok(res, results);
  } catch (e) {
    return serverError(res, e);
  }
}


