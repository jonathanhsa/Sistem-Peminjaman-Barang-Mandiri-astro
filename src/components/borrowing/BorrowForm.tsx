import React, { useState, useEffect } from 'react';
import { LiveCameraScanner } from '../scanner/LiveCameraScanner';
import { QrReceipt } from './QrReceipt';
import { CategoryIcon } from '../illustrations/CategoryIcon';
import confetti from 'canvas-confetti';
import {
  Clock,
  BookOpen,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Search,
} from 'lucide-react';

export interface BorrowFormProps {
  initialCode?: string;
  hasUnpaidFine?: boolean;
  unpaidFineAmount?: number;
  activeLoansCount?: number;
  currentUser?: {
    name: string;
    nim_nip: string;
    email?: string;
  };
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

export const BorrowForm: React.FC<BorrowFormProps> = ({
  initialCode = '',
  hasUnpaidFine = false,
  unpaidFineAmount = 0,
  activeLoansCount = 0,
  currentUser = { name: 'Mahasiswa', nim_nip: '-' },
}) => {
  const [code, setCode] = useState(initialCode);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [item, setItem] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [agreement, setAgreement] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [borrowResult, setBorrowResult] = useState<any>(null);

  // Current loan times
  const [nowDate, setNowDate] = useState(() => new Date());
  useEffect(() => {
    setNowDate(new Date());
  }, []);

  const borrowTime = formatIndonesianDate(nowDate);
  const dueDateTime = new Date(nowDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  dueDateTime.setHours(17, 0, 0, 0);
  const returnTime = formatIndonesianDate(dueDateTime);

  const isLimitReached = activeLoansCount >= 3;

  const fetchItem = async (targetCode: string) => {
    const clean = targetCode.trim().toUpperCase();
    if (!clean) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/items/lookup?code=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.message || 'Barang tidak ditemukan dalam database.');
        setItem(null);
      } else {
        setItem(data);
        setCode(clean);
        setSearchError(null);
      }
    } catch {
      setSearchError('Gagal memuat informasi barang dari server.');
      setItem(null);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      fetchItem(initialCode);
    }
  }, [initialCode]);

  const handleBarcodeDetected = (scanned: string) => {
    if (scanned && scanned !== code) {
      fetchItem(scanned);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCodeInput.trim()) {
      fetchItem(manualCodeInput.trim());
    }
  };

  const handleResetScan = () => {
    setItem(null);
    setCode('');
    setSearchError(null);
    setSubmitError(null);
  };

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
        // Fire celebration confetti!
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch {
      setSubmitError('Terjadi kesalahan jaringan saat mengajukan peminjaman.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // STATE 1: SUKSES SETELAH DI-PROCEED (Menampilkan Bukti QR & Auto Notifikasi)
  // =========================================================================
  if (borrowResult) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto py-2">
        {/* Success Alert Banner */}
        <div className="bg-emerald-500 text-white rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-3 relative overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-3xl">
            🎉
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight">
            Peminjaman Berhasil Diajukan!
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-md mx-auto">
            Notifikasi otomatis telah dibuat dan transaksi telah tersimpan di riwayat Anda. Silakan tunjukkan QR receipt ini ke petugas saat pengambilan barang.
          </p>
          <div className="pt-2">
            <span className="px-4 py-1.5 rounded-full bg-black/20 text-white font-mono text-xs font-bold tracking-wider">
              Kode Transaksi: {borrowResult.borrowingCode}
            </span>
          </div>
        </div>

        {/* Digital QR Receipt Ticket */}
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
            itemCode: item?.item_code || code,
            name: item?.name || 'Barang Inventaris',
            category: item?.category || 'Perpustakaan',
          }}
        />

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <a
            href={`/riwayat/${borrowResult.borrowingCode}`}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#3B3FD9] hover:bg-[#3235b8] text-white text-sm font-bold rounded-2xl shadow-md flex items-center justify-center gap-2 transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Lihat di Riwayat Peminjaman</span>
          </a>

          <a
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3.5 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 text-sm font-bold rounded-2xl shadow-xs flex items-center justify-center gap-2 transition"
          >
            <span>Kembali ke Beranda</span>
          </a>

          <button
            type="button"
            onClick={() => {
              setBorrowResult(null);
              handleResetScan();
            }}
            className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Pinjam Barang Lain</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER UTAMA: DUA JENIS TAMPILAN (DESKTOP SPLIT & MOBILE CENTER)
  // =========================================================================
  return (
    <div className="space-y-6">
      
      {/* ============================================================== */}
      {/* 🖥️ TAMPILAN DESKTOP (Split: Kiri Formulir, Kanan Kamera)        */}
      {/* ============================================================== */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-start">
        
        {/* KOLOM KIRI: Informasi & Formulir Peminjaman */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Header Title */}
          <div>
            <h1 className="text-2xl font-bold text-[#1E1B3A] font-display">
              Peminjaman Barang & Buku
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {item
                ? 'Periksa informasi barang dan konfirmasi pengajuan peminjaman di bawah ini.'
                : 'Pindai barcode pada buku atau peralatan inventaris menggunakan kamera di sebelah kanan.'}
            </p>
          </div>

          {/* Alert Peringatan Batas / Denda */}
          {hasUnpaidFine && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                Anda memiliki tunggakan denda sebesar <strong>Rp {unpaidFineAmount.toLocaleString('id-ID')}</strong>. Harap lunasi terlebih dahulu di bagian administrasi.
              </span>
            </div>
          )}

          {isLimitReached && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Batas maksimal 3 peminjaman aktif tercapai. Harap kembalikan salah satu barang terlebih dahulu.
              </span>
            </div>
          )}

          {searchError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{searchError}</span>
            </div>
          )}

          {/* KONDISI 1: JIKA BELUM ADA BARANG TERSCAN */}
          {!item ? (
            <div className="space-y-4">
              {/* Petunjuk Arah Kamera */}
              <div className="p-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[#1E1B3A]">Kamera Siap Memindai</h3>
                  <p className="text-xs text-gray-500">
                    Arahkan barcode atau kode QR barang ke bingkai kamera di sisi kanan.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5 text-xs text-gray-600">
                  <p className="font-semibold text-gray-700 text-[11px]">Tips Pemindaian Cepat:</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-500 pl-1">
                    <li>Posisikan barcode pada jarak sekitar 15–25 cm dari kamera.</li>
                    <li>Pastikan pencahayaan memadai agar garis barcode terlihat jelas.</li>
                    <li>Mendukung Barcode 1D (Code 128 / EAN) dan QR Code inventaris.</li>
                  </ul>
                </div>

                {/* Input Kode Manual (Fallback) */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    Barcode tidak terbaca? Masukkan kode secara manual:
                  </p>
                  <form onSubmit={handleManualSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={manualCodeInput}
                      onChange={(e) => setManualCodeInput(e.target.value)}
                      placeholder="Contoh: LIB-LAR-101 / LAB-CAM-001"
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-[#3B3FD9] focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={!manualCodeInput.trim() || isSearching}
                      className="px-4 py-2 bg-[#3B3FD9] text-white text-xs font-bold rounded-xl hover:bg-[#3235b8] disabled:opacity-50 transition shrink-0 flex items-center gap-1.5"
                    >
                      {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Cari</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Ketentuan Ringkas */}
              <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-2xs space-y-2 text-xs text-gray-500">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Peminjam:</span>
                  <span className="font-semibold text-gray-800">{currentUser.name} ({currentUser.nim_nip})</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Durasi Standar:</span>
                  <span className="font-semibold text-gray-800">7 Hari Kalender</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Denda Keterlambatan:</span>
                  <span className="text-rose-600 font-semibold">Rp 1.000 / hari per barang</span>
                </div>
              </div>
            </div>
          ) : (
            /* KONDISI 2: SETELAH BARANG BERHASIL TERSCAN */
            <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
              
              {/* Card Informasi Barang */}
              <div className="p-5 bg-white rounded-2xl border border-gray-200/90 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CategoryIcon category={item.category} size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-semibold uppercase tracking-wider">
                          {item.category}
                        </span>
                        <span className="font-mono text-xs font-bold text-gray-500">
                          {item.item_code}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-gray-900 mt-1">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Status: <span className="text-emerald-600 font-semibold">Tersedia ({item.stock} unit)</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetScan}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
                    title="Ganti Barang"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Jadwal Peminjaman (Clean, Unified 2-Column Card) */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Jadwal Peminjaman</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block">
                      Waktu Pinjam
                    </span>
                    <p className="text-xs font-bold text-gray-900 mt-0.5">
                      {borrowTime.dayName}, {borrowTime.dateString}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Pukul {borrowTime.timeString}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block">
                      Tenggat Kembali (7 Hari)
                    </span>
                    <p className="text-xs font-bold text-gray-900 mt-0.5">
                      {returnTime.dayName}, {returnTime.dateString}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Pukul 17:00 WIB
                    </p>
                  </div>
                </div>
              </div>

              {/* Keperluan Peminjaman */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs space-y-2.5">
                <label htmlFor="notes-desktop" className="block text-xs font-semibold text-gray-700">
                  Keperluan Peminjaman (Opsional)
                </label>
                <textarea
                  id="notes-desktop"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Tulis alasan peminjaman atau kegiatan..."
                  className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:border-[#3B3FD9] focus:outline-none transition resize-none text-gray-800"
                />

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {REASON_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNotes(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        notes === preset
                          ? 'bg-[#3B3FD9] text-white border-[#3B3FD9] font-semibold'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Persetujuan */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="agree-desktop"
                  checked={agreement}
                  onChange={(e) => setAgreement(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#3B3FD9] accent-[#3B3FD9] cursor-pointer"
                />
                <label htmlFor="agree-desktop" className="text-xs text-gray-600 leading-snug cursor-pointer select-none">
                  Saya memahami dan menyetujui ketentuan peminjaman inventaris serta bersedia mengembalikan sebelum batas waktu yang ditentukan.
                </label>
              </div>

              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={!agreement || hasUnpaidFine || isLimitReached || isSubmitting}
                  className="flex-1 py-3 px-5 bg-[#3B3FD9] hover:bg-[#3235b8] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Memproses Peminjaman...</span>
                    </>
                  ) : (
                    <>
                      <span>Konfirmasi Peminjaman</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResetScan}
                  className="py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          )}

        </div>

        {/* KOLOM KANAN: Kamera Scanner Langsung Aktif */}
        <div className="lg:col-span-6 sticky top-24 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-gray-600 px-1">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Kamera Pemindai</span>
            </span>
            <span className="text-[11px] text-gray-400">Arahkan barcode atau QR ke lensa</span>
          </div>

          <LiveCameraScanner
            onDetected={handleBarcodeDetected}
            isPaused={!!item}
            detectedCode={item?.item_code || null}
            onResetScan={handleResetScan}
            onManualInputClick={() => {
              const el = document.getElementById('notes-desktop');
              if (el) el.focus();
            }}
          />
        </div>

      </div>

      {/* ============================================================== */}
      {/* 📱 TAMPILAN MOBILE (Kamera Langsung di Tengah ➡️ Form Detail)  */}
      {/* ============================================================== */}
      <div className="block lg:hidden space-y-4">
        
        {/* KONDISI 1: SEBELUM BARANG TERSCAN */}
        {!item ? (
          <div className="space-y-4">
            
            {/* Header Mobile Ringkas */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold font-display text-[#1E1B3A]">
                Pindai Barcode Barang
              </h2>
              <p className="text-xs text-gray-500">
                Arahkan lensa kamera langsung ke kode barcode atau QR buku / inventaris
              </p>
            </div>

            {/* Live Camera Scanner Langsung di Tengah */}
            <div className="w-full max-w-md mx-auto">
              <LiveCameraScanner
                onDetected={handleBarcodeDetected}
                isPaused={false}
                onResetScan={handleResetScan}
              />
            </div>

            {/* Fallback Input Manual Mobile */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2 max-w-md mx-auto">
              <p className="text-xs font-medium text-gray-700">Barcode tidak terbaca? Masukkan kode manual:</p>
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <input
                  type="text"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  placeholder="LIB-LAR-101 / LAB-CAM-001"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-[#3B3FD9]"
                />
                <button
                  type="submit"
                  disabled={!manualCodeInput.trim() || isSearching}
                  className="px-4 py-2 bg-[#3B3FD9] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition shrink-0"
                >
                  {isSearching ? '...' : 'Cari'}
                </button>
              </form>
            </div>

            {searchError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center max-w-md mx-auto">
                {searchError}
              </div>
            )}
          </div>
        ) : (
          /* KONDISI 2: SETELAH BARANG TERSCAN DI MOBILE */
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto animate-fade-up">
            
            {/* Tombol Kembali / Ganti Barang */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetScan}
                className="text-xs font-semibold text-[#3B3FD9] flex items-center gap-1 hover:underline"
              >
                ← Pindai Ulang
              </button>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                ✓ Barcode Terdeteksi
              </span>
            </div>

            {/* Informasi Buku / Barang */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                  <CategoryIcon category={item.category} size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-semibold">
                      {item.category}
                    </span>
                    <span className="font-mono text-xs font-bold text-gray-500">
                      {item.item_code}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 mt-1 leading-snug">
                    {item.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                <span>Ketersediaan Stok:</span>
                <span className="font-semibold text-emerald-700">
                  Tersedia ({item.stock} Unit)
                </span>
              </div>
            </div>

            {/* Informasi Hari, Tanggal, dan Jam */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Waktu Peminjaman & Batas Kembali</span>
              </div>

              <div className="space-y-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                  <span className="text-gray-500">Waktu Pinjam:</span>
                  <span className="font-bold text-gray-900">{borrowTime.dayName}, {borrowTime.dateString}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                  <span className="text-gray-500">Tenggat Kembali:</span>
                  <span className="font-bold text-indigo-700">{returnTime.dayName}, {returnTime.dateString} (7 Hari)</span>
                </div>
              </div>
            </div>

            {/* Alasan / Keperluan Peminjaman */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs space-y-2.5">
              <label htmlFor="notes-mobile" className="block text-xs font-semibold text-gray-700">
                Keperluan Peminjaman (Opsional):
              </label>
              <textarea
                id="notes-mobile"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Tulis alasan peminjaman..."
                className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:border-[#3B3FD9] focus:outline-none resize-none"
              />

              <div className="flex flex-wrap gap-1.5 pt-1">
                {REASON_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNotes(preset)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition ${
                      notes === preset
                        ? 'bg-[#3B3FD9] text-white border-[#3B3FD9] font-semibold'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Persetujuan */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-2">
              <input
                type="checkbox"
                id="agree-mobile"
                checked={agreement}
                onChange={(e) => setAgreement(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#3B3FD9] accent-[#3B3FD9]"
              />
              <label htmlFor="agree-mobile" className="text-xs text-gray-600">
                Saya menyetujui ketentuan peminjaman dan bersedia mengembalikan sebelum batas jatuh tempo.
              </label>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {submitError}
              </div>
            )}

            {/* Tombol Proceed Mobile */}
            <button
              type="submit"
              disabled={!agreement || hasUnpaidFine || isLimitReached || isSubmitting}
              className="w-full py-3 px-5 bg-[#3B3FD9] hover:bg-[#3235b8] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses Peminjaman...</span>
                </>
              ) : (
                <>
                  <span>Konfirmasi Peminjaman</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

      </div>

    </div>
  );
};
