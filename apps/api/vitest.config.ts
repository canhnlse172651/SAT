import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'api',
    environment: 'node',
    testTimeout: 30_000,
    // The first run downloads a MongoDB binary for mongodb-memory-server.
    hookTimeout: 180_000,
  },
});
