import { drizzle } from 'drizzle-orm/d1';
import { env } from 'cloudflare:workers';
import * as schema from './schema';

function getD1Client(): any {
  if (typeof env !== 'undefined' && (env as any)?.DB) {
    return (env as any).DB;
  }
  if ((globalThis as any)?.DB) {
    return (globalThis as any).DB;
  }
  if ((globalThis as any)?.__D1_DB__) {
    return (globalThis as any).__D1_DB__;
  }
  return null;
}

// Proxy D1 calls dynamically so top-level module evaluation never fails outside of a request context
const d1Proxy = new Proxy({} as any, {
  get(_target, prop) {
    const client = getD1Client();
    if (!client) {
      throw new Error(
        "Cloudflare D1 database binding 'DB' is not available in the current context."
      );
    }
    const val = client[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

export const db = drizzle(d1Proxy, { schema });
export { schema };
