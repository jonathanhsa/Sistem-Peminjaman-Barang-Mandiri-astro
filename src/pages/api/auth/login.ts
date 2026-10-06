import type { APIRoute } from 'astro';
import { authenticateUser, createSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    let identifier = '';
    let password = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      identifier = body.identifier || '';
      password = body.password || '';
    } else {
      const formData = await request.formData();
      identifier = formData.get('identifier')?.toString() || '';
      password = formData.get('password')?.toString() || '';
    }

    if (!identifier || !password) {
      if (!contentType.includes('application/json')) {
        return new Response(null, {
          status: 302,
          headers: { Location: `/login?error=${encodeURIComponent('NIM/NIP/Email dan Kata Sandi wajib diisi.')}` }
        });
      }
      return new Response(JSON.stringify({ error: 'NIM/NIP/Email dan Kata Sandi wajib diisi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authResult = await authenticateUser(identifier, password);
    if (authResult.error || !authResult.user) {
      if (!contentType.includes('application/json')) {
        return new Response(null, {
          status: 302,
          headers: { Location: `/login?error=${encodeURIComponent(authResult.error || 'Autentikasi gagal.')}` }
        });
      }
      return new Response(JSON.stringify({ error: authResult.error || 'Autentikasi gagal.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    createSession(cookies, authResult.user);

    const redirectUrl = authResult.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';

    // If form submit without AJAX, redirect directly
    if (!contentType.includes('application/json')) {
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl,
        user: {
          id: authResult.user.id,
          name: authResult.user.name,
          role: authResult.user.role,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Terjadi kesalahan server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
