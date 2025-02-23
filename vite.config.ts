import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://dex-api.changelly.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        headers: {
          'X-API-Key': '57d18ecb-7f0e-456c-a085-2d43ec6e2b3f'
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});