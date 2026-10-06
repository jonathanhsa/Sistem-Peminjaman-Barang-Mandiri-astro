import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Tabel Users (Mahasiswa & Admin)
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  nim_nip: text('nim_nip').notNull().unique(),
  role: text('role', { enum: ['student', 'admin'] }).notNull().default('student'),
  password: text('password').notNull(), // hashed
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabel Items (Buku, Alat Lab, Himpunan)
export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemCode: text('item_code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'Perpustakaan' | 'Lab Komputer' | 'Himpunan'
  stock: integer('stock').notNull().default(0),
  status: text('status', { enum: ['available', 'borrowed', 'maintenance'] }).notNull().default('available'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabel Peminjaman (Borrowings)
export const borrowings = sqliteTable('borrowings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  borrowingCode: text('borrowing_code').notNull().unique(), // Format: PJM-YYYYMMDD-XXXX
  userId: integer('user_id').notNull().references(() => users.id),
  itemId: integer('item_id').notNull().references(() => items.id),
  borrowDate: text('borrow_date').notNull(),
  dueDate: text('due_date').notNull(),
  returnDate: text('return_date'),
  status: text('status', { enum: ['pending', 'borrowed', 'returned', 'overdue'] }).notNull().default('pending'),
  fineAmount: integer('fine_amount').notNull().default(0), // Rp 1.000 / hari keterlambatan
  finePaidAt: text('fine_paid_at'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Tabel Notifikasi
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', { enum: ['info', 'warning', 'danger', 'success'] }).notNull().default('info'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Borrowing = typeof borrowings.$inferSelect;
export type NewBorrowing = typeof borrowings.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
