import React, { useEffect, useState, useRef } from 'react';
import { useScanner } from './use-scanner';
import { ScannerFrame } from './ScannerFrame';
import { Camera, Flashlight, X, Sparkles, Keyboard, CheckCircle2, Upload, RefreshCw, Settings } from 'lucide-react';
import { Mascot } from '../illustrations/Mascot';

export interface ScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  title?: string;
  description?: string;
  placeholder?: string;
}

export const ScannerDialog: React.FC<ScannerDialogProps> = ({
  isOpen,
  onClose,
  onDetected,
  title = 'Scan Barcode / QR Barang',
  description = 'Arahkan kamera ke barcode buku atau label inventaris',
  placeholder = 'LIB-LAR-101 / PJM-...',
}) => {
  const [manualCode, setManualCode] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    videoRef,
    status,
    errorMessage,
    errorKind,
    availableDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    detectedText,
    hasFlash,
    isFlashOn,
    isSlow,
    startCamera,
    stopCamera,
    toggleFlash,
    scanImageFile,
    resetScanner,
  } = useScanner({
    onCodeDetected: (code) => {
      onDetected(code);
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen && !manualMode) {
      resetScanner();
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, manualMode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onDetected(manualCode.trim().toUpperCase());
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await scanImageFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-[#1E1B3A]/20 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-gray-100 bg-[#F6F5FF]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3B3FD9] text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E1B3A]">{title}</h3>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="relative flex-1 bg-[#121124] flex flex-col items-center justify-center min-h-[360px] overflow-hidden">
          {/* Hidden File Input for Image Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {manualMode ? (
            /* Manual Input Mode */
            <div className="w-full h-full bg-white p-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-indigo-50 text-[#3B3FD9] rounded-2xl flex items-center justify-center mb-3">
                <Keyboard className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-[#1E1B3A] text-base mb-1">Ketik Kode Inventaris</h4>
              <p className="text-xs text-gray-500 max-w-xs mb-4">
                Masukkan kode serial yang tertera pada stiker barcode atau punggung buku.
              </p>
              <form onSubmit={handleManualSubmit} className="w-full max-w-xs space-y-3">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder={placeholder}
                  autoFocus
                  className="w-full px-4 py-2.5 text-center text-sm font-mono tracking-wider font-semibold border-2 border-indigo-200 rounded-xl focus:border-[#3B3FD9] focus:outline-none uppercase"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="w-full py-2.5 px-4 bg-[#3B3FD9] text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-[#3235b8] transition cursor-pointer"
                >
                  Terapkan Kode
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-gray-100 w-full max-w-xs text-center">
                <a
                  href="/katalog"
                  className="text-xs text-[#3B3FD9] font-bold hover:underline"
                >
                  Belum tahu kode? Buka Katalog Inventaris →
                </a>
              </div>
            </div>
          ) : status === 'error' ? (
            /* Explicit Troubleshooting & Error Screen */
            <div className="w-full h-full bg-white p-6 flex flex-col items-center justify-center text-center overflow-y-auto max-h-[420px]">
              <div className="mb-2">
                <Mascot mood="alert" size={72} />
              </div>

              <h4 className="font-bold text-[#1E1B3A] text-base mb-1">
                {errorKind === 'permission_denied' ? 'Izin Kamera Diblokir di Browser' : 'Kamera Tidak Dapat Dibuka'}
              </h4>

              {/* Step-by-step guidance for permission denied */}
              {errorKind === 'permission_denied' ? (
                <div className="w-full max-w-sm mb-4 bg-amber-50 p-3.5 rounded-2xl border border-amber-300 text-left text-xs text-amber-950 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Settings className="w-4 h-4 text-amber-700" />
                    <span>Langkah Membuka Blokir Izin:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900 leading-relaxed">
                    <li>
                      Klik ikon <strong>pengaturan situs</strong> 🎛️ atau 🔒 di sebelah kiri address bar URL browser (sebelah <code className="bg-amber-100 px-1 rounded">localhost:4321</code>).
                    </li>
                    <li>
                      Cari pengaturan <strong>Kamera</strong>, lalu ubah dari <strong>Blokir</strong> menjadi <strong>Izinkan (Allow)</strong>.
                    </li>
                    <li>
                      Setelah diizinkan, klik tombol <strong>"Coba Nyalakan Kamera Lagi"</strong> di bawah.
                    </li>
                  </ol>
                </div>
              ) : (
                <p className="text-xs text-rose-700 font-medium max-w-sm mb-4 bg-rose-50 p-3 rounded-xl border border-rose-200 text-left">
                  {errorMessage}
                </p>
              )}

              {/* Action Buttons */}
              <div className="w-full max-w-xs space-y-2">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="w-full py-2.5 px-4 bg-[#3B3FD9] text-white text-xs font-bold rounded-xl hover:bg-[#3235b8] transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Nyalakan Kamera Lagi</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah Gambar / Foto Barcode</span>
                </button>

                <button
                  type="button"
                  onClick={() => setManualMode(true)}
                  className="w-full py-2.5 px-4 bg-[#FFD23F] text-[#1E1B3A] text-xs font-bold rounded-xl hover:brightness-105 transition flex items-center justify-center gap-2"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Ketik Kode Secara Manual</span>
                </button>
              </div>

              {/* Catalog helper on error */}
              <div className="mt-4 pt-3 border-t border-gray-100 w-full max-w-xs text-center">
                <a
                  href="/katalog"
                  className="text-xs text-[#3B3FD9] font-bold hover:underline"
                >
                  Cari kode barang di Katalog Inventaris →
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Camera Video Stream */}
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover transform-gpu"
                style={{ transform: 'translateZ(0)' }}
              />

              {/* Viewfinder Overlay */}
              <ScannerFrame />

              {/* Top Controls Overlay */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-auto">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium flex items-center gap-1.5 border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Dual Engine Scanner
                </div>

                <div className="flex items-center gap-2">
                  {/* Camera selector if multiple cameras exist */}
                  {availableDevices.length > 1 && (
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value);
                        startCamera(e.target.value);
                      }}
                      className="bg-black/60 text-white text-[11px] px-2 py-1 rounded-lg border border-white/20 focus:outline-none max-w-[130px] truncate"
                    >
                      {availableDevices.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId} className="bg-gray-900 text-white">
                          {d.label || `Kamera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full bg-black/60 text-white border border-white/20 hover:bg-black/80 transition"
                    title="Unggah Foto Barcode"
                  >
                    <Upload className="w-4 h-4" />
                  </button>

                  {hasFlash && (
                    <button
                      type="button"
                      onClick={toggleFlash}
                      className={`p-2 rounded-full border transition ${
                        isFlashOn
                          ? 'bg-[#FFD23F] text-[#1E1B3A] border-[#FFD23F]'
                          : 'bg-black/60 text-white border-white/20 hover:bg-black/80'
                      }`}
                      title="Nyalakan Lampu Senter"
                    >
                      <Flashlight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Slow Scan Helper Tip */}
              {isSlow && (
                <div className="absolute bottom-16 inset-x-6 bg-[#1E1B3A]/90 backdrop-blur-md text-white text-xs p-2.5 rounded-xl flex items-center justify-center gap-2 border border-white/20 animate-bounce">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFD23F]" />
                  <span>Posisikan barcode tegak lurus atau unggah gambar</span>
                </div>
              )}

              {/* Requesting Camera Permission Overlay */}
              {status === 'requesting' && (
                <div className="absolute inset-0 bg-[#121124]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-20 animate-fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-[#3B3FD9]/30 border-2 border-[#3B3FD9] text-[#FFD23F] flex items-center justify-center mb-3 animate-pulse shadow-lg">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">Meminta Izin Kamera Browser</h4>
                  <p className="text-xs text-gray-300 max-w-xs mb-4">
                    Browser Anda sedang menghubungkan webcam. Jika muncul notifikasi di pojok kiri atas (Address Bar), pilih <strong>Izinkan / Allow</strong>.
                  </p>

                  <div className="bg-white/10 p-3.5 rounded-2xl border border-white/20 text-xs text-left max-w-sm mb-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#FFD23F]">
                      <Sparkles className="w-3.5 h-3.5 text-[#FFD23F]" />
                      <span>Petunjuk Cepat di Firefox:</span>
                    </div>
                    <p className="text-[11px] text-gray-200 leading-relaxed">
                      Jika notifikasi tidak langsung muncul, klik ikon kamera 🎥 kecil atau ikon gembok 🔒 di sebelah kiri URL <code>localhost:4321</code> pada address bar browser.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="py-2.5 px-5 bg-[#FFD23F] text-[#1E1B3A] text-xs font-bold rounded-xl hover:brightness-105 active:scale-95 transition shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Klik Di Sini untuk Buka Kamera</span>
                  </button>
                </div>
              )}

              {/* Processing Overlay */}
              {status === 'processing' && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#FFD23F] mb-2" />
                  <span className="text-xs font-semibold">Menganalisis barcode & OCR...</span>
                </div>
              )}

              {/* Success Notification */}
              {status === 'success' && (
                <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                  <CheckCircle2 className="w-12 h-12 mb-2 animate-bounce" />
                  <span className="font-bold text-lg">Barcode Terdeteksi!</span>
                  <span className="font-mono text-sm mt-1 bg-black/30 px-3 py-1 rounded-lg">{detectedText}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Mode Switch */}
        <div className="p-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setManualMode(!manualMode)}
              className="text-[#3B3FD9] font-semibold hover:underline flex items-center gap-1.5"
            >
              {manualMode ? <Camera className="w-3.5 h-3.5" /> : <Keyboard className="w-3.5 h-3.5" />}
              {manualMode ? 'Beralih ke Kamera' : 'Ketik Manual'}
            </button>
            <span className="text-gray-300">•</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-emerald-700 font-semibold hover:underline flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Gambar</span>
            </button>
          </div>
          <span className="text-gray-400 text-[11px] hidden sm:inline">ISO Code 128 / QR / OCR</span>
        </div>
      </div>
    </div>
  );
};
