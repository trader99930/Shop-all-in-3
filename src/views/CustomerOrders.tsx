import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  RotateCcw,
  Star,
  LifeBuoy,
  ChevronRight,
  AlertCircle,
  X,
  Store,
  Phone,
  Printer,
} from 'lucide-react';
import { Order, Invoice, OrderItem } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { InvoiceModal } from '../components/InvoiceModal.tsx';

interface CustomerOrdersProps {
  onExploreShops: () => void;
}

export const CustomerOrders: React.FC<CustomerOrdersProps> = ({ onExploreShops }) => {
  const { currentUser, getAuthHeaders } = useAuth();
  const { refreshCart, setIsCartOpen } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItem[]>([]);

  // Review Modal State
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Support Ticket Modal State
  const [supportOrder, setSupportOrder] = useState<Order | null>(null);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/my-orders', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching my orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser?.id]);

  const handleOpenInvoice = async (order: Order) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedOrderForInvoice(data.order);
        setSelectedInvoice(data.invoice);
        setSelectedOrderItems(data.items);
      }
    } catch (err) {
      console.error('Error fetching order invoice:', err);
    }
  };

  const handleReorder = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/reorder`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshCart();
        setIsCartOpen(true);
      } else {
        alert(data.error || 'Failed to reorder');
      }
    } catch (err: any) {
      alert(err.message || 'Error executing reorder');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder) return;
    setReviewSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          shopId: reviewOrder.shopId,
          orderId: reviewOrder.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setReviewSuccess(true);
        setTimeout(() => {
          setReviewOrder(null);
          setReviewSuccess(false);
          setReviewComment('');
        }, 1500);
      }
    } catch {
      alert('Failed to post review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportOrder) return;
    setSupportSubmitting(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          shopId: supportOrder.shopId,
          orderId: supportOrder.id,
          subject: supportSubject,
          message: supportMessage,
          category: 'Order Issue',
        }),
      });
      if (res.ok) {
        setSupportSuccess(true);
        setTimeout(() => {
          setSupportOrder(null);
          setSupportSuccess(false);
          setSupportSubject('');
          setSupportMessage('');
        }, 1500);
      }
    } catch {
      alert('Failed to submit ticket');
    } finally {
      setSupportSubmitting(false);
    }
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case 'NEW':
        return 0;
      case 'ACCEPTED':
        return 1;
      case 'PACKING':
        return 2;
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_PICKUP':
        return 3;
      case 'DELIVERED':
      case 'COMPLETED':
        return 4;
      default:
        return -1;
    }
  };

  const statusSteps = [
    { label: 'Placed', icon: Clock },
    { label: 'Accepted', icon: CheckCircle2 },
    { label: 'Packing', icon: Package },
    { label: 'Out for Delivery / Ready', icon: Truck },
    { label: 'Delivered', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            <span>My Orders & Digital Invoices</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time fulfillment tracking, printable bills, and 1-click reorders
          </p>
        </div>

        <button
          onClick={onExploreShops}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          Explore More Shops
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No orders placed yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Browse local grocers, bakeries, and boutiques to place your first neighborhood order.
          </p>
          <button
            onClick={onExploreShops}
            className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
          >
            Start Shopping on YUNAY
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const stepIdx = getStatusStepIndex(order.status);
            const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';
            const isDelivered = order.status === 'DELIVERED' || order.status === 'COMPLETED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition space-y-6"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{order.shop?.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Order #{order.orderNumber} • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isCancelled
                          ? 'bg-rose-100 text-rose-800'
                          : isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      ₹{Number(order.totalAmount).toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Status Stepper (If not cancelled) */}
                {!isCancelled ? (
                  <div className="py-2">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-0" />
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 -z-0 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, (stepIdx / (statusSteps.length - 1)) * 100))}%`,
                        }}
                      />

                      {statusSteps.map((step, idx) => {
                        const isCompleted = idx <= stepIdx;
                        const isCurrent = idx === stepIdx;
                        const Icon = step.icon;
                        return (
                          <div
                            key={step.label}
                            className="flex flex-col items-center relative z-10 text-center"
                          >
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                                  : 'bg-slate-200 text-slate-500'
                              } ${isCurrent ? 'scale-110' : ''}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span
                              className={`text-[10px] mt-1.5 font-bold whitespace-nowrap hidden sm:inline ${
                                isCompleted ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>This order was cancelled. Payment has been refunded according to platform terms.</span>
                  </div>
                )}

                {/* Items Summary */}
                <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2">
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Items in this Order
                  </p>
                  <div className="divide-y divide-slate-100">
                    {order.items?.map((item) => (
                      <div key={item.id} className="py-1.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800">
                            {item.quantity}x {item.productName}
                          </span>
                          {item.variantName && (
                            <span className="text-[11px] text-emerald-700 ml-1.5">
                              ({item.variantName})
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-700 font-medium">₹{item.total}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-500 text-[11px]">
                    <span>
                      {order.orderType === 'pickup' ? 'Counter Pickup' : `Delivering to: ${order.deliveryAddress}`}
                    </span>
                    <span className="font-semibold text-slate-700">
                      Payment: {order.paymentMethod.replace(/_/g, ' ')} ({order.paymentStatus})
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => handleOpenInvoice(order)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View / Print Tax Bill</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {isDelivered && (
                      <button
                        onClick={() => setReviewOrder(order)}
                        className="flex items-center gap-1 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition border border-amber-200"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>Rate & Review</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleReorder(order.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition border border-emerald-200"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>1-Click Reorder</span>
                    </button>

                    <button
                      onClick={() => setSupportOrder(order)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                      title="Need Help with this Order?"
                    >
                      <LifeBuoy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tax Invoice Modal */}
      {selectedOrderForInvoice && (
        <InvoiceModal
          order={selectedOrderForInvoice}
          shop={selectedOrderForInvoice.shop || null}
          invoice={selectedInvoice}
          items={selectedOrderItems}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}

      {/* Review Modal */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative text-left">
            <button
              onClick={() => setReviewOrder(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900">Review {reviewOrder.shop?.name}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Share your honest feedback to help local merchants maintain top quality.
            </p>

            {reviewSuccess ? (
              <div className="p-4 my-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold text-center">
                Review posted successfully! Thank you for supporting local stores.
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 mt-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setReviewRating(s)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            s <= reviewRating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Your Comments & Experience
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="e.g. Vegetables were crisp and fresh, packaged with care and reached in 30 minutes!"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewOrder(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    {reviewSubmitting ? 'Posting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Support Ticket Modal */}
      {supportOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative text-left">
            <button
              onClick={() => setSupportOrder(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900">
              Report Order Issue (#{supportOrder.orderNumber})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Our support desk will liaise with {supportOrder.shop?.name} to resolve your concern.
            </p>

            {supportSuccess ? (
              <div className="p-4 my-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold text-center">
                Support ticket created! Check back or expect a call shortly.
              </div>
            ) : (
              <form onSubmit={handleSubmitSupport} className="space-y-4 mt-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Issue Topic</label>
                  <input
                    type="text"
                    required
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder="e.g. Missing milk packet / Delivery delay"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Please provide details of what happened..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSupportOrder(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={supportSubmitting}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                  >
                    {supportSubmitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
