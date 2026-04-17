import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // jsdom for DOM-based tests (TextFieldHandler, domSanitizer).
    // Node-only tests (ToneEngine) override per-file via @vitest-environment node pragma.
    environment: 'jsdom',
    include: [
      'src/**/__tests__/**/*.test.ts',
      'src/**/tone-engine/__tests__/**/*.test.ts',
    ],
    globals: false,
  },
});
