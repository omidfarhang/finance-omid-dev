import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    decorator: {
      legacy: true,
      emitDecoratorMetadata: true,
    },
    assumptions: {
      setPublicClassFields: true,
    },
    typescript: {
      removeClassFieldsWithoutInitializer: true,
    },
  },
  resolve: {
    alias: {
      '@finance/shared': path.resolve(
        import.meta.dirname,
        '../../packages/shared/src/index.ts',
      ),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    setupFiles: ['reflect-metadata', './test/setup-env.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
