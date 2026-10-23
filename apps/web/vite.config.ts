import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Dev server, build and tests consume shared sources directly (no rebuild loop); type checking
    // and the api use the published contract, packages/shared/dist.
    alias: {
      '@sat/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
    },
  },
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
