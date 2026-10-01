import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  Lock,
  User as UserIcon,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  initialRole?: 'customer' | 'shopkeeper' | 'admin';
  onOpenVendorOnboarding: () => void;
  onLoginSuccess?: (role: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  initialRole,
  onOpenVendorOnboarding,
  onLoginSuccess,
}) => {
  const { loginWithIdentifier, loginWithGoogle, registerCustomer } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [signinStep, setSigninStep] = useState<'choose' | 'customer' | 'shopkeeper' | 'admin'>('choose');
  const [signupStep, setSignupStep] = useState<'choose' | 'customer'>('choose');

  // Sign In inputs
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Customer Sign Up inputs
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Status & Role Error handling
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorAccountRole, setErrorAccountRole] = useState<'customer' | 'shopkeeper' | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSigninStep(initialRole || 'choose');
      setSignupStep('choose');
      setErrorMsg('');
      setErrorAccountRole(null);
      setSuccessMsg('');
      setIdentifier('');
      setPassword('');
      setShowPassword(false);
      setRegName('');
      setRegPhone('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setShowRegPassword(false);
      setShowRegConfirmPassword(false);
    }
  }, [isOpen, initialMode, initialRole]);

  if (!isOpen) return null;

  // Handle Sign In submission with strict role enforcement
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setErrorAccountRole(null);
    setSuccessMsg('');

    if (!identifier.trim()) {
      setErrorMsg(
        signinStep === 'admin'
          ? 'Please enter the Admin ID (Yunu)'
          : 'Please enter your Mobile Number or Email address'
      );
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const intendedRole =
        signinStep === 'shopkeeper'
          ? 'shopkeeper'
          : signinStep === 'customer'
          ? 'customer'
          : undefined;

      const res = await loginWithIdentifier(identifier.trim(), password, intendedRole);

      if (res.success && res.user) {
        setSuccessMsg(`Welcome back, ${res.user.name || 'User'}!`);
        setTimeout(() => {
          onClose();
          if (onLoginSuccess) {
            onLoginSuccess(res.user?.role || (signinStep === 'shopkeeper' ? 'shopkeeper' : 'customer'));
          }
        }, 400);
      } else {
        setErrorMsg(res.error || 'Invalid credentials or user not found');
        if (res.accountRole === 'customer' || res.accountRole === 'shopkeeper') {
          setErrorAccountRole(res.accountRole);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error signing in. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Customer Registration submission
  const handleCustomerSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setErrorAccountRole(null);
    setSuccessMsg('');

    if (!regName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!regPhone.trim() && !regEmail.trim()) {
      setErrorMsg('Please provide a mobile number or email address');
      return;
    }
    if (regPassword && regConfirmPassword && regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify both passwords.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerCustomer(
        regName.trim(),
        regPhone.trim(),
        regEmail.trim(),
        regPassword
      );

      if (res.success) {
        setSuccessMsg('Account created successfully! Welcome to YUNAY.');
        setTimeout(() => {
          onClose();
          if (onLoginSuccess) {
            onLoginSuccess('customer');
          }
        }, 500);
      } else {
        setErrorMsg(res.error || 'Failed to create customer account');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick switch role handler
  const handleSwitchSigninRole = (targetRole: 'shopkeeper' | 'customer' | 'admin') => {
    setErrorMsg('');
    setErrorAccountRole(null);
    setSigninStep(targetRole);
    if (targetRole === 'admin') {
      if (!identifier) setIdentifier('Yunu');
      if (!password) setPassword('1122');
    } else {
      if (identifier === 'Yunu') setIdentifier('');
      if (password === '1122') setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative text-slate-800 transition-all max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Segment: Sign In / Sign Up Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl mb-5 w-fit mx-auto border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setSigninStep('choose');
              setErrorMsg('');
              setErrorAccountRole(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sign In (लॉगिन)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setSignupStep('choose');
              setErrorMsg('');
              setErrorAccountRole(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-600" />
            <span>Sign Up (साइन अप)</span>
          </button>
        </div>

        {/* Feedback Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl animate-shake space-y-2">
            <div>{errorMsg}</div>
            {errorAccountRole && (
              <button
                type="button"
                onClick={() => handleSwitchSigninRole(errorAccountRole)}
                className="mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 text-rose-900 hover:bg-rose-100 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                <span>
                  {errorAccountRole === 'customer'
                    ? '👉 Switch to Customer Sign In (ग्राहक लॉगिन)'
                    : '👉 Switch to Shop Owner Sign In (दुकानदार लॉगिन)'}
                </span>
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: SIGN IN - STEP 1 (ROLE SELECTION) */}
        {/* ========================================================================= */}
        {mode === 'signin' && signinStep === 'choose' && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/20">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
                Sign In to YUNAY
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Choose your account type to sign in (अपना खाता प्रकार चुनें)
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {/* Option 1: Shop Owner */}
              <div
                onClick={() => handleSwitchSigninRole('shopkeeper')}
                className="group p-4 rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 transition cursor-pointer relative"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition">
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Shop Owner</h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        दुकानदार
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Sign in to manage your shop, view customer orders, update catalog, and track sales.
                    </p>
                    <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition">
                      <span>Sign In as Shop Owner (दुकानदार लॉगिन)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: Customer */}
              <div
                onClick={() => handleSwitchSigninRole('customer')}
                className="group p-4 rounded-2xl border-2 border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 transition cursor-pointer relative"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20 group-hover:scale-105 transition">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Customer</h3>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                        ग्राहक
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Sign in to browse local stores, track pending deliveries, and manage your cart.
                    </p>
                    <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-blue-700 group-hover:translate-x-0.5 transition">
                      <span>Sign In as Customer (ग्राहक लॉगिन)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 3: Admin Portal */}
              <div
                onClick={() => handleSwitchSigninRole('admin')}
                className="p-3 rounded-2xl border border-purple-200 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Platform Administrator</h4>
                    <p className="text-[10px] text-slate-500">Sign in with Admin ID (Yunu) & Password (1122)</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-600" />
              </div>
            </div>

            <div className="text-center pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                New user?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setMode('signup');
                    setSignupStep('choose');
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700 underline transition cursor-pointer"
                >
                  Create an Account (साइन अप करें)
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: SIGN IN - FORM (SHOP OWNER, CUSTOMER, OR ADMIN) */}
        {/* ========================================================================= */}
        {mode === 'signin' && signinStep !== 'choose' && (
          <div className="space-y-4">
            {/* Header with Back button and Role Tabs */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => {
                  setSigninStep('choose');
                  setErrorMsg('');
                  setErrorAccountRole(null);
                }}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer p-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Type</span>
              </button>

              {/* Fast Role Switcher Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => handleSwitchSigninRole('shopkeeper')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    signinStep === 'shopkeeper'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Store className="w-3 h-3" />
                  <span>Shop Owner</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchSigninRole('customer')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    signinStep === 'customer'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchSigninRole('admin')}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    signinStep === 'admin'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Portal Title & Subtitle */}
            <div className="text-left space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {signinStep === 'shopkeeper' && 'Shop Owner Sign In'}
                  {signinStep === 'customer' && 'Customer Sign In'}
                  {signinStep === 'admin' && 'Platform Admin Sign In'}
                </h3>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    signinStep === 'shopkeeper'
                      ? 'bg-emerald-100 text-emerald-800'
                      : signinStep === 'customer'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {signinStep === 'shopkeeper' && 'दुकानदार'}
                  {signinStep === 'customer' && 'ग्राहक'}
                  {signinStep === 'admin' && 'एडमिन'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {signinStep === 'shopkeeper' &&
                  'Enter your registered merchant mobile or email to access your shop.'}
                {signinStep === 'customer' &&
                  'Enter your mobile or email to view orders and shop from local stores.'}
                {signinStep === 'admin' &&
                  'Master admin console for shop moderation and platform control.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignIn} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {signinStep === 'admin'
                    ? 'Admin ID'
                    : signinStep === 'shopkeeper'
                    ? 'Shop Mobile Number or Email *'
                    : 'Customer Mobile Number or Email *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={
                      signinStep === 'admin'
                        ? 'Yunu'
                        : signinStep === 'shopkeeper'
                        ? 'e.g. 98765 43210 or store@example.com'
                        : 'e.g. 98765 43210 or you@example.com'
                    }
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-sm border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition font-medium"
                  />
                  {signinStep === 'shopkeeper' ? (
                    <Store className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                  ) : signinStep === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-purple-600 absolute left-3 top-3" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password (पासवर्ड) *
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={signinStep === 'admin' ? '1122' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-sm border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2.5 px-4 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1 ${
                  signinStep === 'shopkeeper'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : signinStep === 'customer'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                    : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                }`}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {signinStep === 'shopkeeper' && 'Sign In as Shop Owner (दुकानदार लॉगिन)'}
                      {signinStep === 'customer' && 'Sign In as Customer (ग्राहक लॉगिन)'}
                      {signinStep === 'admin' && 'Sign In as Administrator'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Google Sign-In (Available for Customer) */}
            {signinStep === 'customer' && (
              <>
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-slate-400 text-xs font-semibold">OR</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setErrorMsg('');
                    setErrorAccountRole(null);
                    try {
                      await loginWithGoogle();
                      onClose();
                      if (onLoginSuccess) onLoginSuccess('customer');
                    } catch {
                      setErrorMsg('Google Sign-In cancelled or unavailable.');
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-4 h-4"
                  />
                  <span>Continue with Google</span>
                </button>
              </>
            )}

            {/* Footer Registration Action */}
            <div className="text-center pt-2 border-t border-slate-100">
              {signinStep === 'shopkeeper' ? (
                <p className="text-xs text-slate-500">
                  Don't have a shop account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVendorOnboarding();
                    }}
                    className="font-bold text-emerald-600 hover:text-emerald-700 underline transition cursor-pointer"
                  >
                    Register Your Shop (नया दुकानदार साइन अप)
                  </button>
                </p>
              ) : signinStep === 'customer' ? (
                <p className="text-xs text-slate-500">
                  New customer?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setMode('signup');
                      setSignupStep('customer');
                    }}
                    className="font-bold text-blue-600 hover:text-blue-700 underline transition cursor-pointer"
                  >
                    Create Customer Account (साइन अप करें)
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Default credentials: ID: <b>Yunu</b> | Password: <b>1122</b>
                </p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: SIGN UP - ROLE SELECTION */}
        {/* ========================================================================= */}
        {mode === 'signup' && signupStep === 'choose' && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
                Create your YUNAY account
              </h2>
              <p className="text-xs text-slate-500">
                Select how you would like to use YUNAY to continue (अपना खाता चुनें)
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {/* Option 1: Shop Owner */}
              <div
                onClick={() => {
                  onClose();
                  onOpenVendorOnboarding();
                }}
                className="group p-4 rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 transition cursor-pointer relative"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition">
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Shop Owner</h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        दुकानदार • Sell Local
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Create your digital storefront, set password, upload products, and accept local customer orders.
                    </p>
                    <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition">
                      <span>Sign Up as Shop Owner (दुकानदार खाता बनाएं)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: Customer */}
              <div
                onClick={() => {
                  setErrorMsg('');
                  setSignupStep('customer');
                }}
                className="group p-4 rounded-2xl border-2 border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 transition cursor-pointer relative"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20 group-hover:scale-105 transition">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Customer</h3>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                        ग्राहक • Shop & Order
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Shop from neighborhood stores, discover local products, and order for direct delivery or pickup.
                    </p>
                    <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-blue-700 group-hover:translate-x-0.5 transition">
                      <span>Sign Up as Customer (ग्राहक खाता बनाएं)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setMode('signin');
                    setSigninStep('choose');
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700 underline transition cursor-pointer"
                >
                  Sign In (लॉगिन करें)
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: SIGN UP - CUSTOMER REGISTRATION FORM */}
        {/* ========================================================================= */}
        {mode === 'signup' && signupStep === 'customer' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setSignupStep('choose')}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Customer Registration (ग्राहक खाता)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Shop from verified neighborhood stores
                </p>
              </div>
            </div>

            <form onSubmit={handleCustomerSignUp} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name (पूरा नाम) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white rounded-xl text-sm border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (मोबाइल नंबर) *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98765 43210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white rounded-xl text-sm border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g. rahul@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white rounded-xl text-sm border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-8 pr-7 py-2 bg-slate-50 focus:bg-white rounded-xl text-xs border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full pl-8 pr-7 py-2 bg-slate-50 focus:bg-white rounded-xl text-xs border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Customer Account (खाता बनाएं)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setMode('signin');
                    setSigninStep('customer');
                  }}
                  className="font-bold text-blue-600 hover:text-blue-700 underline transition cursor-pointer"
                >
                  Sign In (ग्राहक लॉगिन)
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
