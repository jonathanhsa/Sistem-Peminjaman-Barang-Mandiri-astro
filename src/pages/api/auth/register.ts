import type { APIRoute } from 'astro';
import { db, schema } from '../../../db';
import { eq, or } from 'drizzle-orm';
import { hashPassword, createSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    let name = '';
    let email = '';
    let nim_nip = '';
    let password = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      name = body.name?.trim() || '';
      email = body.email?.trim() || '';
      nim_nip = body.nim_nip?.trim() || '';
      password = body.password || '';
    } else {
      const formData = await request.formData();
      name = formData.get('name')?.toString().trim() || '';
      email = formData.get('email')?.toString().trim() || '';
      nim_nip = formData.get('nim_nip')?.toString().trim() || '';
      password = formData.get('password')?.toString() || '';
    }

    if (!name || !email || !nim_nip || !password) {
      return new Response(JSON.stringify({ error: 'Semua kolom pendaftaran wajib diisi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Kata sandi minimal 6 karakter.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if email or nim_nip already exists
    const existing = db
      .select()
      .from(schema.users)
      .where(or(eq(schema.users.email, email), eq(schema.users.nim_nip, nim_nip)))
      .get();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'NIM atau Email sudah terdaftar. Silakan gunakan akun yang sudah ada.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const hashedPassword = await hashPassword(password);
    const insertResult = db
      .insert(schema.users)
      .values({
        name,
        email,
        nim_nip,
        role: 'student',
        password: hashedPassword,
      })
      .returning()
      .get();

    createSession(cookies, insertResult);

    // Send welcome notification
    db.insert(schema.notifications)
      .values({
        userId: insertResult.id,
        title: 'Selamat Datang!',
        message: 'Akun peminjaman mandiri Anda telah aktif. Selamat menggunakan fasilitas kampus!',
        type: 'success',
        isRead: false,
      })
      .run();

    if (!contentType.includes('application/json')) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/dashboard' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: '/dashboard',
        user: { id: insertResult.id, name: insertResult.name },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Gagal mendaftarkan akun.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
