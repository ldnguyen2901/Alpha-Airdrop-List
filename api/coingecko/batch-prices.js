import { coinGeckoProxy, ok, badRequest, serverError } from './_client.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return badRequest(res, 'GET only');
  try {
    const { ids, vs_currencies = 'usd' } = req.query || {};
    if (!ids) return badRequest(res, 'ids parameter is required');
    const idArray = String(ids).split(',');

    const results = {};
    const mainTokens = ['bitcoin', 'ethereum', 'binancecoin'];
    const mainTokensToFetch = mainTokens.filter((t) => idArray.includes(t));

    if (mainTokensToFetch.length) {
      try {
        const mainRes = await coinGeckoProxy('/simple/price', {
          ids: mainTokensToFetch.join(','),
          vs_currencies,
          include_last_updated_at: false,
        });
        Object.assign(results, mainRes);
        await new Promise(r => setTimeout(r, 200));
      } catch {}
    }

    const others = idArray.filter((t) => !mainTokens.includes(t));
    const batchSize = 50;
    for (let i = 0; i < others.length; i += batchSize) {
      const batch = others.slice(i, i + batchSize);
      try {
        const r = await coinGeckoProxy('/simple/price', {
          ids: batch.join(','),
          vs_currencies,
          include_last_updated_at: false,
        });
        Object.assign(results, r);
        if (i + batchSize < others.length) await new Promise(r => setTimeout(r, 200));
      } catch {}
    }

    return ok(res, results);
  } catch (e) {
    return serverError(res, e);
  }
}


