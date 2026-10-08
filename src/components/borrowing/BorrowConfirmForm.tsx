import React, { useState } from 'react';
import { QrReceipt } from './QrReceipt';
import { CategoryIcon } from '../illustrations/CategoryIcon';
import { Mascot } from '../illustrations/Mascot';
import {
  Clock,
  BookOpen,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Calendar,
  Sparkles,
  User,
} from 'lucide-react';

export interface BorrowConfirmFormProps {
  item: {
    id: number;
    name: string;
    item_code: string;
    category: string;
    stock: number;
    location?: string | null;
    is_available: boolean;
  };
  currentUser?: {
    name: string;
    nim_nip: string;
    email?: string;
  };
  hasUnpaidFine?: boolean;
  unpaidFineAmount?: number;
  activeLoansCount?: number;
}

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function formatIndonesianDate(date: Date) {
  const dayName = DAYS[date.getDay()];
  const day = date.getDate();
  const monthName = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return {
    dayName,
    dateString: `${day} ${monthName} ${year}`,
    timeString: `${hours}:${minutes} WIB`,
    fullString: `${dayName}, ${day} ${monthName} ${year} • ${hours}:${minutes} WIB`,
  };
}

const REASON_PRESETS = [
  'Tugas Akhir / Skripsi',
  'Praktikum Laboratorium',
  'Referensi Kuliah',
  'Kegiatan Organisasi',
  'Riset Mandiri',
];

export const BorrowConfirmForm: React.FC<BorrowConfirmFormProps> = ({
  item,
  currentUser = { name: 'Mahasiswa', nim_nip: '-' },
  hasUnpaidFine = false,
  unpaidFineAmount = 0,
  activeLoansCount = 0,
}) => {
  const [notes, setNotes] = useState('');
  const [agreement, setAgreement] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [borrowResult, setBorrowResult] = useState<any>(null);

  const [nowDate] = useState(() => new Date());
  const borrowTime = formatIndonesianDate(nowDate);
  const dueDateTime = new Date(nowDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  dueDateTime.setHours(17, 0, 0, 0);
  const returnTime = formatIndonesianDate(dueDateTime);

  const isLimitReached = activeLoansCount >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !item.is_available || hasUnpaidFine || isLimitReached || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/borrowings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemCode: item.item_code,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Gagal mengajukan peminjaman.');
      } else {
        setBorrowResult(data);
        try {
          const confettiModule = await import('canvas-confetti');
          const confetti = (confettiModule as any).default || confettiModule;
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    } catch {
      setSubmitError('Terjadi kesalahan jaringan saat mengajukan peminjaman.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // 🎉 STATE SUKSES: Tiket Bukti Transaksi QR & Notifikasi
  // =========================================================================
  if (borrowResult) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto py-2">
        <div className="bg-[#1E1B3A] text-white rounded-3xl p-7 sm:p-9 shadow-2xl text-center space-y-3 relative overflow-hidden border border-white/10">
          {/* Subtle Ambient Light */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF6B6B]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#3B3FD9]/30 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto border border-white/20">
            <Mascot mood="happy" size={42} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight">
            Peminjaman Berhasil Diajukan!
          </h2>
          <div className="w-12 h-1 bg-[#FF6B6B] rounded-full mx-auto" />

          <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto pt-1 font-normal">
            Notifikasi otomatis telah dikirim dan transaksi tersimpan di riwayat. Tunjukkan bukti QR ini ke petugas saat pengambilan barang.
          </p>

          <div className="pt-2">
            <span className="px-4 py-1.5 rounded-full bg-white/10 text-[#FFD23F] font-mono text-xs font-bold tracking-wider border border-white/15">
              Kode Transaksi: {borrowResult.borrowingCode}
            </span>
          </div>
        </div>

        <QrReceipt
          borrowing={{
            id: borrowResult.borrowing?.id || 0,
            borrowingCode: borrowResult.borrowingCode,
            borrowDate: borrowResult.borrowing?.borrowDate || nowDate.toISOString(),
            dueDate: borrowResult.borrowing?.dueDate || dueDateTime.toISOString(),
            status: 'pending',
            fineAmount: 0,
            notes: notes || null,
          }}
          user={currentUser}
          item={{
            itemCode: item.item_code,
            name: item.name,
            category: item.category,
          }}
        />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <a
            href={`/riwayat/${borrowResult.borrowingCode}`}
            className="w-full sm:w-auto px-7 py-3.5 btn-coral rounded-full text-xs font-bold tracking-wide flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Lihat di Riwayat Peminjaman</span>
          </a>

          <a
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 text-xs font-bold rounded-full shadow-xs flex items-center justify-center gap-2 transition"
          >
            <span>Kembali ke Beranda</span>
          </a>

          <a
            href="/pinjam"
            className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Pinjam Barang Lain</span>
          </a>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 📝 TAMPILAN FORMULIR: Style Baru Serasi dengan Authentication
  // =========================================================================
  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <a
          href="/pinjam"
          className="text-xs font-semibold text-gray-500 hover:text-[#FF6B6B] flex items-center gap-1.5 transition"
        >
          ← Kembali ke Scanner
        </a>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Barcode Terverifikasi</span>
        </span>
      </div>

      {/* Main Grid: Split Layout (Kiri Formulir, Kanan Showcase Rak Buku) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ============================================================ */}
        {/* KOLOM KIRI: FORMULIR UTAMA PEMINJAMAN                       */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Header Title dengan Coral Underline Bar */}
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shadow-2xs">
                <Mascot mood="happy" size={22} />
              </div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">SIPEMBAR Kampus</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B3A] tracking-tight font-display">
              Formulir Pinjam
            </h1>
            {/* Signature Coral Accent Bar */}
            <div className="w-12 h-1 bg-[#FF6B6B] rounded-full mt-2" />
            <p className="text-xs sm:text-sm text-gray-500 mt-2.5 font-normal">
              Lengkapi keperluan peminjaman Anda untuk menerbitkan tiket bukti transaksi digital.
            </p>
          </div>

          {/* Alert Tunggakan Denda */}
          {hasUnpaidFine && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>
                Anda memiliki tunggakan denda sebesar <strong>Rp {unpaidFineAmount.toLocaleString('id-ID')}</strong>. Harap lunasi terlebih dahulu di bagian administrasi sebelum mengajukan pinjaman baru.
              </span>
            </div>
          )}

          {/* Alert Batas Pinjaman Aktif */}
          {isLimitReached && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
              <span>
                Batas maksimal 3 peminjaman aktif tercapai. Harap kembalikan salah satu barang terlebih dahulu.
              </span>
            </div>
          )}

          {/* Form Card Container */}
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-[0_10px_35px_rgba(30,27,58,0.06)] space-y-5">
            
            {/* Detail Barang Terpilih */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F7FF] border border-gray-100/90 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200/80 text-gray-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <CategoryIcon category={item.category} size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200/80 text-gray-700 text-[10px] font-bold uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className="font-mono text-xs font-bold text-gray-500">
                        {item.item_code}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-gray-900 mt-1">
                      {item.name}
                    </h3>
                    {item.location && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Lokasi: {item.location}
                      </p>
                    )}
                  </div>
                </div>

                <a
                  href="/pinjam"
                  className="p-2 rounded-xl text-gray-400 hover:text-[#FF6B6B] hover:bg-white transition shrink-0"
                  title="Ganti Barang"
                >
                  <RefreshCw className="w-4 h-4" />
                </a>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200/60 text-xs text-gray-500">
                <span>Ketersediaan Stok:</span>
                <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full text-[11px]">
                  ✓ Tersedia ({item.stock} Unit)
                </span>
              </div>
            </div>

            {/* Jadwal Peminjaman & Batas Pengembalian */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Jadwal Peminjaman & Batas Kembali</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F8F7FF] border border-gray-100">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Waktu Pinjam (Sekarang)
                  </span>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">
                    {borrowTime.dayName}, {borrowTime.dateString}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Pukul {borrowTime.timeString}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100">
                  <span className="text-[10px] font-semibold text-[#FF6B6B] uppercase tracking-wider block">
                    Tenggat Kembali (7 Hari)
                  </span>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">
                    {returnTime.dayName}, {returnTime.dateString}
                  </p>
                  <p className="text-[11px] text-[#FF6B6B] font-semibold mt-0.5">
                    Pukul 17:00 WIB
                  </p>
                </div>
              </div>
            </div>

            {/* Keperluan Peminjaman */}
            <div className="space-y-2.5">
              <label htmlFor="notes" className="block text-xs font-semibold text-gray-700">
                Keperluan Peminjaman (Opsional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Tulis alasan peminjaman atau kegiatan perkuliahan..."
                className="w-full p-3.5 text-xs rounded-2xl border border-gray-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 focus:outline-none transition resize-none text-gray-800 bg-[#F8F7FF]/50"
              />

              {/* Tag Preset Keperluan */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {REASON_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNotes(preset)}
                    className={`text-[11px] px-3 py-1 rounded-full border transition cursor-pointer font-medium ${
                      notes === preset
                        ? 'bg-[#FF6B6B] text-white border-[#FF6B6B] shadow-xs font-semibold'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#FF6B6B] hover:text-[#FF6B6B]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Persetujuan Ketentuan Peminjaman */}
            <div className="p-3.5 rounded-2xl bg-[#F8F7FF] border border-gray-200/80 flex items-start gap-3">
              <input
                type="checkbox"
                id="agree"
                checked={agreement}
                onChange={(e) => setAgreement(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#FF6B6B] accent-[#FF6B6B] cursor-pointer"
              />
              <label htmlFor="agree" className="text-xs text-gray-600 leading-snug cursor-pointer select-none">
                Saya memahami dan menyetujui ketentuan peminjaman inventaris kampus serta bersedia mengembalikan sebelum batas jatuh tempo.
              </label>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Tombol Aksi (Coral Pill Button) */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!agreement || hasUnpaidFine || isLimitReached || isSubmitting}
                className="flex-1 py-3.5 px-6 btn-coral rounded-full text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses Transaksi...</span>
                  </>
                ) : (
                  <>
                    <span>Konfirmasi Peminjaman</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <a
                href="/pinjam"
                className="py-3.5 px-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition text-center"
              >
                Batal
              </a>
            </div>

          </form>

        </div>

        {/* ============================================================ */}
        {/* KOLOM KANAN: SHOWCASE RAK BUKU & RINGKASAN PEMINJAM         */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          
          {/* Bookshelf Hero Card dengan Wave SVG Curve (Identik dengan Auth) */}
          <div className="relative rounded-3xl overflow-hidden bg-stone-900 shadow-xl border border-gray-100 flex flex-col">
            
            {/* Foto Rak Buku Perpustakaan */}
            <div className="relative w-full h-44 sm:h-52 overflow-hidden bg-stone-900">
              <img
                src="/images/bookshelf-bg.jpg"
                alt="Rak Buku Perpustakaan Kampus"
                className="w-full h-full object-cover object-center filter brightness-[0.95]"
              />

              {/* Organic Wave Curve Transition at Bottom of Image */}
              <div className="absolute -bottom-[1px] left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none">
                <svg viewBox="0 0 500 80" preserveAspectRatio="none" className="w-full h-12 text-white fill-current block">
                  <path d="M 0,30 C 140,5 280,80 500,25 L 500,80 L 0,80 Z"></path>
                </svg>
              </div>
            </div>

            {/* Konten Ringkasan Peminjam di Bawah Wave */}
            <div className="bg-white p-6 pt-2 space-y-4 relative z-20">
              
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shadow-2xs">
                  <Mascot mood="happy" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E1B3A]">Ringkasan Peminjam</h3>
                  <p className="text-[11px] text-gray-400">Verifikasi akun & data transaksi</p>
                </div>
              </div>

              {/* Rincian Peminjam */}
              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>Nama Peminjam:</span>
                  </span>
                  <span className="font-bold text-gray-900">{currentUser.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">NIM / NIP:</span>
                  <span className="font-mono font-bold text-gray-800">{currentUser.nim_nip}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Durasi Maksimal:</span>
                  </span>
                  <span className="font-semibold text-gray-900">7 Hari Kalender</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Tarif Peminjaman:</span>
                  </span>
                  <span className="font-bold text-emerald-700">Gratis (Mandiri)</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <span className="text-gray-500">Denda Keterlambatan:</span>
                  <span className="font-bold text-[#FF6B6B]">Rp 1.000 / hari</span>
                </div>
              </div>

              {/* Pesan Edukasi Kampus */}
              <div className="p-3.5 rounded-2xl bg-[#F8F7FF] border border-gray-100 flex items-start gap-2.5 text-[11px] text-gray-500 leading-relaxed">
                <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
                <span>
                  Pengembalian tepat waktu membantu rekan mahasiswa lain dapat memanfaatkan buku dan peralatan inventaris secara adil.
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
