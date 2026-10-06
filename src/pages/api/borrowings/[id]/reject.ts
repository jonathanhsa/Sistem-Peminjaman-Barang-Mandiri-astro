import type { APIRoute } from 'astro';
import { db, schema } from '../../../../db';
import { eq } from 'drizzle-orm';
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

  // Reject sets status to returned or cancels without modifying stock
  db.update(schema.borrowings)
    .set({
      status: 'returned',
      returnDate: new Date().toISOString(),
      notes: (borrowing.notes ? borrowing.notes + ' - ' : '') + '[DITOLAK PETUGAS]',
    })
    .where(eq(schema.borrowings.id, id))
    .run();

  const item = db.select().from(schema.items).where(eq(schema.items.id, borrowing.itemId)).get();

  // Notify student
  db.insert(schema.notifications)
    .values({
      userId: borrowing.userId,
      title: 'Pengajuan Ditolak',
      message: `Pengajuan peminjaman ${item?.name || 'barang'} (${borrowing.borrowingCode}) tidak disetujui petugas.`,
      type: 'warning',
      isRead: false,
    })
    .run();

  return redirect('/admin/peminjaman', 302);
};
