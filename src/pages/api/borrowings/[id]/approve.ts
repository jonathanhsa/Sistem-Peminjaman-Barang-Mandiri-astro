import type { APIRoute } from 'astro';
import { db, schema } from '../../../../db';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser } from '../../../../lib/auth';
import { calculateDueDate } from '../../../../lib/fine';

export const POST: APIRoute = async ({ params, request, cookies, redirect }) => {
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

  const borrowing = await db.select().from(schema.borrowings).where(eq(schema.borrowings.id, id)).get();
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
  const item = await db.select().from(schema.items).where(eq(schema.items.id, borrowing.itemId)).get();
  if (!item || item.stock <= 0) {
    return new Response(JSON.stringify({ error: 'Stok barang tidak mencukupi untuk disetujui.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date();
  const borrowDate = now.toISOString();
  const dueDate = calculateDueDate(now, 7);

  // Approve: update status to 'borrowed', set borrowDate & end-of-day dueDate, and decrease stock by 1
  await db.update(schema.borrowings)
    .set({
      status: 'borrowed',
      borrowDate,
      dueDate,
    })
    .where(eq(schema.borrowings.id, id))
    .run();

  await db.update(schema.items)
    .set({ stock: sql`stock - 1` })
    .where(eq(schema.items.id, borrowing.itemId))
    .run();

  // Notify student
  await db.insert(schema.notifications)
    .values({
      userId: borrowing.userId,
      title: 'Peminjaman Disetujui',
      message: `Peminjaman ${item.name} (${borrowing.borrowingCode}) telah disetujui oleh petugas. Silakan ambil barang di loket.`,
      type: 'success',
      isRead: false,
    })
    .run();

  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Peminjaman berhasil disetujui.',
        borrowDate,
        dueDate,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return redirect('/admin/peminjaman', 302);
};

