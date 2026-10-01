import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Store,
  Tag,
  AlertTriangle,
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  CheckCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Order } from '../types/index.ts';

interface CartDrawerProps {
  onOrderPlaced: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOrderPlaced }) => {
  const { currentUser, getAuthHeaders } = useAuth();
  const {
    items,
    cartShop,
    subtotal,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    conflict,
    resolveConflict,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    discountAmount,
    deliveryFee,
    finalTotal,
  } = useCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Checkout form fields
  const [customerName, setCustomerName] = useState(currentUser?.name || 'Rahul Verma');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '+91 98765 11223');
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Sunshine Apartments, Barakhamba Road');
  const [addressType, setAddressType] = useState<'home' | 'work' | 'other'>('home');
  const [landmark, setLandmark] = useState('Opposite Metro Station Gate 2');
  const [deliveryInstructions, setDeliveryInstructions] = useState('Please ring bell twice');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'pay_at_store' | 'upi_online'>(
    'cash_on_delivery'
  );
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  const minOrderAmount = Number(cartShop?.minOrderAmount || 0);
  const freeDeliveryThreshold = Number(cartShop?.freeDeliveryThreshold || 500);
  const canCheckout = subtotal >= minOrderAmount && items.length > 0;

  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponSuccess('');
    if (!couponInput) return;
    const res = await applyCoupon(couponInput);
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput('');
    } else {
      setCouponError(res.message);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartShop || items.length === 0) return;

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setOrderError('Please enter your delivery address');
      return;
    }
    if (!customerPhone.trim()) {
      setOrderError('Please enter a valid mobile number');
      return;
    }

    setSubmittingOrder(true);
    setOrderError('');

    try {
      const orderPayload = {
        shopId: cartShop.id,
        customerName,
        customerPhone,
        orderType,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : '',
        addressType,
        landmark,
        deliveryInstructions,
        paymentMethod,
        couponCode: appliedCoupon?.code,
        items: items.map((i) => ({
          productId: i.product.id,
          variantId: i.variantId || null,
          quantity: i.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (res.ok) {
        setIsCheckingOut(false);
        setIsCartOpen(false);
        onOrderPlaced(data.order);
      } else {
        setOrderError(data.error || 'Failed to place order. Please try again.');
      }
    } catch (err: any) {
      setOrderError(err.message || 'Network error while placing order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <>
      {/* Conflict Modal: When user attempts to add product from another store */}
      {conflict.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Replace items in cart?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your cart currently contains items from{' '}
              <strong className="text-slate-800">{cartShop?.name}</strong>. YUNAY orders are fulfilled directly by individual local shops. Would you like to clear your current cart and switch to{' '}
              <strong className="text-emerald-700">{conflict.pendingShop?.name}</strong>?
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => resolveConflict(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Keep Current Cart
              </button>
              <button
                onClick={() => resolveConflict(true)}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Clear & Switch Shop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer Backdrop */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          onClick={() => {
            if (!isCheckingOut) setIsCartOpen(false);
          }}
        />
      )}

      {/* Cart Sliding Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              {isCheckingOut ? 'Checkout Order' : 'Your Shopping Cart'}
            </h2>
          </div>
          <button
            onClick={() => {
              setIsCartOpen(false);
              setIsCheckingOut(false);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isCheckingOut ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col justify-between">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Browse products from neighborhood stores and add items to your cart.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Store Banner */}
                {cartShop && (
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{cartShop.name}</h4>
                        <p className="text-[10px] text-slate-500">{cartShop.city}</p>
                      </div>
                    </div>
                    <button
                      onClick={clearCart}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Free Delivery / Minimum Order Progress */}
                {cartShop && (
                  <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {subtotal < minOrderAmount ? (
                      <div className="text-amber-700 flex items-center justify-between text-[11px] font-semibold">
                        <span>Min. Order Requirement:</span>
                        <span>₹{minOrderAmount} (Add ₹{minOrderAmount - subtotal} more)</span>
                      </div>
                    ) : subtotal < freeDeliveryThreshold ? (
                      <div className="text-emerald-700 flex items-center justify-between text-[11px] font-semibold">
                        <span>Free Delivery Progress:</span>
                        <span>Add ₹{freeDeliveryThreshold - subtotal} for FREE Delivery</span>
                      </div>
                    ) : (
                      <div className="text-emerald-700 flex items-center gap-1.5 text-[11px] font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>You unlocked FREE local delivery!</span>
                      </div>
                    )}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (subtotal / freeDeliveryThreshold) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <div key={item.id} className="py-3 flex items-center gap-3">
                      <img
                        src={item.product.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                          {item.product.name}
                        </h4>
                        {item.variant && (
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            Variant: {item.variant.name}
                          </span>
                        )}
                        <p className="text-[11px] text-slate-500 font-mono">
                          ₹{item.effectivePrice} / {item.product.unit}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-slate-200 text-slate-600 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-800 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-slate-200 text-slate-600 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="pt-2">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <span>Code "{appliedCoupon.code}" applied (-₹{discountAmount})</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-rose-600 font-bold hover:underline text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon / Promo Code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-[11px] text-rose-600 mt-1">{couponError}</p>}
                  {couponSuccess && <p className="text-[11px] text-emerald-600 mt-1">{couponSuccess}</p>}
                </div>
              </div>
            )}

            {/* Bottom Summary & Checkout Button */}
            {items.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount</span>
                      <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-mono">
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Final Total</span>
                    <span className="font-mono text-emerald-700">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  disabled={!canCheckout}
                  onClick={() => setIsCheckingOut(true)}
                  className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md ${
                    canCheckout
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                {!canCheckout && subtotal < minOrderAmount && (
                  <p className="text-[10px] text-amber-600 text-center">
                    Add ₹{minOrderAmount - subtotal} more to meet minimum order amount (₹{minOrderAmount}).
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Checkout View */
          <form onSubmit={handlePlaceOrder} className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col justify-between">
            <div className="space-y-4 text-xs">
              {orderError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  {orderError}
                </div>
              )}

              {/* Order Mode (Delivery vs Pickup) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Fulfillment Option</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                      orderType === 'delivery'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Home Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('pickup')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                      orderType === 'pickup'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Store Pickup</span>
                  </button>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Delivery Address fields */}
              {orderType === 'delivery' && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Delivery Address</label>
                    <div className="flex gap-1">
                      {(['home', 'work', 'other'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAddressType(type)}
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            addressType === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House/Flat number, Street, Locality"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                  />
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nearby Landmark</label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Metro Station / Community Park"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Delivery Instructions</label>
                    <input
                      type="text"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      placeholder="e.g. Ring bell twice, leave at reception"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="pt-1 border-t border-slate-100">
                <label className="font-bold text-slate-700 block mb-1.5">Payment Method</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={() => setPaymentMethod('cash_on_delivery')}
                      className="text-emerald-600"
                    />
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-bold text-slate-800">Cash on Delivery (COD)</p>
                      <p className="text-[10px] text-slate-500">Pay cash directly when order reaches you</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'upi_online'}
                      onChange={() => setPaymentMethod('upi_online')}
                      className="text-emerald-600"
                    />
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-bold text-slate-800">UPI / Online Payment (Simulated)</p>
                      <p className="text-[10px] text-slate-500">Instant digital confirmation</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'pay_at_store'}
                      onChange={() => setPaymentMethod('pay_at_store')}
                      className="text-emerald-600"
                    />
                    <Store className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-bold text-slate-800">Pay at Store Counter</p>
                      <p className="text-[10px] text-slate-500">Ideal for self pickup</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
              <div className="flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>Total Amount:</span>
                <span className="font-mono text-emerald-700 text-base">₹{finalTotal.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {submittingOrder ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>Place Order & Generate Bill</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                Powered by YUNAY • Digital Tax Invoice generated automatically upon order.
              </p>
            </div>
          </form>
        )}
      </div>
    </>
  );
};
