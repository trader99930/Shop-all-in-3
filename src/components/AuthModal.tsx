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
import { useLanguage } from '../context/LanguageContext.tsx';

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
  const { t, isHindi, pick } = useLanguage();

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
          ? 'Please enter your Admin ID'
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
    setIdentifier('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative text-slate-800 transition-all max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Segment: Sign In / Sign Up Mode Switcher */}
        <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl mb-6 w-fit mx-auto border border-slate-200 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setSigninStep('choose');
              setErrorMsg('');
              setErrorAccountRole(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4 text-emerald-600" />
            <span>{t('auth.signin_tab', 'Sign In')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setSignupStep('choose');
              setErrorMsg('');
              setErrorAccountRole(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>{t('auth.signup_tab', 'Sign Up')}</span>
          </button>
        </div>

        {/* Feedback Notifications */}
        {errorMsg && (
          <div className="mb-5 p-4 bg-rose-50 border-2 border-rose-300 text-rose-900 text-sm font-bold rounded-2xl animate-shake space-y-2">
            <div>{errorMsg}</div>
            {errorAccountRole && (
              <button
                type="button"
                onClick={() => handleSwitchSigninRole(errorAccountRole)}
                className="mt-1 flex items-center gap-2 px-3.5 py-2 bg-white border border-rose-300 text-rose-900 hover:bg-rose-100 rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-rose-600" />
                <span>
                  {errorAccountRole === 'customer'
                    ? t('auth.switch_to_customer', '👉 Switch to Customer Sign In')
                    : t('auth.switch_to_shopkeeper', '👉 Switch to Shop Owner Sign In')}
                </span>
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-sm font-bold rounded-2xl flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: SIGN IN - STEP 1 (ROLE SELECTION) */}
        {/* ========================================================================= */}
        {mode === 'signin' && signinStep === 'choose' && (
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/20">
                <Store className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1">
                {t('auth.signin_title', 'Sign In to YUNAY')}
              </h2>
              <p className="text-sm font-bold text-slate-600 max-w-sm mx-auto">
                {t('auth.choose_role_signin', 'Choose your account type to sign in')}
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              {/* Option 1: Shop Owner */}
              <div
                onClick={() => handleSwitchSigninRole('shopkeeper')}
                className="group p-4.5 rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 transition cursor-pointer relative shadow-2xs"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition">
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">
                        {t('auth.shopkeeper_title', 'Shop Owner')}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase">
                        {t('auth.shopkeeper_badge', 'Shop Owner')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 mt-1 leading-relaxed">
                      {t('auth.shopkeeper_signin_desc', 'Sign in to manage your shop, view customer orders, update catalog, and track sales.')}
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-sm font-black text-emerald-700 group-hover:translate-x-1 transition">
                      <span>{t('auth.shopkeeper_signin_btn', 'Sign In as Shop Owner')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: Customer */}
              <div
                onClick={() => handleSwitchSigninRole('customer')}
                className="group p-4.5 rounded-2xl border-2 border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 transition cursor-pointer relative shadow-2xs"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20 group-hover:scale-105 transition">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">
                        {t('auth.customer_title', 'Customer')}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black uppercase">
                        {t('auth.customer_badge', 'Customer')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 mt-1 leading-relaxed">
                      {t('auth.customer_signin_desc', 'Sign in to browse local stores, track pending deliveries, and manage your cart.')}
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-sm font-black text-blue-700 group-hover:translate-x-1 transition">
                      <span>{t('auth.customer_signin_btn', 'Sign In as Customer')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 3: Admin Portal */}
              <div
                onClick={() => handleSwitchSigninRole('admin')}
                className="p-4 rounded-2xl border-2 border-purple-200 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50 transition cursor-pointer flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      {t('auth.admin_title', 'Platform Administrator')}
                    </h4>
                    <p className="text-xs font-bold text-slate-500">
                      {t('auth.admin_desc', 'Master console for authorized administrators')}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-purple-600" />
              </div>
            </div>

            <div className="text-center pt-3 border-t border-slate-100">
              <p className="text-sm font-bold text-slate-600">
                New user?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setMode('signup');
                    setSignupStep('choose');
                  }}
                  className="font-black text-emerald-600 hover:text-emerald-700 underline transition cursor-pointer text-sm"
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
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
              <button
                type="button"
                onClick={() => {
                  setSigninStep('choose');
                  setErrorMsg('');
                  setErrorAccountRole(null);
                }}
                className="flex items-center gap-1.5 text-sm font-black text-slate-600 hover:text-slate-900 transition cursor-pointer p-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Type</span>
              </button>

              {/* Fast Role Switcher Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl text-xs font-black border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => handleSwitchSigninRole('shopkeeper')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    signinStep === 'shopkeeper'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Shop Owner</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchSigninRole('customer')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    signinStep === 'customer'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchSigninRole('admin')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    signinStep === 'admin'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Portal Title & Subtitle */}
            <div className="text-left space-y-1">
              <div className="flex items-center gap-2.5">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {signinStep === 'shopkeeper' && (isHindi ? 'दुकानदार लॉगिन' : 'Shop Owner Sign In')}
                  {signinStep === 'customer' && (isHindi ? 'ग्राहक लॉगिन' : 'Customer Sign In')}
                  {signinStep === 'admin' && (isHindi ? 'प्लेटफ़ॉर्म एडमिन लॉगिन' : 'Platform Admin Sign In')}
                </h3>
                <span
                  className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${
                    signinStep === 'shopkeeper'
                      ? 'bg-emerald-100 text-emerald-800'
                      : signinStep === 'customer'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {signinStep === 'shopkeeper' && (isHindi ? 'दुकानदार' : 'Shop Owner')}
                  {signinStep === 'customer' && (isHindi ? 'ग्राहक' : 'Customer')}
                  {signinStep === 'admin' && (isHindi ? 'एडमिन' : 'Admin')}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-600">
                {signinStep === 'shopkeeper' &&
                  (isHindi
                    ? 'अपनी दुकान तक पहुंचने के लिए पंजीकृत मोबाइल या ईमेल दर्ज करें।'
                    : 'Enter your registered merchant mobile or email to access your shop.')}
                {signinStep === 'customer' &&
                  (isHindi
                    ? 'ऑर्डर देखने और स्थानीय दुकानों से खरीदारी के लिए अपना मोबाइल या ईमेल दर्ज करें।'
                    : 'Enter your mobile or email to view orders and shop from local stores.')}
                {signinStep === 'admin' &&
                  (isHindi
                    ? 'दुकान नियंत्रण और प्लेटफ़ॉर्म संचालन के लिए मास्टर कंसोल।'
                    : 'Master admin console for shop moderation and platform control.')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignIn} className="space-y-4 pt-1.5">
              <div>
                <label className="block text-sm font-black text-slate-800 mb-1.5">
                  {signinStep === 'admin'
                    ? (isHindi ? 'एडमिन आईडी' : 'Admin ID')
                    : signinStep === 'shopkeeper'
                    ? (isHindi ? 'दुकानदार मोबाइल नंबर या ईमेल *' : 'Shop Mobile Number or Email *')
                    : (isHindi ? 'ग्राहक मोबाइल नंबर या ईमेल *' : 'Customer Mobile Number or Email *')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={
                      signinStep === 'admin'
                        ? (isHindi ? 'एडमिन आईडी दर्ज करें' : 'Enter Admin ID')
                        : signinStep === 'shopkeeper'
                        ? 'e.g. 98765 43210 or store@example.com'
                        : 'e.g. 98765 43210 or you@example.com'
                    }
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 focus:bg-white rounded-2xl text-base font-bold text-slate-900 border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 outline-none transition placeholder:text-slate-400 placeholder:font-bold shadow-2xs"
                  />
                  {signinStep === 'shopkeeper' ? (
                    <Store className="w-5 h-5 text-emerald-600 absolute left-3.5 top-3.5" />
                  ) : signinStep === 'admin' ? (
                    <ShieldCheck className="w-5 h-5 text-purple-600 absolute left-3.5 top-3.5" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-black text-slate-800">
                    {t('auth.password_label', 'Password')} *
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={signinStep === 'admin' ? 'Enter password' : (isHindi ? 'पासवर्ड दर्ज करें' : 'Enter your password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-slate-50 focus:bg-white rounded-2xl text-base font-bold text-slate-900 border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 outline-none transition placeholder:text-slate-400 placeholder:font-bold shadow-2xs"
                  />
                  <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3.5 px-5 text-white rounded-2xl font-black text-base shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 ${
                  signinStep === 'shopkeeper'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                    : signinStep === 'customer'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                    : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                }`}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {signinStep === 'shopkeeper' && t('auth.shopkeeper_signin_btn', 'Sign In as Shop Owner')}
                      {signinStep === 'customer' && t('auth.customer_signin_btn', 'Sign In as Customer')}
                      {signinStep === 'admin' && (isHindi ? 'एडमिन के रूप में लॉग इन करें' : 'Sign In as Administrator')}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Google Sign-In (Available for Customer) */}
            {signinStep === 'customer' && (
              <>
                <div className="relative flex py-1.5 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-slate-400 text-xs font-bold uppercase tracking-wider">OR</span>
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
                  className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  <span>Continue with Google</span>
                </button>
              </>
            )}

            {/* Footer Registration Action */}
            <div className="text-center pt-3 border-t border-slate-100">
              {signinStep === 'shopkeeper' ? (
                <p className="text-sm font-bold text-slate-600">
                  {isHindi ? 'क्या अभी तक दुकान का खाता नहीं है?' : "Don't have a shop account yet?"}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVendorOnboarding();
                    }}
                    className="font-black text-emerald-600 hover:text-emerald-700 underline transition cursor-pointer text-sm"
                  >
                    {isHindi ? 'अपनी दुकान जोड़ें' : 'Register Your Shop'}
                  </button>
                </p>
              ) : signinStep === 'customer' ? (
                <p className="text-sm font-bold text-slate-600">
                  {isHindi ? 'नए ग्राहक हैं?' : 'New customer?'}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setMode('signup');
                      setSignupStep('customer');
                    }}
                    className="font-black text-blue-600 hover:text-blue-700 underline transition cursor-pointer text-sm"
                  >
                    {isHindi ? 'ग्राहक खाता बनाएं' : 'Create Customer Account'}
                  </button>
                </p>
              ) : (
                <p className="text-sm font-bold text-slate-400">
                  {isHindi ? 'प्लेटफ़ॉर्म प्रशासन कंसोल' : 'Platform administration console'}
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
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/20">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1">
                {t('auth.signup_title', 'Create your YUNAY account')}
              </h2>
              <p className="text-sm font-bold text-slate-600">
                {t('auth.choose_role_signup', 'Select your account type to register')}
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              {/* Option 1: Shop Owner */}
              <div
                onClick={() => {
                  onClose();
                  onOpenVendorOnboarding();
                }}
                className="group p-4.5 rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 transition cursor-pointer relative shadow-2xs"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition">
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">
                        {t('auth.shopkeeper_title', 'Shop Owner')}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase">
                        {isHindi ? 'दुकानदार • स्थानीय बिक्री' : 'Shop Owner • Sell Local'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 mt-1 leading-relaxed">
                      {isHindi
                        ? 'अपना डिजिटल स्टोरफ्रंट बनाएं, उत्पाद अपलोड करें और सीधे ग्राहकों से ऑर्डर स्वीकार करें।'
                        : 'Create your digital storefront, upload products, and accept local customer orders.'}
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-sm font-black text-emerald-700 group-hover:translate-x-1 transition">
                      <span>{isHindi ? 'दुकानदार खाता बनाएं' : 'Sign Up as Shop Owner'}</span>
                      <ArrowRight className="w-4 h-4" />
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
                className="group p-4.5 rounded-2xl border-2 border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 transition cursor-pointer relative shadow-2xs"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20 group-hover:scale-105 transition">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">
                        {t('auth.customer_title', 'Customer')}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black uppercase">
                        {isHindi ? 'ग्राहक • खरीदारी व ऑर्डर' : 'Customer • Shop & Order'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 mt-1 leading-relaxed">
                      {isHindi
                        ? 'आस-पास की दुकानों से खरीदारी करें, ताज़ा सामान खोजें और सीधे डिलीवरी पाएं।'
                        : 'Shop from neighborhood stores, discover local products, and order for direct delivery.'}
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-sm font-black text-blue-700 group-hover:translate-x-1 transition">
                      <span>{isHindi ? 'ग्राहक खाता बनाएं' : 'Sign Up as Customer'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-slate-100">
              <p className="text-sm font-bold text-slate-600">
                {isHindi ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setMode('signin');
                    setSigninStep('choose');
                  }}
                  className="font-black text-emerald-600 hover:text-emerald-700 underline transition cursor-pointer text-sm"
                >
                  {t('auth.signin_tab', 'Sign In')}
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
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
              <button
                type="button"
                onClick={() => setSignupStep('choose')}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {isHindi ? 'ग्राहक पंजीकरण' : 'Customer Registration'}
                </h2>
                <p className="text-xs font-bold text-slate-500">
                  {isHindi ? 'सत्यापित स्थानीय दुकानों से खरीदारी करें' : 'Shop from verified neighborhood stores'}
                </p>
              </div>
            </div>

            <form onSubmit={handleCustomerSignUp} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-sm font-black text-slate-800 mb-1.5">
                  {t('auth.name_label', 'Full Name')} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={isHindi ? 'उदा. राहुल शर्मा' : 'e.g. Rahul Sharma'}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 focus:bg-white rounded-2xl text-base font-bold text-slate-900 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 outline-none transition placeholder:text-slate-400 placeholder:font-bold shadow-2xs"
                  />
                  <UserIcon className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-800 mb-1.5">
                  {t('auth.phone_label', 'Mobile Number')} *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98765 43210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 focus:bg-white rounded-2xl text-base font-bold text-slate-900 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 outline-none transition placeholder:text-slate-400 placeholder:font-bold shadow-2xs"
                  />
                  <Phone className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-800 mb-1.5">
                  {isHindi ? 'ईमेल आईडी' : 'Email Address'} <span className="text-slate-400 font-semibold">{isHindi ? '(ऐच्छिक)' : '(optional)'}</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g. rahul@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 focus:bg-white rounded-2xl text-base font-bold text-slate-900 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 outline-none transition placeholder:text-slate-400 placeholder:font-bold shadow-2xs"
                  />
                  <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-black text-slate-800 mb-1.5">
                    {t('auth.password_label', 'Password')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50 focus:bg-white rounded-2xl text-base font-bold text-slate-900 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 outline-none transition placeholder:text-slate-400 placeholder:font-bold shadow-2xs"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-slate-800 mb-1.5">
                    {isHindi ? 'पासवर्ड पुष्टि *' : 'Confirm Password *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50 focus:bg-white rounded-2xl text-base font-bold text-slate-900 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 outline-none transition placeholder:text-slate-400 placeholder:font-bold shadow-2xs"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-base shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t('auth.submit_signup', 'Create Customer Account')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-3 border-t border-slate-100">
              <p className="text-sm font-bold text-slate-600">
                {isHindi ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setMode('signin');
                    setSigninStep('customer');
                  }}
                  className="font-black text-blue-600 hover:text-blue-700 underline transition cursor-pointer text-sm"
                >
                  {t('auth.signin_tab', 'Sign In')}
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
