import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        // شاشة ملف La Hint
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // موقع مزاد اللوحات
        auction: fileURLToPath(new URL('./auction.html', import.meta.url)),
      },
    },
  },
});
