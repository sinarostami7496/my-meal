import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

/** نام ریپو GitHub Pages — برای dev از `/` استفاده می‌شود */
const GITHUB_PAGES_BASE = '/my-meal/';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: mode === 'production' ? GITHUB_PAGES_BASE : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));