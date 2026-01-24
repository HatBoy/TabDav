import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,js}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,js}',
        'src/main.ts',
        'src/popup/main.ts',
        'src/options/main.ts',
        'src/background/index.ts',
        'src/content/index.ts'
      ]
    },
    setupFiles: ['src/test/setup.ts'],
    deps: {
      inline: ['vue', 'pinia']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@common': resolve(__dirname, 'src/common'),
      '@background': resolve(__dirname, 'src/background'),
      '@popup': resolve(__dirname, 'src/popup'),
      '@options': resolve(__dirname, 'src/options'),
      '@content': resolve(__dirname, 'src/content')
    }
  }
});
