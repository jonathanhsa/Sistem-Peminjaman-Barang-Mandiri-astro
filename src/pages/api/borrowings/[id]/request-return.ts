import type { APIRoute } from 'astro';
import { db, schema } from '../../../../db';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '../../../../lib/auth';
import { calculateFine } from '../../../../lib/fine';

export const POST: APIRoute = async ({ params, request, cookies, redirect }) => {
  const user = await getCurrentUser(cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Silakan login terlebih dahulu.' }), {
      status: 401,
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

  const borrowing = await db
    .select()
    .from(schema.borrowings)
    .where(eq(schema.borrowings.id, id))
    .get();

  if (!borrowing) {
    return new Response(JSON.stringify({ error: 'Data peminjaman tidak ditemukan.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (user.role !== 'admin' && borrowing.userId !== user.id) {
    return new Response(JSON.stringify({ error: 'Anda tidak memiliki akses untuk transaksi ini.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (borrowing.status === 'returned') {
    return new Response(JSON.stringify({ error: 'Barang ini sudah dikembalikan sebelumnya.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (borrowing.status !== 'borrowed' && borrowing.status !== 'overdue' && borrowing.status !== 'return_pending') {
    return new Response(
      JSON.stringify({ error: 'Hanya barang yang sedang dipinjam yang dapat diajukan pengembaliannya.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const now = new Date();
  const { fineAmount } = calculateFine(borrowing.dueDate, now);
  const finalFine = Math.max(borrowing.fineAmount, fineAmount);

  if (borrowing.status !== 'return_pending') {
    await db
      .update(schema.borrowings)
      .set({
        status: 'return_pending',
        fineAmount: finalFine,
      })
      .where(eq(schema.borrowings.id, id))
      .run();

    const item = await db
      .select()
      .from(schema.items)
      .where(eq(schema.items.id, borrowing.itemId))
      .get();

    await db
      .insert(schema.notifications)
      .values({
        userId: borrowing.userId,
        title: 'QR Pengembalian Siap Diverifikasi',
        message: `Pengajuan pengembalian ${item?.name || 'barang'} (${borrowing.borrowingCode}) telah dibuat. Tunjukkan QR Code ke petugas loket untuk menyelesaikan pengembalian.${
          finalFine > 0 ? ` Siapkan pelunasan denda keterlambatan sebesar Rp ${finalFine.toLocaleString('id-ID')}.` : ''
        }`,
        type: finalFine > 0 ? 'warning' : 'info',
        isRead: false,
      })
      .run();
  }

  const targetUrl = `/riwayat/${borrowing.borrowingCode}?return=1`;
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return new Response(
      JSON.stringify({
        success: true,
        message: 'QR Pengembalian berhasil disiapkan. Tunjukkan QR ke petugas loket.',
        borrowingCode: borrowing.borrowingCode,
        fineAmount: finalFine,
        redirectUrl: targetUrl,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return redirect(targetUrl, 302);
};
