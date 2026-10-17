import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../../lib/format-date';
import { formatRupiah } from '../../lib/format-rupiah';
import { Printer, Check, Copy, RotateCcw, QrCode, AlertTriangle } from 'lucide-react';

export interface QrReceiptProps {
  borrowing: {
    id: number;
    borrowingCode: string;
    borrowDate: string;
    dueDate: string;
    returnDate?: string | null;
    status: string;
    fineAmount: number;
    finePaidAt?: string | null;
    notes?: string | null;
  };
  user: {
    name: string;
    nim_nip: string;
    email?: string;
  };
  item: {
    itemCode: string;
    name: string;
    category: string;
  };
}

export const QrReceipt: React.FC<QrReceiptProps> = ({ borrowing, user, item }) => {
  const [copied, setCopied] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(borrowing.status);
  const [isRequestingReturn, setIsRequestingReturn] = useState(false);

  const isReturnMode = currentStatus === 'return_pending';
  const isReturned = currentStatus === 'returned';
  const canRequestReturn = currentStatus === 'borrowed' || currentStatus === 'overdue';

  const handleCopy = () => {
    navigator.clipboard.writeText(borrowing.borrowingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRequestReturn = async () => {
    setIsRequestingReturn(true);
    try {
      const res = await fetch(`/api/borrowings/${borrowing.id}/request-return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setCurrentStatus('return_pending');
      }
    } catch {
      // Fallback if network fails
    } finally {
      setIsRequestingReturn(false);
    }
  };

  const getOfficialStatusLabel = (status: string) => {
    switch (status) {
      case 'returned':
        return 'SELESAI DIKEMBALIKAN';
      case 'return_pending':
        return 'MENUNGGU VERIFIKASI PENGEMBALIAN DI LOKET';
      case 'overdue':
        return 'TERLAMBAT (MENUNGGU PENGEMBALIAN & DENDA)';
      case 'borrowed':
        return 'SEDANG DIPINJAM (AKTIF)';
      case 'pending':
        return 'MENUNGGU PERSETUJUAN PETUGAS';
      case 'rejected':
        return 'PENGAJUAN DITOLAK';
      default:
        return status.toUpperCase();
    }
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. SCREEN VIEW (Responsive: Mobile Centered, Desktop 2-Column) */}
      {/* ============================================================== */}
      <div className="screen-only w-full">
        {/* A. MOBILE VIEW (Centered single card, visible only on < md) */}
        <div className="md:hidden w-full max-w-md mx-auto">
          {/* Mobile Receipt Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_10px_35px_rgba(30,27,58,0.06)] overflow-hidden relative">
            {/* Top Header Banner */}
            <div
              className={`${
                isReturnMode ? 'bg-gradient-to-br from-indigo-brand to-ink' : 'bg-ink'
              } text-white p-7 text-center relative overflow-hidden transition-colors`}
            >
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
              <div
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-2 ${
                  isReturnMode
                    ? 'bg-amber-500 text-white shadow-[0_2px_10px_rgba(245,158,11,0.4)]'
                    : isReturned
                    ? 'bg-mint-light text-mint-dark border border-mint'
                    : 'bg-primary text-white shadow-[0_2px_10px_rgba(255,107,107,0.35)]'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>
                  {isReturnMode
                    ? 'QR Pengembalian Loket'
                    : isReturned
                    ? 'Transaksi Selesai'
                    : 'Bukti Transaksi Mandiri'}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight font-display">
                {isReturnMode
                  ? 'Scan QR di Loket Petugas'
                  : isReturned
                  ? 'Pengembalian Selesai'
                  : 'SIPEMBAR Kampus'}
              </h2>
              <p className="text-xs text-gray-200 mt-1">
                {isReturnMode
                  ? 'Tunjukkan kode QR ini ke petugas loket seperti pembayaran QRIS untuk mengembalikan barang'
                  : isReturned
                  ? 'Barang inventaris kampus telah sukses dikembalikan dan dicatat oleh sistem.'
                  : 'Simpan QR ini dan tunjukkan kepada petugas loket'}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-6 bg-surface-tint">
              <div
                className={`p-4 bg-white rounded-3xl shadow-sm border-2 transition ${
                  isReturnMode ? 'border-indigo-brand/30 ring-4 ring-indigo-brand/10' : 'border-gray-100'
                }`}
              >
                <QRCodeSVG
                  value={borrowing.borrowingCode}
                  size={190}
                  level="H"
                  includeMargin={true}
                  fgColor="#1E1B3A"
                />
              </div>

              {isReturnMode && (
                <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-brand bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 animate-pulse">
                  ● Menunggu Scan Verifikasi Petugas Loket
                </span>
              )}

              {isReturned && (
                <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-mint-dark bg-mint-light px-3 py-1 rounded-full border border-mint">
                  ✓ Pengembalian Telah Diverifikasi
                </span>
              )}

              {/* Borrowing Code with copy action */}
              <div className="mt-3 flex items-center gap-2">
                <span className="font-mono text-base font-bold text-ink tracking-wider bg-white px-3.5 py-1 rounded-xl border border-gray-200 shadow-2xs">
                  {borrowing.borrowingCode}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 active:scale-95 text-ink cursor-pointer shadow-2xs transition"
                  title="Salin Kode"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Perforated Divider */}
            <div className="relative py-2 flex items-center justify-center bg-surface-tint">
              <div className="absolute -left-3 w-6 h-6 bg-surface-tint rounded-full border-r border-gray-200" />
              <div className="w-full border-t-2 border-dashed border-gray-200 mx-5" />
              <div className="absolute -right-3 w-6 h-6 bg-surface-tint rounded-full border-l border-gray-200" />
            </div>

            {/* Transaction Detail Details */}
            <div className="p-6 space-y-4 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">Status Saat Ini</span>
                <StatusBadge status={currentStatus} size="sm" />
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Peminjam:</span>
                  <span className="font-semibold text-ink text-right">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">NIM / NIP:</span>
                  <span className="font-mono font-medium text-right text-gray-700">{user.nim_nip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Barang:</span>
                  <span className="font-semibold text-ink text-right max-w-[200px] truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kode Barang:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded-md text-gray-700">{item.itemCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kategori:</span>
                  <span className="font-medium text-right text-ink font-semibold">{item.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tgl Pinjam:</span>
                  <span className="font-semibold text-right text-gray-800">{formatDate(borrowing.borrowDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Batas Kembali:</span>
                  <span className={`font-semibold text-right ${isReturned ? 'text-gray-800' : 'text-rose-600 font-bold'}`}>
                    {formatDate(borrowing.dueDate)}
                  </span>
                </div>
                {borrowing.returnDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tgl Realisasi:</span>
                    <span className="font-semibold text-right text-gray-800">{formatDate(borrowing.returnDate)}</span>
                  </div>
                )}
                {borrowing.fineAmount > 0 && (
                  <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-rose-800 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Denda Keterlambatan:
                      </span>
                      <span className="font-bold text-rose-700">
                        {formatRupiah(borrowing.fineAmount)} {borrowing.finePaidAt ? '(Lunas)' : ''}
                      </span>
                    </div>
                    {!borrowing.finePaidAt && !isReturned && (
                      <p className="text-[11px] text-rose-700/90 leading-snug">
                        <strong>Wajib Lunas Saat Pengembalian:</strong> Siapkan pembayaran denda tunai/QRIS di loket petugas sebelum barang dapat diselesaikan pengembaliannya.
                      </p>
                    )}
                    {!borrowing.finePaidAt && isReturned && (
                      <p className="text-[11px] text-rose-700/90 leading-snug">
                        <strong>Catatan Tagihan:</strong> Terdapat denda keterlambatan tercatat. Silakan hubungi petugas loket untuk konfirmasi pelunasan jika belum diselesaikan.
                      </p>
                    )}
                  </div>
                )}
                {borrowing.notes && (
                  <div className="pt-2 text-xs text-gray-500 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                    <span className="font-semibold block text-gray-700 mb-0.5">Catatan:</span>
                    {borrowing.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
              {canRequestReturn && (
                <button
                  type="button"
                  onClick={handleRequestReturn}
                  disabled={isRequestingReturn}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-brand hover:bg-indigo-hover text-white text-xs font-bold transition shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    {isRequestingReturn
                      ? 'Menyiapkan QR Pengembalian...'
                      : 'Ajukan Pengembalian & Tampilkan QR Loket'}
                  </span>
                </button>
              )}
              <button
                onClick={handlePrint}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition shadow-2xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Bukti Transaksi
              </button>
            </div>
          </div>
        </div>

        {/* B. DESKTOP VIEW (Split: Informasi di Kiri, QR di Kanan, visible on >= md) */}
        <div className="hidden md:grid md:grid-cols-12 md:gap-6 items-start">
          {/* Kolom Kiri (7 / 12): Informasi Transaksi, Peminjam, Barang, Status & Denda */}
          <div className="md:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_10px_35px_rgba(30,27,58,0.06)] overflow-hidden">
              {/* Header Banner */}
              <div
                className={`${
                  isReturnMode ? 'bg-gradient-to-r from-indigo-brand to-ink' : 'bg-ink'
                } text-white p-6 relative overflow-hidden transition-colors`}
              >
                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      isReturnMode
                        ? 'bg-amber-500 text-white shadow-[0_2px_10px_rgba(245,158,11,0.4)]'
                        : isReturned
                        ? 'bg-mint-light text-mint-dark border border-mint font-semibold'
                        : 'bg-primary text-white shadow-[0_2px_10px_rgba(255,107,107,0.35)]'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>
                      {isReturnMode
                        ? 'QR Pengembalian Loket'
                        : isReturned
                        ? 'Transaksi Selesai'
                        : 'Bukti Transaksi Mandiri'}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-gray-300">
                    #{borrowing.borrowingCode}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight font-display">
                  {isReturnMode
                    ? 'Verifikasi Pengembalian di Loket'
                    : isReturned
                    ? 'Bukti Pengembalian Barang'
                    : 'Rincian Transaksi Peminjaman'}
                </h2>
                <p className="text-xs text-gray-200 mt-1">
                  {isReturnMode
                    ? 'Tunjukkan QR Code di sebelah kanan kepada petugas loket untuk menyelesaikan proses pengembalian.'
                    : isReturned
                    ? 'Barang inventaris kampus telah sukses dikembalikan dan dicatat oleh sistem.'
                    : 'Detail bukti sirkulasi peminjaman barang inventaris kampus.'}
                </p>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-5">
                {/* Status Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">
                      Status Sirkulasi Saat Ini
                    </span>
                    <span className="text-xs text-gray-500">Update status otomatis oleh sistem</span>
                  </div>
                  <StatusBadge status={currentStatus} size="md" />
                </div>

                {/* 2 Mini Cards: Peminjam & Barang */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-surface-soft border border-gray-100 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                      Identitas Peminjam
                    </span>
                    <h4 className="font-bold text-sm text-ink">{user.name}</h4>
                    <p className="text-xs font-mono text-gray-600">NIM: {user.nim_nip}</p>
                    {user.email && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-soft border border-gray-100 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                      Barang Inventaris
                    </span>
                    <h4 className="font-bold text-sm text-ink truncate" title={item.name}>
                      {item.name}
                    </h4>
                    <p className="text-xs font-mono text-gray-600">Kode: #{item.itemCode}</p>
                    <p className="text-xs text-gray-400">Kategori: {item.category}</p>
                  </div>
                </div>

                {/* Timeline Grid */}
                <div className="p-4 rounded-2xl bg-surface-soft border border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Tgl Pinjam</span>
                    <span className="font-semibold text-gray-800">{formatDate(borrowing.borrowDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Batas Kembali</span>
                    <span className={`font-semibold ${isReturned ? 'text-gray-800' : 'text-rose-600 font-bold'}`}>
                      {formatDate(borrowing.dueDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Tgl Realisasi</span>
                    <span className="font-semibold text-gray-800">
                      {borrowing.returnDate ? formatDate(borrowing.returnDate) : 'Dalam Pinjaman'}
                    </span>
                  </div>
                </div>

                {/* Denda Keterlambatan Box (Jika Ada) */}
                {borrowing.fineAmount > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Denda Keterlambatan Terhitung:
                      </span>
                      <span className="text-base font-extrabold text-rose-700 font-mono">
                        {formatRupiah(borrowing.fineAmount)} {borrowing.finePaidAt ? '(Lunas)' : ''}
                      </span>
                    </div>
                    {!borrowing.finePaidAt && !isReturned && (
                      <p className="text-xs text-rose-700/90 leading-relaxed">
                        <strong>Wajib Lunas Saat Pengembalian:</strong> Terdapat denda keterlambatan yang harus diserahkan secara tunai / QRIS kepada petugas loket sebelum pengembalian dapat diverifikasi.
                      </p>
                    )}
                    {!borrowing.finePaidAt && isReturned && (
                      <p className="text-xs text-rose-700/90 leading-relaxed">
                        <strong>Catatan Tagihan:</strong> Terdapat denda keterlambatan yang tercatat pada sistem. Silakan konfirmasi status pelunasan kepada petugas loket.
                      </p>
                    )}
                  </div>
                )}

                {/* Notes (Jika Ada) */}
                {borrowing.notes && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <span className="font-bold text-gray-800 block mb-0.5">Catatan Peminjaman:</span>
                    {borrowing.notes}
                  </div>
                )}

                {/* Primary Action Button (Jika belum diajukan pengembalian) */}
                {canRequestReturn && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleRequestReturn}
                      disabled={isRequestingReturn}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-indigo-brand hover:bg-indigo-hover text-white text-xs font-bold transition shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>
                        {isRequestingReturn
                          ? 'Menyiapkan QR Pengembalian...'
                          : 'Ajukan Pengembalian & Tampilkan QR Loket'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kolom Kanan (5 / 12): Kartu QR Code, Scan Indicator, Kode & Tombol Cetak */}
          <div className="md:col-span-5 md:sticky md:top-24 space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_10px_35px_rgba(30,27,58,0.06)] p-6 flex flex-col items-center text-center space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                  {isReturnMode
                    ? 'Loket Verifikasi Pengembalian'
                    : isReturned
                    ? 'Arsip QR Transaksi'
                    : 'Tiket QR Transaksi'}
                </span>
                <h3 className="text-base font-bold text-ink mt-0.5">
                  {isReturnMode
                    ? 'QR Pengembalian'
                    : isReturned
                    ? 'Transaksi Selesai'
                    : 'Pindai di Loket Petugas'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {isReturnMode
                    ? 'Arahkan QR Code ini ke scanner petugas loket'
                    : isReturned
                    ? 'Barang telah berhasil dikembalikan ke inventaris'
                    : 'Arahkan QR Code ini ke scanner petugas loket'}
                </p>
              </div>

              {/* QR Code Container Box */}
              <div
                className={`p-4 bg-white rounded-3xl shadow-sm border-2 transition ${
                  isReturnMode
                    ? 'border-indigo-brand/40 ring-4 ring-indigo-brand/10'
                    : isReturned
                    ? 'border-gray-200'
                    : 'border-gray-200'
                }`}
              >
                <QRCodeSVG
                  value={borrowing.borrowingCode}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#1E1B3A"
                />
              </div>

              {isReturnMode && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-brand bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-200 animate-pulse">
                  ● Menunggu Scan Verifikasi Petugas Loket
                </span>
              )}

              {isReturned && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-mint-dark bg-mint-light px-3.5 py-1.5 rounded-full border border-mint">
                  ✓ Pengembalian Telah Diverifikasi
                </span>
              )}

              {/* Borrowing Code with copy action */}
              <div className="w-full flex items-center justify-center gap-2 pt-1">
                <span className="font-mono text-sm font-bold text-ink tracking-wider bg-surface-soft px-3.5 py-2 rounded-xl border border-gray-200 shadow-2xs">
                  {borrowing.borrowingCode}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2.5 rounded-xl bg-surface-soft border border-gray-200 hover:bg-gray-100 active:scale-95 text-ink cursor-pointer shadow-2xs transition"
                  title="Salin Kode"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Cetak Bukti Transaksi */}
              <div className="w-full pt-2 border-t border-gray-100">
                <button
                  onClick={handlePrint}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen Resmi A4</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ============================================================== */}
      {/* 2. OFFICIAL PRINT DOCUMENT (Rendered ONLY when printing to A4) */}
      {/* ============================================================== */}
      <div className="receipt-print-document print-only hidden print:block text-black bg-white font-sans max-w-full">
        {/* Kop Surat Resmi Kampus */}
        <div className="border-b-2 border-black pb-2 mb-1 text-center">
          <h2 className="text-sm font-bold tracking-wider uppercase text-black">
            KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI
          </h2>
          <h1 className="text-base font-extrabold uppercase tracking-wide text-black mt-0.5">
            UNIT PELAKSANA TEKNIS (UPT) PERPUSTAKAAN & LABORATORIUM KAMPUS
          </h1>
          <p className="text-[11px] text-gray-800">
            Sistem Peminjaman Barang Mandiri (SIPEMBAR) — Gedung Perpustakaan & Laboratorium Terpadu Lt. 1
          </p>
          <p className="text-[10px] text-gray-600">
            Website: sipembar.kampus.ac.id | Email: inventaris@kampus.ac.id | Hotline Loket: (021) 555-0199
          </p>
        </div>
        <div className="border-b border-black mb-4"></div>

        {/* Judul & Nomor Registrasi Dokumen */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-300">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-tight text-black">
              SURAT BUKTI TRANSAKSI SIRKULASI INVENTARIS
            </h3>
            <span className="text-xs text-gray-600 block mt-0.5">
              Tanda Bukti Sah Peminjaman dan Pengembalian Barang Inventaris Kampus
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">No. Registrasi Transaksi</span>
            <span className="font-mono text-base font-extrabold text-black">
              #{borrowing.borrowingCode}
            </span>
          </div>
        </div>

        {/* Tabel Identitas & Rincian Barang (2 Kolom Rapi) */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          {/* Kolom 1: Data Peminjam */}
          <div className="border border-gray-400 rounded-lg p-3">
            <span className="font-bold uppercase text-[10px] text-gray-700 block pb-1 border-b border-gray-300 mb-2">
              I. IDENTITAS PEMINJAM
            </span>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="w-24 text-gray-600 py-1 font-medium">Nama Lengkap</td>
                  <td className="w-3 text-center">:</td>
                  <td className="font-bold text-black py-1">{user.name}</td>
                </tr>
                <tr>
                  <td className="text-gray-600 py-1 font-medium">NIM / NIP</td>
                  <td className="text-center">:</td>
                  <td className="font-mono font-bold text-black py-1">{user.nim_nip}</td>
                </tr>
                <tr>
                  <td className="text-gray-600 py-1 font-medium">Alamat Email</td>
                  <td className="text-center">:</td>
                  <td className="text-gray-800 py-1">{user.email || '-'}</td>
                </tr>
                <tr>
                  <td className="text-gray-600 py-1 font-medium">Status Anggota</td>
                  <td className="text-center">:</td>
                  <td className="text-black py-1 font-semibold">Civitas Akademika Kampus</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kolom 2: Data Barang */}
          <div className="border border-gray-400 rounded-lg p-3">
            <span className="font-bold uppercase text-[10px] text-gray-700 block pb-1 border-b border-gray-300 mb-2">
              II. RINCIAN BARANG INVENTARIS
            </span>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="w-24 text-gray-600 py-1 font-medium">Nama Barang</td>
                  <td className="w-3 text-center">:</td>
                  <td className="font-bold text-black py-1">{item.name}</td>
                </tr>
                <tr>
                  <td className="text-gray-600 py-1 font-medium">Kode Barang</td>
                  <td className="text-center">:</td>
                  <td className="font-mono font-bold text-black py-1">{item.itemCode}</td>
                </tr>
                <tr>
                  <td className="text-gray-600 py-1 font-medium">Kategori</td>
                  <td className="text-center">:</td>
                  <td className="text-black py-1">{item.category}</td>
                </tr>
                <tr>
                  <td className="text-gray-600 py-1 font-medium">Jumlah Unit</td>
                  <td className="text-center">:</td>
                  <td className="text-black py-1 font-semibold">1 (Satu) Unit Fisik</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel Informasi Waktu Sirkulasi & Status */}
        <div className="border border-gray-400 rounded-lg overflow-hidden mb-4 text-xs">
          <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-400 font-bold uppercase text-[10px] text-gray-800">
            III. STATUS SIRKULASI & JADWAL PENGEMBALIAN
          </div>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-gray-300">
              <tr>
                <td className="w-1/3 px-3 py-2 text-gray-600 font-medium">Tanggal Peminjaman</td>
                <td className="px-3 py-2 font-semibold text-black">{formatDate(borrowing.borrowDate)}</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-gray-600 font-medium">Batas Waktu Pengembalian (Jatuh Tempo)</td>
                <td className="px-3 py-2 font-bold text-black">{formatDate(borrowing.dueDate)}</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-gray-600 font-medium">Tanggal Realisasi Pengembalian</td>
                <td className="px-3 py-2 font-semibold text-black">
                  {borrowing.returnDate ? formatDate(borrowing.returnDate) : 'Belum Dikembalikan (Dalam Sirkulasi)'}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-gray-600 font-medium">Status Resmi Saat Ini</td>
                <td className="px-3 py-2 font-bold text-black tracking-wide">
                  [ {getOfficialStatusLabel(currentStatus)} ]
                </td>
              </tr>
              {borrowing.notes && (
                <tr>
                  <td className="px-3 py-2 text-gray-600 font-medium">Catatan Sirkulasi</td>
                  <td className="px-3 py-2 text-gray-800">{borrowing.notes}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rincian Denda Keterlambatan (Jika Ada) */}
        {borrowing.fineAmount > 0 && (
          <div className="border border-gray-400 rounded-lg p-3 mb-4 bg-gray-50 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-300 mb-2">
              <span className="font-bold uppercase text-[10px] text-black">
                IV. REKAPITULASI DENDA KETERLAMBATAN
              </span>
              <span className="font-bold font-mono text-black">
                Tarif Resmi: Rp 1.000 / Hari
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600 block text-[11px]">Total Denda Terhitung:</span>
                <span className="text-sm font-extrabold text-black font-mono">
                  {formatRupiah(borrowing.fineAmount)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 block text-[11px]">Status Pelunasan di Loket:</span>
                <span className="text-xs font-bold text-black">
                  {borrowing.finePaidAt
                    ? `LUNAS (Diverifikasi petugas pada ${formatDate(borrowing.finePaidAt)})`
                    : 'BELUM DILUNASI (Wajib Dibayarkan di Loket Petugas)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Barcode & QR Code Section untuk Scanner Loket */}
        <div className="border border-gray-400 rounded-lg p-3.5 mb-5 flex items-center justify-between">
          <div className="space-y-1 max-w-sm">
            <span className="font-bold uppercase text-[10px] text-gray-700 block">
              V. KODE PENGESAHAN LOKET DIGITAL
            </span>
            <p className="text-[11px] text-gray-700 leading-snug">
              Pindai QR Code di samping pada scanner loket inventaris untuk verifikasi keabsahan data peminjaman atau penyelesaian pengembalian fisik barang.
            </p>
            <span className="font-mono text-xs font-extrabold text-black block tracking-wider pt-1">
              {borrowing.borrowingCode}
            </span>
          </div>

          <div className="p-2 border border-black rounded-lg bg-white shrink-0">
            <QRCodeSVG
              value={borrowing.borrowingCode}
              size={110}
              level="M"
              includeMargin={false}
              fgColor="#000000"
            />
          </div>
        </div>

        {/* Syarat & Ketentuan Singkat */}
        <div className="text-[9.5px] text-gray-700 leading-relaxed mb-6 border-t border-gray-300 pt-2">
          <strong>Ketentuan Peminjam:</strong>
          <ol className="list-decimal pl-4 space-y-0.5 mt-0.5">
            <li>Surat bukti ini merupakan tanda terima resmi peminjaman barang inventaris kampus.</li>
            <li>Peminjam bertanggung jawab penuh atas keutuhan, kelengkapan, dan kebersihan barang selama masa peminjaman.</li>
            <li>Keterlambatan pengembalian dikenakan denda sesuai regulasi UPT Perpustakaan & Laboratorium.</li>
          </ol>
        </div>

        {/* Kolom Tanda Tangan Resmi (2 Kolom) */}
        <div className="grid grid-cols-2 gap-8 text-center text-xs pt-2">
          <div>
            <span className="text-[11px] text-gray-600 block">Peminjam / Mahasiswa,</span>
            <div className="h-16 flex items-end justify-center">
              <span className="font-bold underline text-black">{user.name}</span>
            </div>
            <span className="text-[10px] text-gray-600 block font-mono">NIM: {user.nim_nip}</span>
          </div>

          <div>
            <span className="text-[11px] text-gray-600 block">
              Petugas Loket Inventaris,
            </span>
            <div className="h-16 flex items-end justify-center">
              <span className="font-bold underline text-black">
                ( Petugas UPT Inventaris )
              </span>
            </div>
            <span className="text-[10px] text-gray-600 block">Cap & Tanda Tangan Loket</span>
          </div>
        </div>
      </div>
    </>
  );
};


