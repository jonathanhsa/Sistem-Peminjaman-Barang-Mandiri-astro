import React, { useState } from 'react';
import { ScannerDialog } from './ScannerDialog';
import { Camera, CheckCircle2, AlertCircle, ShieldCheck, User, Package } from 'lucide-react';
import { StatusBadge } from '../borrowing/StatusBadge';
import confetti from 'canvas-confetti';

export const AdminVerification: React.FC = () => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [markFinePaid, setMarkFinePaid] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchTransaction = async (targetCode: string) => {
    const clean = targetCode.trim().toUpperCase();
    if (!clean) return;
    setIsLoading(true);
    setError(null);
    setTransaction(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/borrowings/by-code/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Data transaksi tidak ditemukan.');
      } else {
        setTransaction(data);
      }
    } catch (err: any) {
      setError('Gagal menghubungi server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetected = (detected: string) => {
    setCode(detected);
    fetchTransaction(detected);
  };

  const handleReturnAction = async () => {
    if (!transaction) return;
    setIsProcessingAction(true);
    setError(null);

    try {
      const res = await fetch(`/api/borrowings/${transaction.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markFinePaid,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal memproses pengembalian.');
      } else {
        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
        setActionSuccess('Pengembalian barang berhasil dicatat! Status telah diperbarui menjadi "returned".');
        // Refresh transaction state
        fetchTransaction(transaction.borrowing_code);
      }
    } catch (err: any) {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleApproveAction = async () => {
    if (!transaction) return;
    setIsProcessingAction(true);
    setError(null);

    try {
      const res = await fetch(`/api/borrowings/${transaction.id}/approve`, {
        method: 'POST',
      });
      if (!res.ok) {
        setError('Gagal menyetujui peminjaman.');
      } else {
        try {
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.6 },
          });
        } catch {}
        setActionSuccess('Peminjaman telah disetujui! Stok inventaris otomatis berkurang.');
        fetchTransaction(transaction.borrowing_code);
      }
    } catch (err: any) {
      setError('Terjadi kesalahan.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const resetAll = () => {
    setCode('');
    setTransaction(null);
    setError(null);
    setActionSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Search & Camera Input Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-[#1E1B3A]/10 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold font-display text-[#1E1B3A]">Verifikasi QR Bukti Transaksi Mahasiswa</h2>
          <p className="text-xs text-gray-500 mt-1">
            Pindai QR receipt dari layar smartphone mahasiswa atau masukkan kode transaksi (PJM-...)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="PJM-YYYYMMDD-XXXX"
            className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 text-sm font-mono tracking-wider focus:outline-none focus:border-[#3B3FD9] uppercase"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-3 rounded-2xl bg-[#FFD23F] text-[#1E1B3A] text-xs font-bold hover:brightness-105 active:scale-95 transition shadow-xs flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Camera className="w-4 h-4" />
              <span>Buka Kamera Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => fetchTransaction(code)}
              disabled={!code.trim() || isLoading}
              className="px-5 py-3 rounded-2xl btn-sticker-primary text-xs font-bold whitespace-nowrap"
            >
              {isLoading ? 'Mencari...' : 'Verifikasi'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2.5 font-bold animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Transaction Details & Verification Action */}
      {transaction && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-[#1E1B3A]/10 shadow-lg space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Kode Bukti Transaksi</span>
              <h3 className="text-xl font-bold font-mono text-[#3B3FD9]">{transaction.borrowing_code}</h3>
            </div>
            <div>
              <StatusBadge status={transaction.status} size="lg" />
            </div>
          </div>

          {/* Identity & Item Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Info Card */}
            <div className="p-4 rounded-2xl bg-[#F6F5FF] border border-indigo-100 space-y-2">
              <span className="text-[10px] uppercase font-bold text-indigo-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Identitas Mahasiswa
              </span>
              <h4 className="font-bold text-base text-[#1E1B3A]">{transaction.user.name}</h4>
              <p className="text-xs font-mono text-gray-600">NIM: {transaction.user.nim_nip}</p>
              {transaction.user.email && (
                <p className="text-xs text-gray-500">{transaction.user.email}</p>
              )}
            </div>

            {/* Item Info Card */}
            <div className="p-4 rounded-2xl bg-[#F6F5FF] border border-indigo-100 space-y-2">
              <span className="text-[10px] uppercase font-bold text-indigo-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Barang Inventaris
              </span>
              <h4 className="font-bold text-base text-[#1E1B3A]">{transaction.item.name}</h4>
              <p className="text-xs font-mono text-gray-600">Kode: {transaction.item.item_code}</p>
              <p className="text-xs text-gray-500">Kategori: {transaction.item.category}</p>
            </div>
          </div>

          {/* Time & Fine Calculation Details */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Tanggal Pengajuan</span>
              <span className="font-semibold text-gray-800">
                {new Date(transaction.borrow_date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Batas Pengembalian</span>
              <span className="font-semibold text-rose-600">
                {new Date(transaction.due_date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Perhitungan Denda</span>
              <span className={`font-bold ${transaction.fine_amount > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {transaction.fine_amount > 0
                  ? `Rp ${transaction.fine_amount.toLocaleString('id-ID')} (${transaction.is_overdue ? 'Terlambat' : ''})`
                  : 'Rp 0 (Tepat Waktu)'}
              </span>
            </div>
          </div>

          {/* Action Confirmation Panel */}
          <div className="pt-2">
            {transaction.status === 'pending' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-600">
                  Permohonan ini masih berstatus <strong>Menunggu Persetujuan</strong>. Klik di bawah ini untuk menyetujui dan menyerahkan barang kepada mahasiswa.
                </p>
                <button
                  type="button"
                  onClick={handleApproveAction}
                  disabled={isProcessingAction}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Setujui Peminjaman & Kurangi Stok Barang</span>
                </button>
              </div>
            )}

            {(transaction.status === 'borrowed' || transaction.status === 'overdue') && (
              <div className="space-y-4">
                {transaction.fine_amount > 0 && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-amber-900 block">Denda Terlambat Terhitung:</span>
                      <span className="text-amber-800">
                        Rp {transaction.fine_amount.toLocaleString('id-ID')} (Tarif Rp 1.000 / hari)
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
                      <input
                        type="checkbox"
                        checked={markFinePaid}
                        onChange={(e) => setMarkFinePaid(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                      <span>Tandai Denda Telah Diterima Tunai</span>
                    </label>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleReturnAction}
                  disabled={isProcessingAction}
                  className="w-full py-4 px-6 btn-sticker-primary text-sm font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Konfirmasi Pengembalian Barang (Ubah Status ke Returned)</span>
                </button>
              </div>
            )}

            {transaction.status === 'returned' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold text-sm">
                Barang ini sudah berstatus dikembalikan pada {new Date(transaction.return_date || Date.now()).toLocaleDateString('id-ID')}.
              </div>
            )}
          </div>

          <div className="text-center pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={resetAll}
              className="text-xs font-bold text-gray-500 hover:text-[#3B3FD9] underline"
            >
              Scan Transaksi Mahasiswa Lainnya
            </button>
          </div>
        </div>
      )}

      {/* Scanner Dialog Island */}
      {isScannerOpen && (
        <ScannerDialog
          isOpen={true}
          onClose={() => setIsScannerOpen(false)}
          onDetected={handleDetected}
          title="Scan QR Bukti Transaksi"
          description="Arahkan lensa ke QR Code yang ditampilkan mahasiswa"
          placeholder="PJM-YYYYMMDD-XXXX"
        />
      )}
    </div>
  );
};
