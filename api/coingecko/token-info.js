import { coinGeckoProxy, ok, badRequest, serverError } from './_client.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return badRequest(res, 'GET only');
  try {
    const { id } = req.query || {};
    if (!id) return badRequest(res, 'id parameter is required');
    const data = await coinGeckoProxy(`/coins/${id}`, {
      localization: false,
      tickers: false,
      market_data: false,
      community_data: false,
      developer_data: false,
      sparkline: false,
    });
    return ok(res, data);
  } catch (e) {
    return serverError(res, e);
  }
}


