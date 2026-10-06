import type { APIRoute } from 'astro';
import { db, schema } from '../../../../db';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '../../../../lib/auth';

export const POST: APIRoute = async ({ params, cookies, redirect }) => {
  const user = await getCurrentUser(cookies);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Akses hanya untuk petugas.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = parseInt(params.id || '0', 10);
  const now = new Date().toISOString();

  await db.update(schema.borrowings)
    .set({ finePaidAt: now })
    .where(eq(schema.borrowings.id, id))
    .run();

  const borrowing = await db.select().from(schema.borrowings).where(eq(schema.borrowings.id, id)).get();
  if (borrowing) {
    await db.insert(schema.notifications)
      .values({
        userId: borrowing.userId,
        title: 'Denda Telah Dilunasi',
        message: `Pembayaran denda untuk transaksi ${borrowing.borrowingCode} telah diverifikasi oleh petugas. Akun Anda kembali bersih.`,
        type: 'success',
        isRead: false,
      })
      .run();
  }

  return redirect('/admin/peminjaman', 302);
};
