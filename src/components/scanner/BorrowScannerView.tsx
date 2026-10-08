import React, { useState, useEffect, useRef } from 'react';
import { LiveCameraScanner } from './LiveCameraScanner';
import { CategoryIcon } from '../illustrations/CategoryIcon';
import {
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export interface DetectedItemData {
  id: number;
  item_code: string;
  name: string;
  category: string;
  stock: number;
  status: string;
  is_available: boolean;
}

export interface BorrowScannerViewProps {
  currentUser?: {
    name: string;
    nim_nip: string;
  };
  initialError?: string | null;
}

function playScanBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // AudioContext might be silent if user hasn't interacted with page
  }
}

export const BorrowScannerView: React.FC<BorrowScannerViewProps> = ({
  currentUser = { name: 'Mahasiswa', nim_nip: '-' },
  initialError = null,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [detectedItem, setDetectedItem] = useState<DetectedItemData | null>(null);
  const [countdown, setCountdown] = useState<number>(3);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const handleProcessCode = async (rawCode: string) => {
    const clean = rawCode.trim().toUpperCase();
    if (!clean || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/items/lookup?code=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || `Barang dengan kode "${clean}" tidak ditemukan dalam sistem inventaris.`);
        setIsLoading(false);
      } else {
        playScanBeep();
        const item: DetectedItemData = {
          id: data.id,
          item_code: data.item_code,
          name: data.name,
          category: data.category,
          stock: data.stock,
          status: data.status,
          is_available: data.is_available,
        };
        setDetectedItem(item);
        setIsLoading(false);

        // If item is available, start countdown to move to form page
        if (item.is_available) {
          setCountdown(3);
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                window.location.href = `/pinjam/form?code=${encodeURIComponent(item.item_code)}`;
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          countdownTimerRef.current = timer;
        }
      }
    } catch {
      setError('Gagal menghubungi server untuk memvalidasi barcode barang.');
      setIsLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleProcessCode(manualCode);
    }
  };

  const handleProceed = () => {
    if (!detectedItem) return;
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    window.location.href = `/pinjam/form?code=${encodeURIComponent(detectedItem.item_code)}`;
  };

  const handleReset = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setDetectedItem(null);
    setError(null);
    setIsLoading(false);
    setManualCode('');
    setCountdown(3);
  };

  return (
    <div className="space-y-6">

      {/* ============================================================== */}
      {/* 🌟 MODAL PREVIEW DATA BARANG (Ditampilkan saat barcode terbaca) */}
      {/* ============================================================== */}
      {detectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full p-6 space-y-5 animate-scale-in">
            {/* Header Status */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Data Barang Berhasil Terbaca
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold">
                {detectedItem.item_code}
              </span>
            </div>

            {/* Informasi Detail Barang */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-white text-gray-700 flex items-center justify-center shrink-0 shadow-2xs border border-gray-200">
                <CategoryIcon category={detectedItem.category} size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                  {detectedItem.category}
                </span>
                <h3 className="font-bold text-sm text-gray-900 leading-snug mt-0.5">
                  {detectedItem.name}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  {detectedItem.is_available ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Stok Tersedia ({detectedItem.stock} Unit)</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Stok Habis / Tidak Tersedia</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Countdown Otomatis Menuju Form */}
            {detectedItem.is_available ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Membuka formulir peminjaman...</span>
                  <span className="font-bold text-[#FF6B6B]">{countdown} detik</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#FF6B6B] h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(countdown / 3) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                Barang ini sedang tidak dapat dipinjam karena stok kosong atau dalam perbaikan.
              </div>
            )}

            {/* Tombol Aksi */}
            <div className="flex items-center gap-2.5 pt-1">
              {detectedItem.is_available && (
                <button
                  type="button"
                  onClick={handleProceed}
                  className="flex-1 py-3 px-5 btn-coral text-white text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Lanjut ke Formulir</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleReset}
                className={`py-3 px-4 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
                  detectedItem.is_available
                    ? 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    : 'w-full btn-coral text-white border-transparent'
                }`}
              >
                Pindai Barang Lain
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ============================================================== */}
      {/* 🖥️ TAMPILAN DESKTOP (Split: Kiri Panduan/Manual, Kanan Kamera)  */}
      {/* ============================================================== */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Kolom Kiri: Header & Informasi & Input Manual */}
        <div className="lg:col-span-6 space-y-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B3A] font-display tracking-tight">
              Peminjaman Barang & Buku
            </h1>
            <div className="w-11 h-1 bg-[#FF6B6B] rounded-full mt-2"></div>
            <p className="text-xs text-gray-500 mt-2.5">
              Pindai barcode pada buku atau peralatan inventaris menggunakan kamera di sebelah kanan.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Card Barang Terdeteksi di Kolom Kiri Desktop */}
          {detectedItem && (
            <div className="p-5 rounded-3xl bg-white border border-emerald-200 text-gray-800 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Barang Terdeteksi</span>
                </span>
                <span className="font-mono text-gray-500 text-[11px] font-bold bg-gray-100 px-2 py-0.5 rounded-md">{detectedItem.item_code}</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900">{detectedItem.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{detectedItem.category} • Stok: {detectedItem.stock} Unit</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleProceed}
                  className="flex-1 py-2.5 px-4 btn-coral text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Buka Formulir Pinjam</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2.5 px-4 bg-gray-100 text-gray-600 text-xs font-semibold rounded-2xl hover:bg-gray-200 cursor-pointer transition"
                >
                  Scan Ulang
                </button>
              </div>
            </div>
          )}

          {/* Panduan Pemindaian */}
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-[0_10px_35px_rgba(30,27,58,0.06)] space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[#1E1B3A]">Kamera Siap Memindai</h3>
              <p className="text-xs text-gray-500">
                Arahkan barcode atau kode QR barang ke bingkai kamera di sisi kanan.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5 text-xs text-gray-600">
              <p className="font-bold text-gray-700 text-[11px]">Tips Pemindaian:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-500 pl-1">
                <li>Posisikan barcode pada jarak sekitar 15–25 cm dari kamera.</li>
                <li>Pastikan pencahayaan memadai agar garis barcode terlihat jelas.</li>
                <li>Mendukung Barcode 1D (Code 128 / EAN) dan QR Code inventaris.</li>
              </ul>
            </div>

            {/* Input Kode Manual */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-2.5">
                Barcode tidak terbaca? Masukkan kode secara manual:
              </p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Contoh: LIB-LAR-101 / LAB-CAM-001"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-[#FF6B6B] focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim() || isLoading}
                  className="px-5 py-2.5 btn-coral text-white text-xs font-bold rounded-2xl disabled:opacity-50 transition shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Cari</span>
                </button>
              </form>
            </div>
          </div>

          {/* Informasi Pengguna & Ketentuan */}
          <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-[0_10px_35px_rgba(30,27,58,0.06)] space-y-2.5 text-xs text-gray-500">
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
              <span className="text-rose-600 font-bold">Rp 1.000 / hari per barang</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Kamera Scanner Langsung Aktif */}
        <div className="lg:col-span-6 sticky top-24 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-gray-600 px-1">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Kamera Pemindai</span>
            </span>
            <span className="text-[11px] text-gray-400">Arahkan barcode atau QR ke lensa</span>
          </div>

          <LiveCameraScanner
            onDetected={handleProcessCode}
            isPaused={isLoading || !!detectedItem}
            detectedCode={detectedItem?.item_code || null}
            onResetScan={handleReset}
          />
        </div>

      </div>

      {/* ============================================================== */}
      {/* 📱 TAMPILAN MOBILE (Kamera Langsung di Tengah)                 */}
      {/* ============================================================== */}
      <div className="block lg:hidden space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-extrabold font-display text-[#1E1B3A] tracking-tight">
            Pindai Barcode Barang
          </h2>
          <div className="w-11 h-1 bg-[#FF6B6B] rounded-full mx-auto mt-1"></div>
          <p className="text-xs text-gray-500 pt-1">
            Arahkan lensa kamera langsung ke kode barcode atau QR buku / inventaris
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Live Camera Scanner Langsung di Tengah */}
        <div className="w-full max-w-md mx-auto">
          <LiveCameraScanner
            onDetected={handleProcessCode}
            isPaused={isLoading || !!detectedItem}
            detectedCode={detectedItem?.item_code || null}
            onResetScan={handleReset}
          />
        </div>

        {/* Fallback Input Manual Mobile */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-[0_10px_35px_rgba(30,27,58,0.06)] space-y-2.5 max-w-md mx-auto">
          <p className="text-xs font-semibold text-gray-700">Barcode tidak terbaca? Masukkan kode manual:</p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="LIB-LAR-101 / LAB-CAM-001"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-[#FF6B6B] focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || isLoading}
              className="px-5 py-2.5 btn-coral text-white text-xs font-bold rounded-2xl disabled:opacity-50 transition shrink-0 cursor-pointer"
            >
              {isLoading ? '...' : 'Cari'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};
