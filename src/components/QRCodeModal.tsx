import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  Share2,
  Award,
  Store,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Shop } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface QRCodeModalProps {
  isOpen?: boolean;
  shop: Shop | null;
  mode?: 'payment' | 'share';
  amount?: number | string;
  orderNumber?: string;
  onPaymentConfirmed?: (upiRef: string) => void;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen = true,
  shop,
  mode = 'share',
  amount = 0,
  orderNumber,
  onPaymentConfirmed,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [shopUrl, setShopUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upiRef, setUpiRef] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { isHindi } = useLanguage();

  const numAmount = Number(amount) || 0;
  const isPaymentMode = mode === 'payment' || numAmount > 0;

  // Determine effective UPI ID for vendor
  const vendorUpiId = (shop?.upiId || '').trim() || 'yunaypay@upi';

  useEffect(() => {
    if (!shop || !isOpen) return;

    let isMounted = true;
    setLoading(true);
    setErrorMsg('');

    const generateCode = async () => {
      try {
        const host = window.location.host || 'localhost:3000';
        const protocol = window.location.protocol || 'http:';
        const fullShopUrl = `${protocol}//${host}/shop/${shop.slug}`;
        if (isMounted) setShopUrl(fullShopUrl);

        if (isPaymentMode) {
          // Standard NPCI UPI URI Scheme
          let upiUri = `upi://pay?pa=${encodeURIComponent(vendorUpiId)}&pn=${encodeURIComponent(
            shop.name
          )}&cu=INR`;
          if (numAmount > 0) {
            upiUri += `&am=${encodeURIComponent(numAmount.toFixed(2))}`;
          }
          const noteText = orderNumber ? `Order ${orderNumber}` : `Order at ${shop.name}`;
          upiUri += `&tn=${encodeURIComponent(noteText)}`;

          const url = await QRCode.toDataURL(upiUri, {
            width: 400,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          if (isMounted) setQrDataUrl(url);
        } else {
          // Storefront share mode
          const url = await QRCode.toDataURL(fullShopUrl, {
            width: 400,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          if (isMounted) setQrDataUrl(url);
        }
      } catch (err: any) {
        console.error('QR generation error:', err);
        if (isMounted) setErrorMsg('Could not render QR code');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    generateCode();

    return () => {
      isMounted = false;
    };
  }, [shop?.id, shop?.upiId, isPaymentMode, numAmount, isOpen, vendorUpiId, orderNumber]);

  if (!isOpen || !shop) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(vendorUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyUrl = () => {
    if (shopUrl) {
      navigator.clipboard.writeText(shopUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleDownload = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = isPaymentMode
        ? `${shop.slug}-payment-qr.png`
        : `${shop.slug}-yunay-qr.png`;
      link.click();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmPayment = () => {
    setConfirming(true);
    if (onPaymentConfirmed) {
      onPaymentConfirmed(upiRef.trim());
    }
  };

  // UPI deep link URI for mobile quick pay
  const mobileUpiUri = `upi://pay?pa=${encodeURIComponent(vendorUpiId)}&pn=${encodeURIComponent(
    shop.name
  )}&am=${encodeURIComponent(numAmount.toFixed(2))}&cu=INR&tn=${encodeURIComponent(
    orderNumber ? `Order ${orderNumber}` : `Order at ${shop.name}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative text-center my-6 max-h-[94vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer print:hidden"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ========================================================================= */}
        {/* PAYMENT QR MODE */}
        {/* ========================================================================= */}
        {isPaymentMode ? (
          <div className="space-y-4">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isHindi ? 'सीधा दुकानदार को UPI भुगतान' : 'Direct Vendor UPI Payment'}</span>
            </div>

            {/* Shop Details */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-emerald-600/20 mb-1.5">
                {shop.logoUrl ? (
                  <img
                    src={shop.logoUrl}
                    alt={shop.name}
                    className="w-12 h-12 rounded-2xl object-cover"
                  />
                ) : (
                  <Store className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{shop.name}</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {shop.category} • {shop.city}
              </p>
            </div>

            {/* Exact Amount Banner */}
            <div className="p-3.5 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl text-white shadow-md shadow-emerald-600/20">
              <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">
                {isHindi ? 'कुल देय राशि' : 'Total Amount to Pay'}
              </p>
              <div className="text-3xl font-black font-mono tracking-tight mt-0.5">
                ₹{numAmount.toFixed(2)}
              </div>
            </div>

            {/* QR Code Container */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-dashed border-emerald-300 inline-block shadow-inner mx-auto">
              {loading ? (
                <div className="w-52 h-52 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[11px] font-medium">
                    {isHindi ? 'UPI QR कोड तैयार हो रहा है...' : 'Generating UPI QR...'}
                  </span>
                </div>
              ) : qrDataUrl ? (
                <div className="space-y-1">
                  <img
                    src={qrDataUrl}
                    alt={`UPI payment QR code for ${shop.name}`}
                    className="w-52 h-52 mx-auto rounded-xl shadow-xs bg-white p-1"
                  />
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isHindi ? 'किसी भी UPI ऐप से स्कैन करें' : 'Scan with Any UPI App'}</span>
                  </div>
                </div>
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-rose-500 text-xs">
                  {errorMsg || (isHindi ? 'QR कोड लोड नहीं हो सका' : 'Failed to render QR code')}
                </div>
              )}
            </div>

            {/* Vendor UPI ID Display with Copy Button */}
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-left space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {isHindi ? 'दुकानदार की UPI आईडी:' : 'Payee UPI ID:'}
              </span>
              <div className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="font-mono text-xs font-black text-slate-800 truncate">
                  {vendorUpiId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isHindi ? 'कॉपी हो गया' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isHindi ? 'कॉपी करें' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Direct Pay Button */}
            <a
              href={mobileUpiUri}
              className="sm:hidden flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Smartphone className="w-4 h-4 text-emerald-700" />
              <span>{isHindi ? 'इस फोन पर UPI ऐप खोलें' : 'Click to Open UPI App on This Phone'}</span>
              <ExternalLink className="w-3 h-3 text-emerald-700" />
            </a>

            {/* Optional UTR / Reference Number Input */}
            <div className="text-left space-y-1 pt-1">
              <label className="text-xs font-bold text-slate-700 block">
                {isHindi ? 'UPI संदर्भ / UTR नंबर (12 अंकों का UTR - ऐच्छिक)' : 'UPI Reference / UTR Number (12-digit UTR - Optional)'}
              </label>
              <input
                type="text"
                placeholder={isHindi ? 'उदा. 429104829102' : 'e.g. 429104829102'}
                value={upiRef}
                onChange={(e) => setUpiRef(e.target.value)}
                maxLength={20}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:border-emerald-500 font-semibold"
              />
              <p className="text-[10px] text-slate-500">
                {isHindi
                  ? 'भुगतान पूरा करने के बाद, अपना ऑर्डर कन्फर्म करने के लिए नीचे दिए बटन पर क्लिक करें।'
                  : 'After scanning & completing the payment, click the button below to confirm your order.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={confirming}
                className="flex-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {confirming ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isHindi ? 'मैंने भुगतान कर दिया • ऑर्डर कन्फर्म करें' : 'I Have Paid • Confirm Order'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STOREFRONT SHARING / STANDEE MODE */
          /* ========================================================================= */
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isHindi ? 'YUNAY द्वारा संचालित' : 'Powered by YUNAY'}</span>
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
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${shop.name}`}
                  className="w-56 h-56 mx-auto rounded-lg shadow-xs"
                />
              ) : (
                <p className="text-xs text-slate-400">
                  {isHindi ? 'QR कोड लोड नहीं हो सका' : 'Failed to generate QR code'}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {isHindi ? 'फोन कैमरा या किसी भी UPI स्कैनर से स्कैन करें' : 'Scan with Phone Camera or Any UPI Scanner'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isHindi
                  ? 'सामान देखें, स्टॉक चेक करें और सीधे डिलीवरी या पिकअप के लिए ऑर्डर करें'
                  : 'Browse products, check stock, and order directly for delivery or pickup'}
              </p>
            </div>

            {/* Store URL */}
            <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl text-xs font-mono text-slate-700 truncate border border-slate-200">
              <span className="truncate flex-1 text-left">{shopUrl}</span>
              <button
                onClick={handleCopyUrl}
                className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-white rounded transition cursor-pointer"
                title={isHindi ? 'दुकान का लिंक कॉपी करें' : 'Copy Store URL'}
              >
                {copiedUrl ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Action buttons (Hidden on print) */}
            <div className="grid grid-cols-2 gap-2 pt-2 print:hidden">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isHindi ? 'QR कोड डाउनलोड करें' : 'Download QR'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isHindi ? 'स्टेंडी प्रिंट करें' : 'Print Standee'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
