import { coinGeckoProxy, ok, badRequest, serverError } from './_client.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return badRequest(res, 'GET only');
  try {
    const { ids, vs_currencies = 'usd' } = req.query || {};
    if (!ids) return badRequest(res, 'ids parameter is required');
    const idArray = String(ids).split(',');
    const data = await coinGeckoProxy('/simple/price', {
      ids: idArray.join(','),
      vs_currencies,
      include_last_updated_at: false,
    });
    return ok(res, data);
  } catch (e) {
    return serverError(res, e);
  }
}


