import { defineConfig } from 'vitest/config';

// One `vitest run` covers every app; each app's own config defines its environment.
export default defineConfig({
  test: {
    projects: ['apps/*'],
  },
});
