import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/core/index.ts', 'src/express/index.ts', 'src/lambda/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    entry: {
      index: 'src/index.ts',
      'core/index': 'src/core/index.ts',
      'express/index': 'src/express/index.ts',
      'lambda/index': 'src/lambda/index.ts',
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
});
