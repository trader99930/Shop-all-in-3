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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onOpenVendorOnboarding: () => void;
  onLoginSuccess?: (role: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onOpenVendorOnboarding,
  onLoginSuccess,
}) => {
  const { loginWithIdentifier, loginWithGoogle, registerCustomer } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [signupStep, setSignupStep] = useState<'choose' | 'customer'>('choose');

  // Sign In inputs
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Customer Sign Up inputs
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSignupStep('choose');
      setErrorMsg('');
      setSuccessMsg('');
      setIdentifier('');
      setPassword('');
      setRegName('');
      setRegPhone('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Handle Sign In submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your Mobile Number or Email address');
      return;
    }

    setSubmitting(true);
    try {
      const res = await loginWithIdentifier(identifier.trim(), password);

      if (res.success && res.user) {
        setSuccessMsg(`Welcome back, ${res.user.name}!`);
        setTimeout(() => {
          onClose();
          if (onLoginSuccess) {
            onLoginSuccess(res.user?.role || 'customer');
          }
        }, 400);
      } else {
        setErrorMsg(res.error || 'Invalid credentials or user not found');
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
      setErrorMsg('Passwords do not match');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative text-slate-800 transition-all max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Global Feedback Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl animate-shake">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: SIGN IN */}
        {/* ========================================================================= */}
        {mode === 'signin' && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto shadow-xs border border-emerald-100">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight pt-2">
                Sign In to YUNAY
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Access your orders, saved addresses, or manage your digital storefront.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number or Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 98765 43210 or you@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-sm border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition font-medium"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 focus:bg-white rounded-xl text-sm border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-slate-400 text-xs font-semibold">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              onClick={async () => {
                setErrorMsg('');
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

            <div className="text-center pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                New user? Customers & Shop Owners must{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setMode('signup');
                    setSignupStep('choose');
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700 underline transition cursor-pointer"
                >
                  Sign Up First
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: SIGN UP - ROLE SELECTION */}
        {/* ========================================================================= */}
        {mode === 'signup' && signupStep === 'choose' && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Create your YUNAY account
              </h2>
              <p className="text-xs text-slate-500">
                Select how you would like to use YUNAY to continue.
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
                        Sell Local
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Create your digital storefront, upload products, accept orders, and grow your local customer base.
                    </p>
                    <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition">
                      <span>Sign Up as Shop Owner</span>
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
                        Shop & Order
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Shop from neighborhood stores, discover local products, and order for direct delivery or pickup.
                    </p>
                    <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-blue-700 group-hover:translate-x-0.5 transition">
                      <span>Sign Up as Customer</span>
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
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: SIGN UP - CUSTOMER REGISTRATION FORM */}
        {/* ========================================================================= */}
        {mode === 'signup' && signupStep === 'customer' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSignupStep('choose')}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Customer Registration
                </h2>
                <p className="text-[11px] text-slate-500">
                  Shop from verified neighborhood stores
                </p>
              </div>
            </div>

            <form onSubmit={handleCustomerSignUp} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
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
                  Mobile Number *
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
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 focus:bg-white rounded-xl text-xs border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 focus:bg-white rounded-xl text-xs border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
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
                    <span>Create Customer Account</span>
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
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
