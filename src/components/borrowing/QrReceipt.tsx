import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../../lib/format-date';
import { formatRupiah } from '../../lib/format-rupiah';
import { Printer, Check, Copy } from 'lucide-react';
import { useState } from 'react';

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

  const handleCopy = () => {
    navigator.clipboard.writeText(borrowing.borrowingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Receipt Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_10px_35px_rgba(30,27,58,0.06)] overflow-hidden relative">
        {/* Top Header Banner */}
        <div className="bg-[#1E1B3A] text-white p-7 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
          <div className="inline-block bg-[#FF6B6B] text-white text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-2 shadow-[0_2px_10px_rgba(255,107,107,0.35)]">
            Bukti Transaksi Mandiri
          </div>
          <h2 className="text-xl font-bold tracking-tight font-display">SIPEMBAR Kampus</h2>
          <p className="text-xs text-gray-300 mt-1">Simpan QR ini dan tunjukkan kepada petugas loket</p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-6 bg-[#F8F7FF]">
          <div className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100">
            <QRCodeSVG
              value={borrowing.borrowingCode}
              size={180}
              level="H"
              includeMargin={true}
              fgColor="#1E1B3A"
            />
          </div>

          {/* Borrowing Code with copy action */}
          <div className="mt-4 flex items-center gap-2">
            <span className="font-mono text-base font-bold text-[#1E1B3A] tracking-wider bg-white px-3.5 py-1 rounded-xl border border-gray-200 shadow-2xs">
              {borrowing.borrowingCode}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 active:scale-95 text-[#1E1B3A] cursor-pointer shadow-2xs transition"
              title="Salin Kode"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Perforated Divider */}
        <div className="relative py-2 flex items-center justify-center bg-[#F8F7FF]">
          <div className="absolute -left-3 w-6 h-6 bg-[#F8F7FF] rounded-full border-r border-gray-200" />
          <div className="w-full border-t-2 border-dashed border-gray-200 mx-5" />
          <div className="absolute -right-3 w-6 h-6 bg-[#F8F7FF] rounded-full border-l border-gray-200" />
        </div>

        {/* Transaction Detail Details */}
        <div className="p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">Status Saat Ini</span>
            <StatusBadge status={borrowing.status} size="sm" />
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Peminjam:</span>
              <span className="font-semibold text-[#1E1B3A] text-right">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">NIM / NIP:</span>
              <span className="font-mono font-medium text-right text-gray-700">{user.nim_nip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Barang:</span>
              <span className="font-semibold text-[#1E1B3A] text-right max-w-[200px] truncate" title={item.name}>
                {item.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kode Barang:</span>
              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded-md text-gray-700">{item.itemCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kategori:</span>
              <span className="font-medium text-right text-[#FF6B6B]">{item.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tgl Pinjam:</span>
              <span className="font-medium text-right">{formatDate(borrowing.borrowDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Batas Kembali:</span>
              <span className="font-bold text-right text-rose-600">{formatDate(borrowing.dueDate)}</span>
            </div>
            {borrowing.returnDate && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tgl Dikembalikan:</span>
                <span className="font-medium text-right text-emerald-700">{formatDate(borrowing.returnDate)}</span>
              </div>
            )}
            {borrowing.fineAmount > 0 && (
              <div className="flex justify-between items-center bg-rose-50 p-2.5 rounded-2xl border border-rose-200">
                <span className="text-xs font-semibold text-rose-800">Denda Keterlambatan:</span>
                <span className="font-bold text-rose-700">{formatRupiah(borrowing.fineAmount)}</span>
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
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Bukti Transaksi
          </button>
        </div>
      </div>
    </div>
  );
};
