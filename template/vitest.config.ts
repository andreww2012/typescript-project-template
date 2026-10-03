import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    // ESLint forbids importing them
    globals: true,
    // Otherwise `nr test` fails until the first test is written
    passWithNoTests: true,
  },
});
