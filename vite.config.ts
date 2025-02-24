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
            // Copy API key if present
            if (req.headers['x-api-key']) {
              proxyReq.setHeader('X-Api-Key', req.headers['x-api-key']);
            }

            // Remove problematic headers
            proxyReq.removeHeader('Origin');
            proxyReq.removeHeader('Referer');

            // Add required headers
            proxyReq.setHeader('Accept', 'application/json');
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Handle CORS
            proxyRes.headers['access-control-allow-origin'] = '*';
            if (req.headers['access-control-request-method']) {
              proxyRes.headers['access-control-allow-methods'] = 'GET, POST, OPTIONS';
            }
            if (req.headers['access-control-request-headers']) {
              proxyRes.headers['access-control-allow-headers'] = 'X-Api-Key, Content-Type';
            }
          });

          proxy.on('error', (err) => {
            console.error('Proxy error:', err);
          });
        },
      },
    },
  },
});