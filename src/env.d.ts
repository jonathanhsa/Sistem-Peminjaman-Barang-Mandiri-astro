/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module 'cloudflare:workers' {
  export const env: {
    DB: import('drizzle-orm/d1').AnyD1Database;
    SESSION?: any;
    [key: string]: any;
  };
}
