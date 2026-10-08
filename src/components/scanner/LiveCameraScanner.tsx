import React, { useEffect, useRef, useState } from 'react';
import { useScanner } from './use-scanner';
import { ScannerFrame } from './ScannerFrame';
import {
  Flashlight,
  Upload,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Mascot } from '../illustrations/Mascot';

export interface LiveCameraScannerProps {
  onDetected: (code: string) => void;
  isPaused?: boolean;
  detectedCode?: string | null;
  onResetScan?: () => void;
  onManualInputClick?: () => void;
}

export const LiveCameraScanner: React.FC<LiveCameraScannerProps> = ({
  onDetected,
  isPaused = false,
  detectedCode = null,
  onResetScan,
  onManualInputClick,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    videoRef,
    status,
    errorMessage,
    errorKind,
    availableDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    hasFlash,
    isFlashOn,
    startCamera,
    stopCamera,
    toggleFlash,
    scanImageFile,
    resetScanner,
  } = useScanner({
    onCodeDetected: (code) => {
      onDetected(code);
    },
  });

  // Start camera automatically on mount
  useEffect(() => {
    if (!isPaused) {
      resetScanner();
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isPaused]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await scanImageFile(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-[#121124] border-2 border-[#1E1B3A]/15 shadow-xl flex flex-col min-h-[380px] sm:min-h-[440px]">
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Controls Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-black/75 via-black/40 to-transparent pointer-events-auto">
        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-semibold">
          {isPaused ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Terdeteksi</span>
            </>
          ) : status === 'scanning' ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Scanning...</span>
            </>
          ) : status === 'requesting' ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Menyiapkan Kamera...</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span>Kamera Off</span>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Flash Toggle (if supported) */}
          {hasFlash && !isPaused && (
            <button
              type="button"
              onClick={toggleFlash}
              className={`p-2 rounded-xl backdrop-blur-md border transition ${
                isFlashOn
                  ? 'bg-amber-400 text-stone-900 border-amber-300 shadow-md'
                  : 'bg-black/50 text-white border-white/20 hover:bg-black/70'
              }`}
              title="Flashlight"
            >
              <Flashlight className="w-4 h-4" />
            </button>
          )}

          {/* Camera Device Switcher (if multiple cameras) */}
          {availableDevices.length > 1 && !isPaused && (
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                startCamera(e.target.value);
              }}
              className="bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              {availableDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId} className="bg-stone-900 text-white">
                  {dev.label || `Kamera ${idx + 1}`}
                </option>
              ))}
            </select>
          )}

          {/* Upload Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Unggah Foto Barcode"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isUploading ? 'Membaca...' : 'Unggah Foto'}</span>
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
        {/* Video Stream Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover min-h-[360px] ${
            isPaused ? 'filter brightness-50 blur-[2px]' : ''
          }`}
        />

        {/* Normal Scanning Frame (only when active & not paused) */}
        {!isPaused && status !== 'error' && <ScannerFrame />}

        {/* Paused / Detected Success Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-xs text-center text-white animate-fade-in">
            <div className="bg-stone-900/90 backdrop-blur-md border border-white/15 rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-400/40">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-emerald-400 font-semibold">Barcode Terdeteksi</p>
                {detectedCode && (
                  <p className="font-mono text-base font-bold text-white tracking-wider mt-0.5">
                    {detectedCode}
                  </p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">
                  Data barang terbaca. Mempersiapkan formulir peminjaman...
                </p>
              </div>
              {onResetScan && (
                <button
                  type="button"
                  onClick={onResetScan}
                  className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Pindai Ulang</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Camera Error Screen (Permission denied / No device) */}
        {status === 'error' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-white text-center text-gray-800">
            <div className="mb-2">
              <Mascot mood="alert" size={64} />
            </div>
            <h4 className="font-bold text-base text-[#1E1B3A] mb-1">
              {errorKind === 'permission_denied' ? 'Izin Kamera Diblokir Browser' : 'Kamera Tidak Tersedia'}
            </h4>
            <p className="text-xs text-gray-500 max-w-xs mb-4">
              {errorKind === 'permission_denied'
                ? 'Klik ikon gembok 🔒 di samping URL address bar untuk mengizinkan akses kamera Anda.'
                : errorMessage || 'Tidak dapat mengakses perangkat kamera web.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-xs">
              <button
                type="button"
                onClick={() => startCamera()}
                className="w-full py-2.5 px-4 bg-[#3B3FD9] text-white text-xs font-bold rounded-xl hover:bg-[#3235b8] transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Foto</span>
              </button>
            </div>

            {onManualInputClick && (
              <button
                type="button"
                onClick={onManualInputClick}
                className="mt-3 text-xs text-[#3B3FD9] font-bold hover:underline"
              >
                Ketik Kode Manual Saja →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status Banner */}
      <div className="py-2.5 px-4 bg-black/80 backdrop-blur-md border-t border-white/10 text-center text-xs text-gray-300 flex items-center justify-center gap-2 z-20">
        <span>
          {isPaused
            ? 'Barcode terdeteksi — silakan konfirmasi peminjaman di formulir.'
            : 'Posisikan barcode atau QR buku di dalam bingkai kamera'}
        </span>
      </div>
    </div>
  );
};
