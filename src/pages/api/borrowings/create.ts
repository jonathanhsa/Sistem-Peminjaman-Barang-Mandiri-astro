import type { APIRoute } from 'astro';
import { db, schema } from '../../../db';
import { eq, and, inArray, isNull, gt } from 'drizzle-orm';
import { getCurrentUser } from '../../../lib/auth';

function generateBorrowingCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PJM-${year}${month}${day}-${rand}`;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await getCurrentUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Silakan login terlebih dahulu.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let itemCode = '';
    let notes = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      itemCode = body.itemCode || body.item_code || '';
      notes = body.notes || '';
    } else {
      const formData = await request.formData();
      itemCode = formData.get('itemCode')?.toString() || formData.get('item_code')?.toString() || '';
      notes = formData.get('notes')?.toString() || '';
    }

    if (!itemCode.trim()) {
      return new Response(JSON.stringify({ error: 'Kode barang tidak boleh kosong.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Find item
    const item = await db
      .select()
      .from(schema.items)
      .where(eq(schema.items.itemCode, itemCode.trim().toUpperCase()))
      .get();

    if (!item) {
      return new Response(JSON.stringify({ error: 'Barang tidak ditemukan dalam inventaris.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Check item status & stock
    if (item.status === 'maintenance' || item.stock <= 0) {
      return new Response(
        JSON.stringify({
          error:
            item.status === 'maintenance'
              ? 'Barang ini sedang dalam masa perbaikan/maintenance.'
              : 'Stok barang ini saat ini habis.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check unpaid fines
    const unpaidFine = await db
      .select()
      .from(schema.borrowings)
      .where(
        and(
          eq(schema.borrowings.userId, user.id),
          gt(schema.borrowings.fineAmount, 0),
          isNull(schema.borrowings.finePaidAt)
        )
      )
      .get();

    if (unpaidFine) {
      return new Response(
        JSON.stringify({
          error:
            'Anda memiliki denda keterlambatan yang belum lunas. Silakan selesaikan denda di petugas sebelum meminjam barang baru.',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Check active borrowing limit (max 3 active: pending, borrowed, overdue)
    const activeBorrowings = await db
      .select()
      .from(schema.borrowings)
      .where(
        and(
          eq(schema.borrowings.userId, user.id),
          inArray(schema.borrowings.status, ['pending', 'borrowed', 'overdue'])
        )
      )
      .all();

    if (activeBorrowings.length >= 3) {
      return new Response(
        JSON.stringify({
          error: 'Batas peminjaman tercapai (maksimal 3 peminjaman aktif secara bersamaan).',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Generate dates: standard 7 calendar days
    const now = new Date();
    const borrowDate = now.toISOString();
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    let borrowingCode = generateBorrowingCode();
    // Ensure uniqueness
    while (
      await db.select().from(schema.borrowings).where(eq(schema.borrowings.borrowingCode, borrowingCode)).get()
    ) {
      borrowingCode = generateBorrowingCode();
    }

    // Insert borrowing
    const [newBorrowing] = await db
      .insert(schema.borrowings)
      .values({
        borrowingCode,
        userId: user.id,
        itemId: item.id,
        borrowDate,
        dueDate,
        status: 'pending',
        fineAmount: 0,
        notes: notes.trim() || null,
      })
      .returning();

    // Create notification
    await db.insert(schema.notifications)
      .values({
        userId: user.id,
        title: 'Pengajuan Peminjaman Berhasil',
        message: `Pengajuan peminjaman ${item.name} (${borrowingCode}) telah dibuat. Tunjukkan bukti QR ke petugas untuk verifikasi.`,
        type: 'info',
        isRead: false,
      })
      .run();

    if (!contentType.includes('application/json')) {
      return new Response(null, {
        status: 302,
        headers: { Location: `/riwayat/${borrowingCode}` },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        borrowingCode,
        redirectUrl: `/riwayat/${borrowingCode}`,
        borrowing: newBorrowing,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Gagal memproses peminjaman.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
