import React, { useState } from 'react';
import { X, Printer, Download, Share2, CheckCircle2, Store, Award, Check } from 'lucide-react';
import { Order, Shop, Invoice, OrderItem } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface InvoiceModalProps {
  order: Order | null;
  shop: Partial<Shop> | null;
  invoice: Invoice | null;
  items: OrderItem[];
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  shop,
  invoice,
  items,
  onClose,
}) => {
  const { isHindi } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `Order #${order.orderNumber} Bill from ${shop?.name || 'Local Shop'} - Total: ₹${order.totalAmount}. Powered by YUNAY.`;
    if (navigator.share) {
      navigator.share({ title: `Invoice - ${order.orderNumber}`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 print:p-0 print:border-none print:shadow-none">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              {isHindi ? 'टैक्स इनवॉइस' : 'Tax Invoice'}
            </span>
            <span className="text-xs text-slate-500">#{invoice?.invoiceNumber || `INV-${order.orderNumber}`}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isHindi ? 'प्रिंट बिल' : 'Print Bill'}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? (isHindi ? 'कॉपी हुआ!' : 'Copied!') : (isHindi ? 'शेयर' : 'Share')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="pt-6 space-y-6 text-slate-800">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {shop?.logoUrl ? (
                  <img
                    src={shop.logoUrl}
                    alt={shop.name}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {shop?.name || (isHindi ? 'स्थानीय दुकान' : 'Local Neighborhood Store')}
                  </h2>
                  <p className="text-xs text-slate-500">{shop?.category} {isHindi ? 'व्यापारी' : 'Merchant'}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 max-w-xs">{shop?.address}</p>
              <p className="text-xs text-slate-600">
                {shop?.city}, {shop?.state} - {shop?.pincode}
              </p>
              <p className="text-xs text-slate-600 font-medium mt-1">Ph: {shop?.businessPhone}</p>
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 text-emerald-400 text-xs font-bold mb-2">
                <Award className="w-3.5 h-3.5" />
                <span>Powered by YUNAY</span>
              </div>
              <p className="text-xs font-semibold text-slate-900">
                {isHindi ? 'इनवॉइस:' : 'Invoice:'} <span className="font-mono">{invoice?.invoiceNumber || `INV-${order.orderNumber}`}</span>
              </p>
              <p className="text-xs text-slate-500">
                {isHindi ? 'ऑर्डर संख्या:' : 'Order Ref:'} <span className="font-mono">{order.orderNumber}</span>
              </p>
              <p className="text-xs text-slate-500">
                {isHindi ? 'दिनांक:' : 'Date:'} {new Date(order.createdAt).toLocaleDateString()} {isHindi ? 'समय:' : 'at'}{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{isHindi ? 'स्थिति:' : 'Status:'} {order.status}</span>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                {isHindi ? 'ग्राहक विवरण' : 'Billed To (Customer)'}
              </p>
              <p className="font-bold text-slate-900">{order.customerName}</p>
              <p className="text-slate-600 font-medium">{order.customerPhone}</p>
              <p className="text-slate-500 mt-1 capitalize font-semibold text-emerald-800">
                {isHindi ? 'प्रकार:' : 'Type:'} {order.orderType === 'pickup' ? (isHindi ? 'दुकान से स्वयं पिकअप' : 'Store Counter Pickup') : (isHindi ? 'घर पर डिलीवरी' : 'Home Delivery')}
              </p>
            </div>
            {order.orderType === 'delivery' && (
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                  {isHindi ? 'डिलीवरी का पता' : 'Delivery Destination'}
                </p>
                <p className="text-slate-700">{order.deliveryAddress}</p>
                {order.landmark && (
                  <p className="text-slate-500 mt-0.5">{isHindi ? 'लैंडमार्क:' : 'Landmark:'} {order.landmark}</p>
                )}
                {order.deliveryInstructions && (
                  <p className="text-slate-500 italic mt-0.5">{isHindi ? 'निर्देश:' : 'Note:'} "{order.deliveryInstructions}"</p>
                )}
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">{isHindi ? 'सामान का नाम' : 'Item Description'}</th>
                  <th className="py-2.5 px-3 text-center">{isHindi ? 'इकाई' : 'Unit'}</th>
                  <th className="py-2.5 px-3 text-right">{isHindi ? 'दर (मूल्य)' : 'Price'}</th>
                  <th className="py-2.5 px-3 text-center">{isHindi ? 'मात्रा' : 'Qty'}</th>
                  <th className="py-2.5 px-3 text-right">{isHindi ? 'कुल' : 'Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-400">{index + 1}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-bold text-slate-800">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-[11px] text-emerald-700 font-medium">
                          {isHindi ? 'वेरिएंट:' : 'Variant:'} {item.variantName}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{item.unit}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700 font-mono">
                      ₹{Number(item.price).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      ₹{Number(item.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 max-w-xs space-y-1">
              <p className="font-semibold text-slate-700">{isHindi ? 'भुगतान विवरण:' : 'Payment Information:'}</p>
              <p className="capitalize">
                {isHindi ? 'माध्यम:' : 'Method:'} <span className="font-bold text-slate-800">{order.paymentMethod.replace(/_/g, ' ')}</span>
              </p>
              <p className="capitalize">
                {isHindi ? 'भुगतान स्थिति:' : 'Payment Status:'}{' '}
                <span
                  className={`font-bold ${
                    order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </p>
              {invoice?.customNotes && (
                <p className="text-slate-600 italic bg-amber-50 p-2 rounded border border-amber-100 text-[11px]">
                  {invoice.customNotes}
                </p>
              )}
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>{isHindi ? 'सामान मूल्य:' : 'Subtotal:'}</span>
                <span className="font-mono font-medium">₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>{isHindi ? 'छूट / डिस्काउंट:' : 'Discount Applied:'}</span>
                  <span className="font-mono">-₹{Number(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>{isHindi ? 'डिलीवरी शुल्क:' : 'Delivery Charge:'}</span>
                <span className="font-mono">
                  {Number(order.deliveryFee) === 0 ? (isHindi ? 'मुफ़्त' : 'FREE') : `₹${Number(order.deliveryFee).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isHindi ? 'टैक्स व जीएसटी:' : 'Taxes & GST:'}</span>
                <span className="font-mono">₹{Number(order.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-300 pt-2">
                <span>{isHindi ? 'कुल देय राशि:' : 'Grand Total:'}</span>
                <span className="font-mono text-emerald-700">₹{Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Official Footer */}
          <div className="border-t border-slate-200 pt-4 text-center text-[11px] text-slate-400 space-y-1">
            <p>
              {isHindi
                ? 'यह YUNAY स्थानीय व्यापार नेटवर्क पर सत्यापित कंप्यूटर जनरेटेड टैक्स इनवॉइस है।'
                : 'This is a computer-generated tax invoice verified on the YUNAY multi-tenant local commerce network.'}
            </p>
            <p className="font-bold text-slate-600">
              Powered by YUNAY • {isHindi ? 'हर जगह स्थानीय व्यापार को सशक्त बनाना' : 'Empowering Neighborhood Commerce Everywhere'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
