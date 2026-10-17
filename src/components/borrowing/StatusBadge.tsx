import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, BookOpen, QrCode, XCircle } from 'lucide-react';

export interface StatusBadgeProps {
  status: 'pending' | 'borrowed' | 'return_pending' | 'returned' | 'overdue' | 'rejected' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1',
    md: 'text-xs md:text-sm px-3.5 py-1.5 gap-1.5',
    lg: 'text-sm md:text-base px-4 py-2 gap-2 font-bold',
  }[size];

  switch (status) {
    case 'pending':
      return (
        <span
          className={`badge-tag bg-sticker-light text-sticker-dark border border-sticker font-medium shadow-xs ${sizeClasses}`}
        >
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          <span>Menunggu Persetujuan</span>
        </span>
      );
    case 'borrowed':
      return (
        <span
          className={`badge-tag bg-indigo-light text-indigo-900 border border-lilac font-medium shadow-xs ${sizeClasses}`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Sedang Dipinjam</span>
        </span>
      );
    case 'return_pending':
      return (
        <span
          className={`badge-tag bg-amber-50 text-amber-800 border border-amber-300 font-semibold shadow-xs ${sizeClasses}`}
        >
          <QrCode className="w-3.5 h-3.5 animate-pulse text-amber-600" />
          <span>Siap Dikembalikan (Scan di Loket)</span>
        </span>
      );
    case 'returned':
      return (
        <span
          className={`badge-tag bg-mint-light text-mint-dark border border-mint font-medium shadow-xs ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Sudah Dikembalikan</span>
        </span>
      );
    case 'overdue':
      return (
        <span
          className={`badge-tag bg-primary-light text-primary-dark border border-primary font-semibold animate-pulse shadow-xs ${sizeClasses}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Terlambat</span>
        </span>
      );
    case 'rejected':
      return (
        <span
          className={`badge-tag bg-gray-100 text-gray-600 border border-gray-300 font-medium shadow-xs ${sizeClasses}`}
        >
          <XCircle className="w-3.5 h-3.5 text-gray-500" />
          <span>Pengajuan Ditolak</span>
        </span>
      );
    default:
      return (
        <span className={`badge-tag bg-gray-100 text-gray-700 border border-gray-300 font-medium ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};

