import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import cloudflare from '@astrojs/cloudflare';

const deployTarget = (process.env.DEPLOY_TARGET || '').trim().toLowerCase();
const isCloudflare = deployTarget === 'cloudflare' || process.env.CF_PAGES === '1' || process.env.CLOUDFLARE === '1';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: isCloudflare
    ? cloudflare()
    : node({
        mode: 'standalone',
      }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: isCloudflare ? [] : ['better-sqlite3'],
    },
  },
});
