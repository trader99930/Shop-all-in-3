import React, { useState, useEffect } from 'react';
import { X, QrCode, Download, Printer, Copy, Check, Share2, Award, Store } from 'lucide-react';
import { Shop } from '../types/index.ts';

interface QRCodeModalProps {
  shop: Shop | null;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ shop, onClose }) => {
  const [qrData, setQrData] = useState<{ qrDataUrl: string; shopUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop) return;
    const fetchQR = async () => {
      try {
        const res = await fetch(`/api/shops/${shop.id}/qr`);
        if (res.ok) {
          const data = await res.json();
          setQrData(data);
        }
      } catch (err) {
        console.error('Error fetching QR:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQR();
  }, [shop?.id]);

  if (!shop) return null;

  const handleCopy = () => {
    if (qrData?.shopUrl) {
      navigator.clipboard.writeText(qrData.shopUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (qrData?.qrDataUrl) {
      const link = document.createElement('a');
      link.href = qrData.qrDataUrl;
      link.download = `${shop.slug}-yunay-qr.png`;
      link.click();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (qrData?.shopUrl) {
      const msg = encodeURIComponent(
        `Order fresh from ${shop.name} online with direct home delivery or quick pickup! Browse our digital catalogue on YUNAY: ${qrData.shopUrl}`
      );
      window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Standee View */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Powered by YUNAY</span>
          </div>

          <div className="flex flex-col items-center">
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={shop.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md mb-2"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-md mb-2">
                <Store className="w-8 h-8" />
              </div>
            )}
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{shop.name}</h3>
            <p className="text-xs text-slate-500 font-medium">
              {shop.category} • {shop.city}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-emerald-200 inline-block shadow-inner my-2">
            {loading ? (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : qrData ? (
              <img
                src={qrData.qrDataUrl}
                alt={`QR code for ${shop.name}`}
                className="w-56 h-56 mx-auto rounded-lg shadow-xs"
              />
            ) : (
              <p className="text-xs text-slate-400">Failed to generate QR code</p>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Scan with Phone Camera or Any UPI Scanner
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Browse products, check stock, and order directly for delivery or pickup
            </p>
          </div>

          {/* Store URL */}
          <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl text-xs font-mono text-slate-700 truncate border border-slate-200">
            <span className="truncate flex-1 text-left">{qrData?.shopUrl}</span>
            <button
              onClick={handleCopy}
              className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-white rounded transition"
              title="Copy Store URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Action buttons (Hidden on print) */}
          <div className="grid grid-cols-3 gap-2 pt-2 print:hidden">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Standee</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          <p className="text-[10px] text-slate-400 print:text-slate-600 pt-2">
            Put this standee on your cash billing counter, store entrance, or visiting cards!
          </p>
        </div>
      </div>
    </div>
  );
};
