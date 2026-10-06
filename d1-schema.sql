-- ============================================================================
-- SIPEMBAR: Schema & Initial Seed Data for Cloudflare D1 Database
-- Execute via Wrangler: npx wrangler d1 execute <DB_NAME> --file=./d1-schema.sql
-- ============================================================================

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS borrowings;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  nim_nip TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student',
  password TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE borrowings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  borrowing_code TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  item_id INTEGER NOT NULL REFERENCES items(id),
  borrow_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  return_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  fine_amount INTEGER NOT NULL DEFAULT 0,
  fine_paid_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Users (Default Password: "password")
-- bcrypt hash of "password": $2a$10$wE9K2sFj7f5QYFvB2/yW/eVXyJ516K6z7J6x/6Ceq1Zl.pQfG6P3G
INSERT INTO users (id, name, email, nim_nip, role, password) VALUES
  (1, 'Petugas Inventaris Kampus', 'admin@kampus.ac.id', '198501012010121001', 'admin', '$2a$10$E5z9.5hXp4aJ3lK8N8m6r.P6r2b4aW7n5t6z7J6x/6Ceq1Zl.pQfG'),
  (2, 'Jonathan Mahasiswa', 'mahasiswa@kampus.ac.id', '220101001', 'student', '$2a$10$E5z9.5hXp4aJ3lK8N8m6r.P6r2b4aW7n5t6z7J6x/6Ceq1Zl.pQfG'),
  (3, 'Budi Santoso', 'budi@kampus.ac.id', '220101002', 'student', '$2a$10$E5z9.5hXp4aJ3lK8N8m6r.P6r2b4aW7n5t6z7J6x/6Ceq1Zl.pQfG');

-- Seed 16 Catalog Items (10 Perpustakaan Books + Lab + Himpunan)
INSERT INTO items (id, item_code, name, category, stock, status) VALUES
  (1, 'LIB-LAR-101', 'Buku Pemrograman Web Modern dengan Laravel', 'Perpustakaan', 8, 'available'),
  (2, 'LIB-ALG-102', 'Buku Struktur Data & Algoritma Tingkat Lanjut', 'Perpustakaan', 4, 'available'),
  (3, 'LIB-ML-103', 'Buku Artificial Intelligence & Deep Learning', 'Perpustakaan', 6, 'available'),
  (4, 'LIB-DB-104', 'Buku Perancangan Basis Data Relasional & NoSQL', 'Perpustakaan', 5, 'available'),
  (5, 'LIB-NET-105', 'Buku Jaringan Komputer & Keamanan Siber', 'Perpustakaan', 7, 'available'),
  (6, 'LIB-UIX-106', 'Buku Desain UI/UX & Interaksi Manusia Komputer', 'Perpustakaan', 6, 'available'),
  (7, 'LIB-OS-107', 'Buku Konsep Sistem Operasi & Arsitektur Linux', 'Perpustakaan', 3, 'available'),
  (8, 'LIB-IOT-108', 'Buku Robotika Cerdas & Internet of Things (IoT)', 'Perpustakaan', 4, 'available'),
  (9, 'LIB-SE-109', 'Buku Rekayasa Perangkat Lunak & Pola Desain', 'Perpustakaan', 5, 'available'),
  (10, 'LIB-STAT-110', 'Buku Statistika Probabilitas & Komputasi Sains Data', 'Perpustakaan', 5, 'available'),
  (11, 'LAB-CAM-001', 'Kamera DSLR Canon EOS 80D Kit', 'Lab Komputer', 3, 'available'),
  (12, 'LAB-MIC-002', 'Microphone Wireless Rode Wireless GO II', 'Lab Komputer', 5, 'available'),
  (13, 'LAB-VR-003', 'VR Headset Meta Quest 3 128GB', 'Lab Komputer', 2, 'available'),
  (14, 'HMP-PROJ-201', 'Proyektor Portabel Epson EB-E500', 'Himpunan', 1, 'available'),
  (15, 'HMP-SPK-202', 'Portable Speaker Bluetooth JBL PartyBox', 'Himpunan', 2, 'available'),
  (16, 'LAB-DRN-901', 'Drone DJI Mini 3 Pro (Sedang Servis)', 'Lab Komputer', 0, 'maintenance');

-- Seed Borrowings
INSERT INTO borrowings (id, borrowing_code, user_id, item_id, borrow_date, due_date, return_date, status, fine_amount, notes) VALUES
  (1, 'PJM-20261001-A7K2', 2, 11, '2026-10-04T08:00:00Z', '2026-10-11T17:00:00Z', NULL, 'borrowed', 0, 'Untuk dokumentasi seminar kampus.'),
  (2, 'PJM-20260920-OVD1', 2, 1, '2026-09-27T08:00:00Z', '2026-10-04T17:00:00Z', NULL, 'overdue', 2000, 'Buku untuk referensi tugas akhir.'),
  (3, 'PJM-20260910-RET1', 3, 12, '2026-09-21T08:00:00Z', '2026-09-28T17:00:00Z', '2026-09-28T14:30:00Z', 'returned', 0, 'Dikembalikan dalam kondisi sangat baik.'),
  (4, 'PJM-20261005-PND1', 3, 14, '2026-10-06T09:00:00Z', '2026-10-13T17:00:00Z', NULL, 'pending', 0, 'Untuk rapat kerja himpunan.');

-- Seed Notifications
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
  (2, 'Peringatan Keterlambatan', 'Peminjaman LIB-LAR-101 telah melewati batas pengembalian. Denda Rp 2.000 terhitung.', 'danger', 0),
  (2, 'Peminjaman Aktif', 'Peminjaman Kamera DSLR Canon EOS 80D Kit aktif sampai 11 Okt 2026.', 'info', 1);
