import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin in dev as in production (the API serves the SPA), so no CORS configuration exists.
    proxy: { '/api': 'http://localhost:3000' },
  },
  build: { sourcemap: true },
  test: {
    name: 'web',
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
