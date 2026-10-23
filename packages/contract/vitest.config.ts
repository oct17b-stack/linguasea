import { defineConfig } from 'vitest/config';

// Tests load and validate the real content (thousands of lessons), which takes longer than the 5 s default.
export default defineConfig({ test: { testTimeout: 60_000 } });
