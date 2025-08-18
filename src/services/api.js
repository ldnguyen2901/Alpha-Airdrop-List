export async function fetchCryptoPrices(ids, currency) {
  if (!ids.length) return {};
  
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=${encodeURIComponent(currency)}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`API lỗi ${res.status}`);
  }
  
  return await res.json();
}
