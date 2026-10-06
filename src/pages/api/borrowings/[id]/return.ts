import type { APIRoute } from 'astro';
import { db, schema } from '../../../../db';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser } from '../../../../lib/auth';
import { calculateFine } from '../../../../lib/fine';

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

  if (borrowing.status === 'returned') {
    return new Response(JSON.stringify({ error: 'Barang sudah dikembalikan sebelumnya.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const contentType = request.headers.get('content-type') || '';
  let markFinePaid = false;

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    markFinePaid = body.markFinePaid === true || body.finePaid === true;
  } else {
    const formData = await request.formData().catch(() => null);
    if (formData) {
      markFinePaid = formData.get('markFinePaid') === 'on' || formData.get('markFinePaid') === 'true';
    }
  }

  const now = new Date();
  const returnDate = now.toISOString();

  // Calculate fine
  const { fineAmount } = calculateFine(borrowing.dueDate, now);
  const finalFine = Math.max(borrowing.fineAmount, fineAmount);

  const finePaidAt = finalFine > 0 && markFinePaid ? returnDate : borrowing.finePaidAt;

  // 1. Update borrowing to returned
  await db.update(schema.borrowings)
    .set({
      status: 'returned',
      returnDate,
      fineAmount: finalFine,
      finePaidAt,
    })
    .where(eq(schema.borrowings.id, id))
    .run();

  // 2. Increase item stock by 1 (only if it was borrowed / overdue)
  if (borrowing.status === 'borrowed' || borrowing.status === 'overdue') {
    await db.update(schema.items)
      .set({ stock: sql`stock + 1` })
      .where(eq(schema.items.id, borrowing.itemId))
      .run();
  }

  // 3. Notify student
  const item = await db.select().from(schema.items).where(eq(schema.items.id, borrowing.itemId)).get();
  await db.insert(schema.notifications)
    .values({
      userId: borrowing.userId,
      title: 'Pengembalian Barang Berhasil',
      message: `Barang ${item?.name || ''} (${borrowing.borrowingCode}) telah sukses dikembalikan ke petugas inventaris.${
        finalFine > 0 ? ` Total denda: Rp ${finalFine.toLocaleString('id-ID')}` : ''
      }`,
      type: 'success',
      isRead: false,
    })
    .run();

  if (contentType.includes('application/json')) {
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pengembalian barang berhasil dicatat.',
        fineAmount: finalFine,
        finePaidAt,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const referer = request.headers.get('referer');
  if (referer && referer.includes('/admin/verifikasi')) {
    return redirect('/admin/verifikasi?status=success', 302);
  }

  return redirect('/admin/peminjaman', 302);
};
