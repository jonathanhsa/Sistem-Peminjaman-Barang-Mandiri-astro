import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import cloudflare from '@astrojs/cloudflare';

const isNode = (process.env.TARGET || '').toLowerCase() === 'node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: isNode
    ? node({
        mode: 'standalone',
      })
    : cloudflare({
        platformProxy: {
          enabled: true,
        },
      }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: isNode ? ['better-sqlite3'] : [],
    },
  },
});
