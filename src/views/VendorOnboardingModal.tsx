import React, { useState } from 'react';
import { X, Store, Check, ArrowRight, Upload, MapPin, Clock, Phone, Sparkles, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { ImageUploadPicker } from '../components/ImageUploadPicker.tsx';

interface VendorOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (slug: string) => void;
}

export const VendorOnboardingModal: React.FC<VendorOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, switchUser, refreshSession, getAuthHeaders } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Owner & Basic Store
  const [ownerName, setOwnerName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98111 22334');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('Grocery');
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    if (isOpen && currentUser) {
      if (currentUser.name && !ownerName) setOwnerName(currentUser.name);
      if (currentUser.email && !email) setEmail(currentUser.email);
      if (currentUser.phone && !phone) setPhone(currentUser.phone);
    }
  }, [isOpen, currentUser]);

  // Step 2: Location & Contact
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [pincode, setPincode] = useState('110001');
  const [businessPhone, setBusinessPhone] = useState(phone);
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80');

  // Step 3: Timings & Delivery Settings
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('21:00');
  const [weeklyClosedDay, setWeeklyClosedDay] = useState('None');
  const [homeDeliveryEnabled, setHomeDeliveryEnabled] = useState(true);
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState('30');
  const [minOrderAmount, setMinOrderAmount] = useState('100');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState('500');
  const [agreeTerms, setAgreeTerms] = useState(false);

  if (!isOpen) return null;

  const categories = [
    'Grocery',
    'Fruits & Vegetables',
    'Bakery',
    'Clothing',
    'Footwear',
    'Electronics',
    'Mobile Accessories',
    'Hardware',
    'Stationery',
    'Cosmetics',
    'Home & Kitchen',
    'Furniture',
    'Pharmacy & Wellness',
    'Restaurants & Food',
    'Services',
    'Other',
  ];

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (step === 1) {
      if (!ownerName.trim()) {
        setErrorMsg('Please enter your full name');
        return;
      }
      if (!email.trim()) {
        setErrorMsg('Please enter your email address');
        return;
      }
      if (!phone.trim()) {
        setErrorMsg('Please enter your mobile phone number');
        return;
      }
      if (!shopName.trim()) {
        setErrorMsg('Please enter your shop or business name');
        return;
      }
      if (!password) {
        setErrorMsg('Please create a password for your shop owner account');
        return;
      }
      if (password.length < 4) {
        setErrorMsg('Password should be at least 4 characters');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify both passwords.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!address.trim()) {
        setErrorMsg('Please enter your shop address');
        return;
      }
      if (!city.trim()) {
        setErrorMsg('Please enter your city');
        return;
      }
      setStep(3);
      return;
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setErrorMsg('Please accept the YUNAY merchant platform terms to continue.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        ownerName,
        email,
        phone,
        password,
        shopName,
        category,
        description,
        address,
        city,
        state,
        pincode,
        businessPhone,
        logoUrl,
        bannerUrl,
        openingTime,
        closingTime,
        weeklyClosedDay,
        homeDeliveryEnabled,
        pickupEnabled,
        deliveryFee,
        minOrderAmount,
        freeDeliveryThreshold,
      };

      const res = await fetch('/api/auth/register-vendor', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        if (data.token) {
          localStorage.setItem('yunay_session_token', data.token);
        }
        if (data.user.uid) {
          localStorage.setItem('yunay_active_uid', data.user.uid);
        }
        await refreshSession();
        onSuccess(data.shop.slug);
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to complete registration');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Create Your Digital Storefront
            </h2>
            <p className="text-xs text-slate-500">
              Join thousands of independent neighborhood merchants on YUNAY
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between py-4 border-b border-slate-100 text-xs font-bold text-slate-500">
          <span className={step >= 1 ? 'text-emerald-700 font-extrabold' : ''}>1. Business Info</span>
          <span className="text-slate-300">→</span>
          <span className={step >= 2 ? 'text-emerald-700 font-extrabold' : ''}>2. Location & Media</span>
          <span className="text-slate-300">→</span>
          <span className={step >= 3 ? 'text-emerald-700 font-extrabold' : ''}>3. Operations & Hours</span>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={step === 3 ? handleCompleteOnboarding : handleNextStep} className="mt-4 space-y-4 text-xs">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-3 animate-in fade-in">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Owner Name *</label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="merchant@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              {/* Password & Confirm Password for Shop Owner Account */}
              <div className="space-y-1 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-emerald-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Create Shop Owner Password (दुकानदार पासवर्ड बनाएं)</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full">
                    Required for Sign In
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 pb-1">
                  You will use this password along with your mobile/email to sign in to your merchant dashboard.
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">Password (पासवर्ड) *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-medium text-xs"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px]">Confirm Password (दोबारा डालें) *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-medium text-xs"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Shop / Business Name *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Sharma General Store"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary Business Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell neighborhood customers about your specialty products and service..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-3 animate-in fade-in">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Shop Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Shop number, Street, Market block"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Order Contact Phone</label>
                <input
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100">
                <ImageUploadPicker
                  label="दुकान का लोगो (Shop Logo Photo)"
                  sublabel="कैमरा से फोटो लें या गैलरी से लोगो अपलोड करें"
                  value={logoUrl}
                  onChange={(val) => setLogoUrl(val)}
                  aspectRatio="square"
                  placeholderText="दुकान के लोगो की फोटो लगाएं"
                />

                <ImageUploadPicker
                  label="दुकान का मुख्य बैनर / बोर्ड फोटो (Storefront Banner)"
                  sublabel="दुकान के सामने के बोर्ड या काउंटर की फोटो (कैमरा / गैलरी)"
                  value={bannerUrl}
                  onChange={(val) => setBannerUrl(val)}
                  aspectRatio="banner"
                  placeholderText="दुकान के बैनर या बोर्ड की फोटो लगाएं"
                />
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Opening Time</label>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Closing Time</label>
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Weekly Closed</label>
                  <select
                    value={weeklyClosedDay}
                    onChange={(e) => setWeeklyClosedDay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="None">Open All 7 Days</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Free Delivery Above (₹)</label>
                  <input
                    type="number"
                    value={freeDeliveryThreshold}
                    onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span className="font-semibold text-slate-700 text-[11px]">
                    I agree to the YUNAY Merchant Terms, Fair Commission Model, and acknowledge that all generated bills will display "Powered by YUNAY".
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs flex items-center gap-1.5"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : step === 3 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Launch Digital Storefront</span>
                </>
              ) : (
                <>
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
