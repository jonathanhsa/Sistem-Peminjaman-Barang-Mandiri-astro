import React, { useState, useEffect } from 'react';
import { ScannerDialog } from '../scanner/ScannerDialog';
import { Camera, AlertCircle, Sparkles, Clock, Calendar } from 'lucide-react';
import { CategoryIcon } from '../illustrations/CategoryIcon';

export interface BorrowFormProps {
  initialCode?: string;
  hasUnpaidFine?: boolean;
  unpaidFineAmount?: number;
  activeLoansCount?: number;
}

export const BorrowForm: React.FC<BorrowFormProps> = ({
  initialCode = '',
  hasUnpaidFine = false,
  unpaidFineAmount = 0,
  activeLoansCount = 0,
}) => {
  const [code, setCode] = useState(initialCode);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [item, setItem] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchItem = async (targetCode: string) => {
    const clean = targetCode.trim().toUpperCase();
    if (!clean) return;
    setIsSearching(true);
    setSearchError(null);
    setItem(null);

    try {
      const res = await fetch(`/api/items/lookup?code=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.message || 'Barang tidak ditemukan dalam database.');
      } else {
        setItem(data);
      }
    } catch (err: any) {
      setSearchError('Gagal memuat informasi barang.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      fetchItem(initialCode);
    }
  }, [initialCode]);

  const handleCodeDetected = (detected: string) => {
    setCode(detected);
    fetchItem(detected);
  };

  const handleCodeBlur = () => {
    if (code.trim() && (!item || item.item_code !== code.trim().toUpperCase())) {
      fetchItem(code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/borrowings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemCode: item.item_code,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Gagal mengajukan peminjaman.');
        setIsSubmitting(false);
      } else {
        // Redirect to receipt
        window.location.href = data.redirectUrl || `/riwayat/${data.borrowingCode}`;
      }
    } catch (err: any) {
      setSubmitError('Terjadi kesalahan jaringan.');
      setIsSubmitting(false);
    }
  };

  const returnDateEstimate = new Date();
  returnDateEstimate.setDate(returnDateEstimate.getDate() + 7);
  const formattedDueDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(returnDateEstimate);

  const isLimitReached = activeLoansCount >= 3;

  return (
    <div className="space-y-6">
      {/* Unpaid Fine Warning Banner */}
      {hasUnpaidFine && (
        <div className="p-4 rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="text-xs">
            <h4 className="font-bold text-rose-900 mb-0.5">Peminjaman Baru Ditangguhkan</h4>
            <p>
              Anda memiliki denda belum lunas sebesar <strong>Rp {unpaidFineAmount.toLocaleString('id-ID')}</strong>. Silakan selesaikan pembayaran di loket petugas sebelum meminjam barang baru.
            </p>
          </div>
        </div>
      )}

      {/* 3 Active Loans Limit Warning Banner */}
      {isLimitReached && (
        <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-800 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-900 mb-0.5">Batas Peminjaman Tercapai</h4>
            <p>
              Anda sudah memiliki 3 peminjaman aktif/berjalan. Kembalikan salah satu barang terlebih dahulu untuk meminjam barang lainnya.
            </p>
          </div>
        </div>
      )}

      {/* Main Borrow Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-[#1E1B3A]/10 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold font-display text-[#1E1B3A]">Peminjaman Mandiri Cepat</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Scan barcode fisik pada barang atau masukkan kode inventaris untuk memverifikasi ketersediaan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Scanner Input Row */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Kode Barcode / QR Barang
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onBlur={handleCodeBlur}
                  placeholder="Contoh: LIB-LAR-101 / LAB-CAM-001"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-sm font-mono tracking-wider focus:outline-none focus:border-[#3B3FD9] uppercase"
                />
                {isSearching && (
                  <span className="absolute right-3.5 top-3.5 text-xs text-indigo-600 font-semibold animate-pulse">
                    Mencari...
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-[#FFD23F] text-[#1E1B3A] text-xs font-bold hover:brightness-105 active:scale-95 transition shadow-xs flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Buka Kamera Scanner</span>
                </button>

                <button
                  type="button"
                  onClick={() => fetchItem(code)}
                  disabled={!code.trim()}
                  className="px-4 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200 disabled:opacity-50"
                >
                  Cek
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Mendukung Barcode 1D Code 128, QR Code, OCR, atau ketik langsung kode di atas.
              </p>
              <a
                href="/katalog"
                className="text-[11px] font-bold text-[#3B3FD9] hover:underline whitespace-nowrap ml-2"
              >
                Lihat Katalog Barang →
              </a>
            </div>
          </div>

          {/* Search Error */}
          {searchError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Item Preview Card */}
          {item && (
            <div className="p-5 rounded-2xl bg-[#F6F5FF] border-2 border-indigo-100 space-y-4 animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-200 text-[#3B3FD9] flex items-center justify-center shadow-xs">
                    <CategoryIcon category={item.category} size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                      {item.item_code}
                    </span>
                    <h3 className="font-bold text-base text-[#1E1B3A] mt-0.5">{item.name}</h3>
                    <span className="text-xs text-gray-500">{item.category}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                      item.is_available
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {item.is_available ? `Tersedia (${item.stock} Unit)` : 'Tidak Dapat Dipinjam'}
                  </span>
                </div>
              </div>

              {/* Loan terms preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-indigo-200/60 text-xs">
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200">
                  <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Durasi Peminjaman</span>
                    <span className="font-bold text-gray-800">7 Hari Kalender</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Batas Pengembalian</span>
                    <span className="font-bold text-gray-800">{formattedDueDate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Keperluan / Catatan Peminjaman (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Contoh: Untuk praktikum jaringan komputer modul 3"
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 text-sm focus:outline-none focus:border-[#3B3FD9]"
            />
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!item || !item.is_available || hasUnpaidFine || isLimitReached || isSubmitting}
            className="w-full py-4 px-6 btn-sticker-primary text-sm font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isSubmitting
              ? 'Memproses Pengajuan...'
              : hasUnpaidFine
              ? `⚠️ Lunasi Denda Rp ${unpaidFineAmount.toLocaleString('id-ID')} Sebelum Meminjam`
              : isLimitReached
              ? '⚠️ Batas 3 Peminjaman Aktif Tercapai'
              : '⚡ Ajukan Peminjaman & Terbitkan QR Bukti'}
          </button>
        </form>
      </div>

      {/* Live Scanner Dialog */}
      {isScannerOpen && (
        <ScannerDialog
          isOpen={true}
          onClose={() => setIsScannerOpen(false)}
          onDetected={handleCodeDetected}
          title="Pindai Barcode / QR Inventaris"
          description="Arahkan lensa ke kode buku atau stiker inventaris lab"
        />
      )}
    </div>
  );
};
