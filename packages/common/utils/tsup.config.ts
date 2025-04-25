import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/retry/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    entry: {
      index: 'src/index.ts',
      'retry/index': 'src/retry/index.ts',
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
});
