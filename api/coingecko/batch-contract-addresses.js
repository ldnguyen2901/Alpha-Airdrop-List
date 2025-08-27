import { coinGeckoProxy, ok, badRequest, serverError } from './_client.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return badRequest(res, 'GET only');
  try {
    const { ids } = req.query || {};
    if (!ids) return badRequest(res, 'ids parameter is required');
    const idArray = String(ids).split(',');

    const results = {};
    const batchSize = 50;
    for (let i = 0; i < idArray.length; i += batchSize) {
      const batch = idArray.slice(i, i + batchSize);
      for (const id of batch) {
        try {
          const contracts = await coinGeckoProxy(`/coins/${id}/contract/contract_addresses`);
          if (contracts && contracts.length > 0) {
            results[id] = { contractAddress: contracts[0].contract_address };
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


