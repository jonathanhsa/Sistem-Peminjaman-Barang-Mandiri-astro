import type { APIRoute } from 'astro';
import { db, schema } from '../../../../db';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser } from '../../../../lib/auth';

export const POST: APIRoute = async ({ params, cookies, redirect }) => {
  const user = await getCurrentUser(cookies);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Akses hanya untuk petugas inventaris.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = parseInt(params.id || '0', 10);
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID peminjaman tidak valid.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const borrowing = db.select().from(schema.borrowings).where(eq(schema.borrowings.id, id)).get();
  if (!borrowing) {
    return new Response(JSON.stringify({ error: 'Peminjaman tidak ditemukan.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (borrowing.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Peminjaman sudah diproses sebelumnya.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check item stock
  const item = db.select().from(schema.items).where(eq(schema.items.id, borrowing.itemId)).get();
  if (!item || item.stock <= 0) {
    return new Response(JSON.stringify({ error: 'Stok barang tidak mencukupi untuk disetujui.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Approve: update status to 'borrowed' and decrease stock by 1
  db.update(schema.borrowings)
    .set({ status: 'borrowed' })
    .where(eq(schema.borrowings.id, id))
    .run();

  db.update(schema.items)
    .set({ stock: sql`stock - 1` })
    .where(eq(schema.items.id, borrowing.itemId))
    .run();

  // Notify student
  db.insert(schema.notifications)
    .values({
      userId: borrowing.userId,
      title: 'Peminjaman Disetujui',
      message: `Peminjaman ${item.name} (${borrowing.borrowingCode}) telah disetujui oleh petugas. Silakan ambil barang di loket.`,
      type: 'success',
      isRead: false,
    })
    .run();

  return redirect('/admin/peminjaman', 302);
};
