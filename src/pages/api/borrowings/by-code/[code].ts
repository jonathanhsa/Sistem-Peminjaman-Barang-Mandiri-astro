import type { APIRoute } from 'astro';
import { db, schema } from '../../../../db';
import { eq } from 'drizzle-orm';
import { calculateFine } from '../../../../lib/fine';

export const GET: APIRoute = async ({ params }) => {
  const code = (params.code || '').trim().toUpperCase();

  if (!code) {
    return new Response(JSON.stringify({ message: 'Kode transaksi peminjaman tidak valid.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const borrowing = await db
    .select()
    .from(schema.borrowings)
    .where(eq(schema.borrowings.borrowingCode, code))
    .get();

  if (!borrowing) {
    return new Response(JSON.stringify({ message: 'Transaksi peminjaman tidak ditemukan.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await db
    .select({ name: schema.users.name, nim_nip: schema.users.nim_nip, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.id, borrowing.userId))
    .get();

  const item = await db
    .select({ item_code: schema.items.itemCode, name: schema.items.name, category: schema.items.category })
    .from(schema.items)
    .where(eq(schema.items.id, borrowing.itemId))
    .get();

  // Dynamic fine calculation if borrowed
  let currentFine = borrowing.fineAmount;
  let isOverdue = borrowing.status === 'overdue';

  if (borrowing.status === 'borrowed') {
    const fineCalc = calculateFine(borrowing.dueDate);
    if (fineCalc.isOverdue) {
      currentFine = fineCalc.fineAmount;
      isOverdue = true;
    }
  }

  return new Response(
    JSON.stringify({
      id: borrowing.id,
      borrowing_code: borrowing.borrowingCode,
      user: user || { name: 'Unknown', nim_nip: '-' },
      item: item || { item_code: '-', name: 'Barang tidak diketahui' },
      borrow_date: borrowing.borrowDate,
      due_date: borrowing.dueDate,
      return_date: borrowing.returnDate,
      status: isOverdue && borrowing.status === 'borrowed' ? 'overdue' : borrowing.status,
      fine_amount: currentFine,
      fine_paid_at: borrowing.finePaidAt,
      is_overdue: isOverdue,
      notes: borrowing.notes,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
