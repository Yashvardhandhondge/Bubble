// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/defi-swap': {
        target: 'https://changelly.com/defi-swap',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/defi-swap/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Log the outgoing request for debugging
            console.log(`Proxying request: ${req.method} ${req.url}`);
            
            // Copy API key if present
            if (req.headers['x-api-key']) {
              proxyReq.setHeader('X-Api-Key', req.headers['x-api-key']);
            }

            // Remove problematic headers
            proxyReq.removeHeader('Origin');
            proxyReq.removeHeader('Referer');

            // Add required headers
            proxyReq.setHeader('Accept', 'application/json');
            
            // Set User-Agent to mimic a browser
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.6943.127 Safari/537.36');
            
            // Add any cookies that might be needed
            proxyReq.setHeader('Cookie', '');
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Log the response status for debugging
            console.log(`Proxy response for ${req.url}: ${proxyRes.statusCode}`);
            
            // If we get a 204, log more details
            if (proxyRes.statusCode === 204) {
              console.log('No Content response received. Original request details:', {
                method: req.method,
                url: req.url,
                headers: req.headers
              });
            }
            
            // Handle CORS
            proxyRes.headers['access-control-allow-origin'] = '*';
            if (req.headers['access-control-request-method']) {
              proxyRes.headers['access-control-allow-methods'] = 'GET, POST, OPTIONS';
            }
            if (req.headers['access-control-request-headers']) {
              proxyRes.headers['access-control-allow-headers'] = 'X-Api-Key, Content-Type';
            }
          });

          proxy.on('error', (err, req) => {
            console.error(`Proxy error for ${req.url}:`, err);
          });
        },
      },
    },
  },
});