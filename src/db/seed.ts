import bcrypt from 'bcryptjs';
import * as schema from './schema';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';

const dbPath = process.env.DATABASE_URL || path.resolve(process.cwd(), 'sqlite.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

export const SEED_USERS = [
  {
    name: 'Petugas Inventaris Kampus',
    email: 'admin@kampus.ac.id',
    nim_nip: '198501012010121001',
    role: 'admin' as const,
    password: await bcrypt.hash('password', 10),
  },
  {
    name: 'Jonathan Mahasiswa',
    email: 'mahasiswa@kampus.ac.id',
    nim_nip: '220101001',
    role: 'student' as const,
    password: await bcrypt.hash('password', 10),
  },
  {
    name: 'Budi Santoso',
    email: 'budi@kampus.ac.id',
    nim_nip: '220101002',
    role: 'student' as const,
    password: await bcrypt.hash('password', 10),
  },
];

export const SEED_ITEMS = [
  // 10 Buku Perpustakaan untuk Pengujian Barcode & OCR
  { itemCode: 'LIB-LAR-101', name: 'Buku Pemrograman Web Modern dengan Laravel', category: 'Perpustakaan', stock: 8, status: 'available' as const },
  { itemCode: 'LIB-ALG-102', name: 'Buku Struktur Data & Algoritma Tingkat Lanjut', category: 'Perpustakaan', stock: 4, status: 'available' as const },
  { itemCode: 'LIB-ML-103', name: 'Buku Artificial Intelligence & Deep Learning', category: 'Perpustakaan', stock: 6, status: 'available' as const },
  { itemCode: 'LIB-DB-104', name: 'Buku Perancangan Basis Data Relasional & NoSQL', category: 'Perpustakaan', stock: 5, status: 'available' as const },
  { itemCode: 'LIB-NET-105', name: 'Buku Jaringan Komputer & Keamanan Siber', category: 'Perpustakaan', stock: 7, status: 'available' as const },
  { itemCode: 'LIB-UIX-106', name: 'Buku Desain UI/UX & Interaksi Manusia Komputer', category: 'Perpustakaan', stock: 6, status: 'available' as const },
  { itemCode: 'LIB-OS-107', name: 'Buku Konsep Sistem Operasi & Arsitektur Linux', category: 'Perpustakaan', stock: 3, status: 'available' as const },
  { itemCode: 'LIB-IOT-108', name: 'Buku Robotika Cerdas & Internet of Things (IoT)', category: 'Perpustakaan', stock: 4, status: 'available' as const },
  { itemCode: 'LIB-SE-109', name: 'Buku Rekayasa Perangkat Lunak & Pola Desain', category: 'Perpustakaan', stock: 5, status: 'available' as const },
  { itemCode: 'LIB-STAT-110', name: 'Buku Statistika Probabilitas & Komputasi Sains Data', category: 'Perpustakaan', stock: 5, status: 'available' as const },

  // Alat Laboratorium Komputer & Himpunan
  { itemCode: 'LAB-CAM-001', name: 'Kamera DSLR Canon EOS 80D Kit', category: 'Lab Komputer', stock: 3, status: 'available' as const },
  { itemCode: 'LAB-MIC-002', name: 'Microphone Wireless Rode Wireless GO II', category: 'Lab Komputer', stock: 5, status: 'available' as const },
  { itemCode: 'LAB-VR-003', name: 'VR Headset Meta Quest 3 128GB', category: 'Lab Komputer', stock: 2, status: 'available' as const },
  { itemCode: 'HMP-PROJ-201', name: 'Proyektor Portabel Epson EB-E500', category: 'Himpunan', stock: 1, status: 'available' as const },
  { itemCode: 'HMP-SPK-202', name: 'Portable Speaker Bluetooth JBL PartyBox', category: 'Himpunan', stock: 2, status: 'available' as const },
  { itemCode: 'LAB-DRN-901', name: 'Drone DJI Mini 3 Pro (Sedang Servis)', category: 'Lab Komputer', stock: 0, status: 'maintenance' as const },
];

export const SEED_BORROWINGS = [
  {
    borrowingCode: 'PJM-20261001-A7K2',
    userNim: '220101001',
    itemCode: 'LAB-CAM-001',
    borrowDate: '2026-10-04T08:00:00Z',
    dueDate: '2026-10-11T17:00:00Z',
    status: 'borrowed' as const,
    fineAmount: 0,
    notes: 'Untuk dokumentasi seminar kampus.',
  },
  {
    borrowingCode: 'PJM-20260920-OVD1',
    userNim: '220101001',
    itemCode: 'LIB-LAR-101',
    borrowDate: '2026-09-27T08:00:00Z',
    dueDate: '2026-10-04T17:00:00Z',
    status: 'overdue' as const,
    fineAmount: 2000, // Terlambat 2 hari x Rp 1.000
    notes: 'Buku untuk referensi tugas akhir.',
  },
  {
    borrowingCode: 'PJM-20260910-RET1',
    userNim: '220101002',
    itemCode: 'LAB-MIC-002',
    borrowDate: '2026-09-21T08:00:00Z',
    dueDate: '2026-09-28T17:00:00Z',
    returnDate: '2026-09-28T14:30:00Z',
    status: 'returned' as const,
    fineAmount: 0,
    notes: 'Dikembalikan dalam kondisi sangat baik.',
  },
  {
    borrowingCode: 'PJM-20261005-PND1',
    userNim: '220101002',
    itemCode: 'HMP-PROJ-201',
    borrowDate: '2026-10-06T09:00:00Z',
    dueDate: '2026-10-13T17:00:00Z',
    status: 'pending' as const,
    fineAmount: 0,
    notes: 'Untuk rapat kerja himpunan.',
  },
];

export async function runSeed() {
  console.log('Clearing existing data...');
  sqlite.exec(`
    DELETE FROM notifications;
    DELETE FROM borrowings;
    DELETE FROM items;
    DELETE FROM users;
  `);

  console.log('Seeding users...');
  for (const user of SEED_USERS) {
    db.insert(schema.users).values(user).run();
  }

  console.log('Seeding items...');
  for (const item of SEED_ITEMS) {
    db.insert(schema.items).values(item).run();
  }

  console.log('Seeding borrowings...');
  const allUsers = db.select().from(schema.users).all();
  const allItems = db.select().from(schema.items).all();

  const userMap = new Map(allUsers.map((u) => [u.nim_nip, u.id]));
  const itemMap = new Map(allItems.map((i) => [i.itemCode, i.id]));

  for (const b of SEED_BORROWINGS) {
    const userId = userMap.get(b.userNim);
    const itemId = itemMap.get(b.itemCode);

    if (userId && itemId) {
      db.insert(schema.borrowings)
        .values({
          borrowingCode: b.borrowingCode,
          userId,
          itemId,
          borrowDate: b.borrowDate,
          dueDate: b.dueDate,
          returnDate: (b as any).returnDate || null,
          status: b.status,
          fineAmount: b.fineAmount,
          notes: b.notes,
        })
        .run();
    }
  }

  // Seed sample notifications
  const jonathan = allUsers.find((u) => u.nim_nip === '220101001');
  if (jonathan) {
    db.insert(schema.notifications)
      .values([
        {
          userId: jonathan.id,
          title: 'Peringatan Keterlambatan',
          message: 'Peminjaman LIB-LAR-101 telah melewati batas pengembalian. Denda Rp 2.000 terhitung.',
          type: 'danger',
          isRead: false,
        },
        {
          userId: jonathan.id,
          title: 'Peminjaman Aktif',
          message: 'Peminjaman Kamera DSLR Canon EOS 80D Kit aktif sampai 11 Okt 2026.',
          type: 'info',
          isRead: true,
        },
      ])
      .run();
  }

  console.log('Database seeded successfully!');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.ts')) {
  runSeed()
    .then(() => {
      console.log('Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
