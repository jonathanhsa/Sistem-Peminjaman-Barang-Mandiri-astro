import { useState, useRef, useEffect, useCallback } from 'react';
import { createWorker } from 'tesseract.js';

export type ScannerStatus = 'idle' | 'requesting' | 'scanning' | 'processing' | 'success' | 'error';

export type UseScannerOptions = {
  onCodeDetected?: (code: string) => void;
};

export function useScanner(options: UseScannerOptions = {}) {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<'permission_denied' | 'no_device' | 'in_use' | 'insecure' | 'unknown'>('unknown');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [detectedText, setDetectedText] = useState<string | null>(null);
  const [hasFlash, setHasFlash] = useState<boolean>(false);
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [isSlow, setIsSlow] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<any>(null);
  const isScanningRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const slowTimerRef = useRef<any>(null);
  const loopTimeoutRef = useRef<any>(null);

  // Enumerate video devices
  const updateDeviceList = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          // Prefer HP TrueVision if labeled
          const hpCam = videoInputs.find(
            (d) => d.label && (d.label.toLowerCase().includes('truevision') || d.label.toLowerCase().includes('camera'))
          );
          if (hpCam && hpCam.deviceId) {
            setSelectedDeviceId(hpCam.deviceId);
          }
        }
      } catch (e) {
        console.warn('Enumerate devices warning:', e);
      }
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    updateDeviceList();
  }, [updateDeviceList]);

  // Clean stream tracks WITHOUT resetting status
  const cleanupStreamTracks = useCallback(() => {
    isScanningRef.current = false;
    isProcessingRef.current = false;

    if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {}
    }

    setIsFlashOn(false);
    setHasFlash(false);
    setIsSlow(false);
  }, []);

  const stopCamera = useCallback(() => {
    cleanupStreamTracks();
    setStatus('idle');
  }, [cleanupStreamTracks]);

  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const newState = !isFlashOn;
      await (track as any).applyConstraints({ advanced: [{ torch: newState }] });
      setIsFlashOn(newState);
    } catch (e) {
      console.warn('Torch failed', e);
    }
  }, [isFlashOn]);

  const processFrame = useCallback(async (): Promise<boolean> => {
    if (!videoRef.current || !isScanningRef.current || videoRef.current.readyState < 2) return false;
    const video = videoRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return false;

    // Engine 1: Native BarcodeDetector (QR & Code 128)
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13'],
        });
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          const raw = barcodes[0].rawValue.trim();
          if (raw.length > 0 && isScanningRef.current) {
            setDetectedText(raw);
            setStatus('success');
            stopCamera();
            optionsRef.current.onCodeDetected?.(raw);
            return true;
          }
        }
      } catch {}
    }

    // Engine 2: Tesseract.js OCR
    try {
      const canvas = document.createElement('canvas');
      const cropW = Math.floor(width * 0.7);
      const cropH = Math.floor(height * 0.4);
      const startX = Math.floor((width - cropW) / 2);
      const startY = Math.floor((height - cropH) / 2);

      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      ctx.drawImage(video, startX, startY, cropW, cropH, 0, 0, cropW, cropH);

      if (!workerRef.current) {
        workerRef.current = await createWorker('eng');
      }

      if (!isScanningRef.current) return false;

      const result = await workerRef.current.recognize(canvas);
      const text = result?.data?.text?.trim() || '';
      const codeMatch = text.match(/[A-Z0-9]{3,}-[A-Z0-9-]{3,}/i) || text.match(/[A-Z0-9]{5,}/i);

      if (codeMatch && codeMatch[0] && isScanningRef.current) {
        const matched = codeMatch[0].trim().toUpperCase();
        setDetectedText(matched);
        setStatus('success');
        stopCamera();
        optionsRef.current.onCodeDetected?.(matched);
        return true;
      }
    } catch {}

    return false;
  }, [stopCamera]);

  const scheduleNextFrame = useCallback(() => {
    if (!isScanningRef.current) return;
    loopTimeoutRef.current = setTimeout(async () => {
      if (!isScanningRef.current) return;
      if (!isProcessingRef.current) {
        isProcessingRef.current = true;
        try {
          const detected = await processFrame();
          if (detected) return;
        } finally {
          isProcessingRef.current = false;
        }
      }
      if (isScanningRef.current) scheduleNextFrame();
    }, 400);
  }, [processFrame]);

  const startCamera = useCallback(async (forcedDeviceId?: string) => {
    cleanupStreamTracks();
    setStatus('requesting');
    setErrorMessage(null);
    setErrorKind('unknown');
    setDetectedText(null);
    setIsSlow(false);

    try {
      // 1. Check secure context
      const isLocal =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (typeof window !== 'undefined' && !window.isSecureContext && !isLocal) {
        setErrorKind('insecure');
        throw new Error(
          'Browser memblokir kamera karena dibuka melalui IP tanpa HTTPS. Buka melalui http://localhost:4321.'
        );
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        setErrorKind('unknown');
        throw new Error('Fitur kamera tidak didukung atau dinonaktifkan oleh browser.');
      }

      const isMobile =
        typeof navigator !== 'undefined' &&
        (/android|iphone|ipad|ipod/i.test(navigator.userAgent) ||
          (navigator.maxTouchPoints && navigator.maxTouchPoints > 2));

      let stream: MediaStream | null = null;

      // Strategy 1: Specific device ID ONLY if user explicitly changed camera via dropdown
      if (forcedDeviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: forcedDeviceId } },
            audio: false,
          });
        } catch (err) {
          console.warn('Forced device ID failed, falling back:', err);
        }
      }

      // Strategy 2: If on mobile, try ideal environment back camera
      if (!stream && isMobile) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {}
      }

      // Strategy 3: Standard webcam constraint (perfect for Windows laptop / HP TrueVision HD Camera)
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          // Absolute fallback: minimal video constraint
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (!stream) {
        throw new Error('Tidak dapat memperoleh stream video dari kamera.');
      }

      streamRef.current = stream;

      // Update device list now that permission is granted
      updateDeviceList();

      if (videoRef.current) {
        const video = videoRef.current;
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        video.setAttribute('playsinline', 'true');
        video.muted = true;
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          video.play().catch((e) => console.warn('video.play() warning:', e));
        };

        try {
          await video.play();
        } catch {}
      }

      const track = stream.getVideoTracks()[0];
      const capabilities = (track as any)?.getCapabilities?.();
      if (capabilities && 'torch' in capabilities) setHasFlash(true);

      setStatus('scanning');
      isScanningRef.current = true;

      slowTimerRef.current = setTimeout(() => {
        if (isScanningRef.current) setIsSlow(true);
      }, 5000);

      scheduleNextFrame();
    } catch (err: any) {
      console.error('Camera access error:', err);
      cleanupStreamTracks();

      let kind: 'permission_denied' | 'no_device' | 'in_use' | 'insecure' | 'unknown' = 'unknown';
      let msg = err.message || 'Gagal mengakses kamera.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        kind = 'permission_denied';
        msg =
          'Izin kamera diblokir oleh browser. Browser TIDAK akan menampilkan notifikasi izin jika sebelumnya pernah ditolak/diblokir.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        kind = 'no_device';
        msg = 'Perangkat kamera tidak ditemukan di komputer / laptop Anda.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        kind = 'in_use';
        msg =
          'Kamera sedang aktif digunakan oleh aplikasi lain (Zoom, Teams, Google Meet, atau tab lain). Silakan tutup aplikasi tersebut.';
      }

      setErrorKind(kind);
      setErrorMessage(msg);
      setStatus('error');
    }
  }, [selectedDeviceId, cleanupStreamTracks, updateDeviceList, scheduleNextFrame]);

  // Scan from image file (photo / screenshot)
  const scanImageFile = useCallback(
    async (file: File): Promise<string | null> => {
      setStatus('processing');
      setErrorMessage(null);

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const img = new Image();
          img.onload = async () => {
            try {
              // Engine 1: Native BarcodeDetector
              if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
                try {
                  const detector = new (window as any).BarcodeDetector({
                    formats: ['qr_code', 'code_128', 'code_39', 'ean_13'],
                  });
                  const barcodes = await detector.detect(img);
                  if (barcodes.length > 0 && barcodes[0].rawValue) {
                    const raw = barcodes[0].rawValue.trim();
                    setDetectedText(raw);
                    setStatus('success');
                    optionsRef.current.onCodeDetected?.(raw);
                    resolve(raw);
                    return;
                  }
                } catch {}
              }

              // Engine 2: Tesseract OCR
              if (!workerRef.current) {
                workerRef.current = await createWorker('eng');
              }
              const result = await workerRef.current.recognize(img);
              const text = result?.data?.text?.trim() || '';
              const codeMatch = text.match(/[A-Z0-9]{3,}-[A-Z0-9-]{3,}/i) || text.match(/[A-Z0-9]{5,}/i);

              if (codeMatch && codeMatch[0]) {
                const matched = codeMatch[0].trim().toUpperCase();
                setDetectedText(matched);
                setStatus('success');
                optionsRef.current.onCodeDetected?.(matched);
                resolve(matched);
                return;
              }

              setErrorMessage('Barcode atau teks serial tidak terdeteksi pada gambar ini.');
              setStatus('error');
              resolve(null);
            } catch {
              setErrorMessage('Gagal memproses file gambar.');
              setStatus('error');
              resolve(null);
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    },
    []
  );

  useEffect(() => {
    return () => {
      cleanupStreamTracks();
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [cleanupStreamTracks]);

  return {
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
    resetScanner: () => {
      setDetectedText(null);
      setErrorMessage(null);
      setErrorKind('unknown');
      setStatus('idle');
      setIsSlow(false);
    },
  };
}
