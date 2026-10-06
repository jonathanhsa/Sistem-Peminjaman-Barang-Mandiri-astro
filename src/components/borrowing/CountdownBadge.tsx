import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { calculateFine } from '../../lib/fine';

export interface CountdownBadgeProps {
  dueDate: string;
  status: string;
  returnDate?: string | null;
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  dueDate,
  status,
}) => {
  if (status === 'returned') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        ✓ Selesai
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        ⏳ Menunggu ACC
      </span>
    );
  }

  const { fineAmount, daysLate, isOverdue } = calculateFine(dueDate);

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-300 animate-pulse">
        <AlertCircle className="w-3.5 h-3.5" />
        Terlambat {daysLate} hari ({fineAmount > 0 ? `Denda Rp ${fineAmount.toLocaleString('id-ID')}` : ''})
      </span>
    );
  }

  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
      <Clock className="w-3.5 h-3.5" />
      {diffDays <= 0 ? 'Hari ini terakhir!' : `Sisa ${diffDays} hari`}
    </span>
  );
};
