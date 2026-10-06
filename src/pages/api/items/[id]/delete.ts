import type { APIRoute } from 'astro';
import { db, schema } from '../../../../db';
import { eq, inArray, and } from 'drizzle-orm';
import { getCurrentUser } from '../../../../lib/auth';

export const POST: APIRoute = async ({ params, cookies, redirect }) => {
  const user = await getCurrentUser(cookies);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Akses ditolak.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = parseInt(params.id || '0', 10);

  // Check if item has active loans
  const activeLoans = await db
    .select()
    .from(schema.borrowings)
    .where(
      and(
        eq(schema.borrowings.itemId, id),
        inArray(schema.borrowings.status, ['borrowed', 'pending', 'overdue'])
      )
    )
    .all();

  if (activeLoans.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Barang sedang dalam proses peminjaman aktif dan tidak dapat dihapus.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Delete borrowings history or set foreign keys
  await db.delete(schema.borrowings).where(eq(schema.borrowings.itemId, id)).run();
  await db.delete(schema.items).where(eq(schema.items.id, id)).run();

  return redirect('/admin/barang', 302);
};
