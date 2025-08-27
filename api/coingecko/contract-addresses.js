import { coinGeckoProxy, ok, badRequest, serverError } from './_client.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return badRequest(res, 'GET only');
  try {
    const { id } = req.query || {};
    if (!id) return badRequest(res, 'id parameter is required');
    const data = await coinGeckoProxy(`/coins/${id}/contract/contract_addresses`);
    return ok(res, data);
  } catch (e) {
    return serverError(res, e);
  }
}


