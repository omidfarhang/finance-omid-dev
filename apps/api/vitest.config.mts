import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Nest DI needs legacy decorators + emitted design:paramtypes metadata.
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
    include: ['src/**/*.spec.ts'],
    setupFiles: ['reflect-metadata'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
    },
  },
});
