import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0', // Cho phép truy cập từ các thiết bị khác
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'User-Agent', 'X-Requested-With'],
      credentials: false
    },
    proxy: {
      '/api/coingecko': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`🔄 Proxy request: ${req.method} ${req.url} -> ${proxyReq.path}`);
          });
          
          // Handle proxy errors
          proxy.on('error', (err, req, res) => {
            console.error('❌ Proxy error:', err.message);
            res.writeHead(500, {
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
          });
          
          // Handle proxy response
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`📡 Proxy response: ${proxyRes.statusCode} ${req.url}`);
          });
        }
      }
    }
  }
})
