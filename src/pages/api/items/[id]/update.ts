import type { APIRoute } from 'astro';
import { db, schema } from '../../../../db';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '../../../../lib/auth';

export const POST: APIRoute = async ({ params, request, cookies, redirect }) => {
  const user = await getCurrentUser(cookies);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Akses ditolak.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = parseInt(params.id || '0', 10);
  const formData = await request.formData();
  const name = formData.get('name')?.toString().trim() || '';
  const category = formData.get('category')?.toString().trim() || 'Perpustakaan';
  const stock = parseInt(formData.get('stock')?.toString() || '0', 10);
  const status = (formData.get('status')?.toString() || 'available') as 'available' | 'borrowed' | 'maintenance';

  if (!name) {
    return new Response(JSON.stringify({ error: 'Nama barang tidak boleh kosong.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  db.update(schema.items)
    .set({
      name,
      category,
      stock,
      status,
    })
    .where(eq(schema.items.id, id))
    .run();

  return redirect('/admin/barang', 302);
};
