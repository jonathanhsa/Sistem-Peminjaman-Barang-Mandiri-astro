import type { APIRoute } from 'astro';
import { db, schema } from '../../../db';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const user = await getCurrentUser(cookies);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Akses ditolak.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const formData = await request.formData();
  const itemCode = formData.get('itemCode')?.toString().trim().toUpperCase() || '';
  const name = formData.get('name')?.toString().trim() || '';
  const category = formData.get('category')?.toString().trim() || 'Perpustakaan';
  const stock = parseInt(formData.get('stock')?.toString() || '0', 10);
  const status = (formData.get('status')?.toString() || 'available') as 'available' | 'borrowed' | 'maintenance';

  if (!itemCode || !name) {
    return new Response(JSON.stringify({ error: 'Kode barang dan nama barang wajib diisi.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check unique code
  const existing = db.select().from(schema.items).where(eq(schema.items.itemCode, itemCode)).get();
  if (existing) {
    return new Response(JSON.stringify({ error: 'Kode barang sudah ada di inventaris.' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  db.insert(schema.items)
    .values({
      itemCode,
      name,
      category,
      stock,
      status,
    })
    .run();

  return redirect('/admin/barang', 302);
};
