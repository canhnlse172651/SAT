import { defineConfig } from 'vitest/config';

// One `vitest run` covers every app and package; each app's own config defines its environment.
export default defineConfig({
  test: {
    projects: ['apps/*', 'packages/*'],
  },
});
