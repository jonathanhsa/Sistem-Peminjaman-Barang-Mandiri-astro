import type { AstroCookies } from 'astro';
import bcrypt from 'bcryptjs';
import { db, schema } from '../db';
import { eq, or } from 'drizzle-orm';
import type { User } from '../db/schema';

const SESSION_COOKIE = 'sipembar_session';

export interface SessionData {
  userId: number;
  role: 'student' | 'admin';
  name: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export function createSession(cookies: AstroCookies, user: User) {
  const data: SessionData = {
    userId: user.id,
    role: user.role as 'student' | 'admin',
    name: user.name,
  };
  const token = Buffer.from(JSON.stringify(data)).toString('base64');
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function destroySession(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function getCurrentUser(cookies: AstroCookies): Promise<User | null> {
  const cookie = cookies.get(SESSION_COOKIE);
  if (!cookie || !cookie.value) return null;

  try {
    const raw = Buffer.from(cookie.value, 'base64').toString('utf-8');
    const data = JSON.parse(raw) as SessionData;
    if (!data.userId) return null;

    const user = await db.select().from(schema.users).where(eq(schema.users.id, data.userId)).get();
    return user || null;
  } catch (e) {
    return null;
  }
}

export async function authenticateUser(identifier: string, pass: string): Promise<{ user?: User; error?: string }> {
  const trimmed = identifier.trim();
  const user = await db
    .select()
    .from(schema.users)
    .where(or(eq(schema.users.nim_nip, trimmed), eq(schema.users.email, trimmed)))
    .get();

  if (!user) {
    return { error: 'NIM/NIP atau Email tidak terdaftar dalam sistem.' };
  }

  const valid = await verifyPassword(pass, user.password);
  if (!valid) {
    return { error: 'Kata sandi tidak sesuai.' };
  }

  return { user };
}
