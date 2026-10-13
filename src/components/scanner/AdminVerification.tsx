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
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
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
    <div className="space-y-5">
      {/* Search & Camera Input Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">Verifikasi QR Bukti Transaksi Mahasiswa</h2>
          <p className="text-xs text-gray-400 mt-1">
            Pindai QR receipt dari layar mahasiswa atau masukkan nomor tracking transaksi (PJM-...)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="PJM-YYYYMMDD-XXXX"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-[#F8FAFC] text-xs font-mono tracking-wider focus:outline-none focus:border-[#3B3FD9] focus:bg-white uppercase transition"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Camera className="w-4 h-4 text-gray-600" />
              <span>Buka Kamera</span>
            </button>

            <button
              type="button"
              onClick={() => fetchTransaction(code)}
              disabled={!code.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-[#3B3FD9] hover:bg-[#3235b8] text-white text-xs font-bold shadow-md shadow-indigo-500/20 whitespace-nowrap transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Mencari...' : 'Verifikasi'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}
      </div>

      {/* Transaction Details & Verification Action */}
      {transaction && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-5 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Kode Bukti Transaksi</span>
              <h3 className="text-lg font-bold font-mono text-[#3B3FD9]">#{transaction.borrowing_code}</h3>
            </div>
            <div>
              <StatusBadge status={transaction.status} size="md" />
            </div>
          </div>

          {/* Identity & Item Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Info Card */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-gray-100 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-indigo-600 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Identitas Mahasiswa
              </span>
              <h4 className="font-bold text-sm text-[#0F172A]">{transaction.user.name}</h4>
              <p className="text-xs font-mono text-gray-600">NIM: {transaction.user.nim_nip}</p>
              {transaction.user.email && (
                <p className="text-xs text-gray-400">{transaction.user.email}</p>
              )}
            </div>

            {/* Item Info Card */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-gray-100 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-indigo-600 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Barang Inventaris
              </span>
              <h4 className="font-bold text-sm text-[#0F172A]">{transaction.item.name}</h4>
              <p className="text-xs font-mono text-gray-600">Kode: #{transaction.item.item_code}</p>
              <p className="text-xs text-gray-400">Kategori: {transaction.item.category}</p>
            </div>
          </div>

          {/* Time & Fine Calculation Details */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Tanggal Pengajuan</span>
              <span className="font-semibold text-gray-700">
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
              <span className={`font-bold ${transaction.fine_amount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {transaction.fine_amount > 0
                  ? `Rp ${transaction.fine_amount.toLocaleString('id-ID')}`
                  : 'Rp 0'}
              </span>
            </div>
          </div>

          {/* Action Confirmation Panel */}
          <div className="pt-2">
            {transaction.status === 'pending' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Permohonan ini masih berstatus <strong>Menunggu Persetujuan</strong>. Klik tombol berikut untuk menyetujui dan menyerahkan fisik barang.
                </p>
                <button
                  type="button"
                  onClick={handleApproveAction}
                  disabled={isProcessingAction}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Setujui Peminjaman & Kurangi Stok Barang</span>
                </button>
              </div>
            )}

            {(transaction.status === 'borrowed' || transaction.status === 'overdue') && (
              <div className="space-y-3">
                {transaction.fine_amount > 0 && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-amber-900 block">Denda Terhitung:</span>
                      <span className="text-amber-800">
                        Rp {transaction.fine_amount.toLocaleString('id-ID')}
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
                  className="w-full py-3 px-4 rounded-xl bg-[#3B3FD9] hover:bg-[#3235b8] text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Pengembalian Barang (Status Returned)</span>
                </button>
              </div>
            )}

            {transaction.status === 'returned' && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold text-xs">
                Barang ini sudah dikembalikan pada {new Date(transaction.return_date || Date.now()).toLocaleDateString('id-ID')}.
              </div>
            )}
          </div>

          <div className="text-center pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={resetAll}
              className="text-xs font-bold text-gray-400 hover:text-[#3B3FD9] underline cursor-pointer"
            >
              Scan Transaksi Lainnya
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
