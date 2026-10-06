import type { APIRoute } from 'astro';
import { db, schema } from '../../../db';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const user = await getCurrentUser(cookies);
  if (!user) {
    return redirect('/login', 302);
  }

  db.update(schema.notifications)
    .set({ isRead: true })
    .where(eq(schema.notifications.userId, user.id))
    .run();

  return redirect('/notifikasi', 302);
};
