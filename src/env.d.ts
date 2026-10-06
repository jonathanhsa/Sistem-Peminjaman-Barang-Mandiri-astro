/// <reference path="../.astro/types.d.ts" />

declare module 'cloudflare:workers' {
  export const env: {
    DB: import('drizzle-orm/d1').AnyD1Database;
    SESSION?: any;
    [key: string]: any;
  };
}
