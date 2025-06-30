// vite.config.js
import { defineConfig } from 'vite';
import vue            from '@vitejs/plugin-vue';
import path           from 'path';

export default defineConfig({
  plugins: [ vue() ],
  resolve: {
    alias: [
      // @ → src
      { find: '@', replacement: path.resolve(__dirname, 'src') },

      // 只把裸的 'leaflet' 定向到 shim
      { find: /^leaflet$/, replacement: path.resolve(__dirname, 'src/shims/leaflet.js') }
    ]
  },
  optimizeDeps: {
    include: ['leaflet']
  }
});
