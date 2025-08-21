export async function fetchCryptoPrices(ids, currency) {
  if (!ids.length) return {};
  
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=${encodeURIComponent(currency)}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`API lỗi ${res.status}`);
  }
  
  return await res.json();
}

export async function fetchTokenLogos(ids) {
  if (!ids.length) return {};
  
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids.join(","))}&order=market_cap_desc&per_page=250&page=1&sparkline=false&locale=en`;
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`API lỗi ${res.status}`);
  }
  
  const data = await res.json();
  const logos = {};
  
  data.forEach(coin => {
    logos[coin.id] = {
      logo: coin.image,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name
    };
  });
  
  return logos;
}
