import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

export interface StatusBadgeProps {
  status: 'pending' | 'borrowed' | 'returned' | 'overdue' | string;
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
          className={`badge-tag bg-[#FFF8DB] text-[#8C6B00] border border-[#FFD23F] font-medium shadow-xs ${sizeClasses}`}
        >
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          <span>Menunggu Persetujuan</span>
        </span>
      );
    case 'borrowed':
      return (
        <span
          className={`badge-tag bg-[#EAEBFC] text-[#24278F] border border-[#B8A9FF] font-medium shadow-xs ${sizeClasses}`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Sedang Dipinjam</span>
        </span>
      );
    case 'returned':
      return (
        <span
          className={`badge-tag bg-[#E6FAF5] text-[#0E7F5F] border border-[#2EC4A0] font-medium shadow-xs ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Sudah Dikembalikan</span>
        </span>
      );
    case 'overdue':
      return (
        <span
          className={`badge-tag bg-[#FFF0F0] text-[#C93545] border border-[#FF6B6B] font-semibold animate-pulse shadow-xs ${sizeClasses}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Terlambat</span>
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
