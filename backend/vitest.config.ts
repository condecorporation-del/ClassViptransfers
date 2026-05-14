import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/shared/test/setup.ts'],
    include: ['src/shared/test/**/*.{test,spec}.ts'],
  },
});

