import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@web': path.resolve(__dirname, './src/web'),
      '@mobile': path.resolve(__dirname, './src/mobile')
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
