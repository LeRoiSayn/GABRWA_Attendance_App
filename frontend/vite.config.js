import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:5001',
      '/visitors': 'http://localhost:5001',
      '/visits': 'http://localhost:5001',
      '/gate': 'http://localhost:5001',
      '/reception': 'http://localhost:5001',
      '/reports':   'http://localhost:5001',
      '/signature': 'http://localhost:5001',
      '/uploads':   'http://localhost:5001',
    },
    host: true,
  },
});
