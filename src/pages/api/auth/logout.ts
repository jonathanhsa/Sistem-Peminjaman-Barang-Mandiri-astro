import type { APIRoute } from 'astro';
import { destroySession } from '../../../lib/auth';

export const ALL: APIRoute = async ({ cookies, redirect }) => {
  destroySession(cookies);
  return redirect('/login', 302);
};
