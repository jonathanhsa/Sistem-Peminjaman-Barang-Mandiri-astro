import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  prefetch: {
    defaultStrategy: 'hover',
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['qrcode.react', '@zxing/library', '@zxing/browser', 'tesseract.js'],
    },
    ssr: {
      noExternal: ['lucide-react', 'qrcode.react', '@zxing/library', '@zxing/browser'],
    },
  },
});
