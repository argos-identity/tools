import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/s3/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    entry: {
      index: 'src/index.ts',
      's3/index': 'src/s3/index.ts',
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
});
