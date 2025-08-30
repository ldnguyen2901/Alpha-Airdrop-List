import { createProxyMiddleware } from 'http-proxy-middleware';

// Create proxy middleware for CoinGecko API
export const coinGeckoProxy = createProxyMiddleware({
  target: 'https://api.coingecko.com',
  changeOrigin: true,
  secure: true,
  pathRewrite: {
    '^/api': '/api'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxy request: ${req.method} ${req.url} -> ${proxyReq.path}`);
    
    // Set proper headers for CoinGecko API
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
    proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
    proxyReq.setHeader('Accept-Encoding', 'gzip, deflate, br');
    proxyReq.setHeader('Connection', 'keep-alive');
    proxyReq.setHeader('Sec-Fetch-Dest', 'empty');
    proxyReq.setHeader('Sec-Fetch-Mode', 'cors');
    proxyReq.setHeader('Sec-Fetch-Site', 'cross-site');
    
    // Remove any problematic headers
    proxyReq.removeHeader('Origin');
    proxyReq.removeHeader('Referer');
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`📡 Proxy response: ${proxyRes.statusCode} ${req.url}`);
    
    // Set CORS headers on response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, User-Agent, X-Requested-With');
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    res.writeHead(500, {
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
  }
});

// Export for use in other files
export default coinGeckoProxy;
