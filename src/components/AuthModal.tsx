import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useBranding } from '../context/BrandingContext';
import { formatCustomerError } from '../lib/errorUtils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup';
  defaultMode?: 'login' | 'signup' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab,
  defaultMode,
}) => {
  const { signIn, signUp, resetPassword, startAuthLoading } = useAuth();
  const { showToast } = useToast();
  const { branding } = useBranding();
  const siteName = branding.site_name || 'MUNAJ';

  const initialMode = initialTab || (defaultMode === 'register' ? 'signup' : (defaultMode || 'login'));
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  // Sync mode if initialTab or defaultMode changes
  React.useEffect(() => {
    if (defaultMode === 'register' || initialTab === 'signup') {
      setMode('signup');
    } else if (defaultMode === 'login' || initialTab === 'login') {
      setMode('login');
    }
  }, [defaultMode, initialTab, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setErrorMessage(formatCustomerError(error, 'Invalid email or password. Please check your credentials.'));
        } else {
          onClose();
          startAuthLoading('login');
        }
      } else if (mode === 'signup') {
        if (!fullName.trim()) {
          setErrorMessage('Please enter your full name');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const { error } = await signUp(email.trim(), password, fullName.trim(), phone.trim());
        if (error) {
          setErrorMessage(formatCustomerError(error, 'Unable to create your account. Please check your details and try again.'));
        } else {
          onClose();
          startAuthLoading('signup');
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email.trim());
        if (error) {
          setErrorMessage(formatCustomerError(error, 'Failed to send password reset email. Please try again.'));
        } else {
          setForgotSent(true);
        }
      }
    } catch (err: any) {
      setErrorMessage(formatCustomerError(err, 'An unexpected error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200 relative animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-emerald-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
            {branding.logo_url && branding.logo_url.trim() ? (
              <img
                src={branding.logo_url.trim()}
                alt={siteName}
                className="h-7 sm:h-8 w-auto max-w-[90px] sm:max-w-[100px] object-contain shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fallbackEl = document.getElementById('auth-modal-logo-fallback');
                  if (fallbackEl) fallbackEl.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              id="auth-modal-logo-fallback"
              style={{ display: branding.logo_url && branding.logo_url.trim() ? 'none' : 'flex' }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#16A34A] to-[#052E16] text-white items-center justify-center font-black text-xs sm:text-sm border border-[#B7FF00]/40 shrink-0"
            >
              {siteName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-[#052E16] text-sm sm:text-base truncate">
                {mode === 'login' && `Sign in to ${siteName}`}
                {mode === 'signup' && `Create ${siteName} Account`}
                {mode === 'forgot' && `Reset ${siteName} Password`}
              </h3>
              <p className="text-[11px] sm:text-xs text-neutral-500 truncate">
                {mode === 'login' && 'Access order tracking & saved addresses'}
                {mode === 'signup' && 'Quick registration for seamless ordering'}
                {mode === 'forgot' && 'Enter email for recovery instructions'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F0FDF4] hover:bg-emerald-100 text-[#052E16] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Tab switch for login / signup */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 p-1.5 mx-4 sm:mx-6 mt-3 sm:mt-4 bg-[#F0FDF4] rounded-xl text-xs font-bold border border-emerald-100">
              <button
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-white text-[#052E16] shadow-xs border border-emerald-200/60' : 'text-neutral-500 hover:text-[#052E16]'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'signup' ? 'bg-white text-[#052E16] shadow-xs border border-emerald-200/60' : 'text-neutral-500 hover:text-[#052E16]'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Form Body */}
          <div className="p-4 sm:p-6">
            {errorMessage && (
              <div className="mb-3 sm:mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {forgotSent ? (
              <div className="text-center py-4 sm:py-6 space-y-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 text-[#16A34A] flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="font-bold text-[#052E16] text-sm sm:text-base">Check Your Inbox</h4>
                <p className="text-xs text-neutral-600">
                  We sent a password reset link to <span className="font-semibold text-neutral-900">{email}</span>. Follow the instructions to reset your password.
                </p>
                <button
                  onClick={() => {
                    setForgotSent(false);
                    setMode('login');
                  }}
                  className="mt-3 sm:mt-4 text-xs font-bold text-[#16A34A] hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-[#052E16] mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-emerald-600/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Babatunde Adeleke"
                          className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden transition-all bg-[#F0FDF4]/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-[#052E16] mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-emerald-600/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +234 801 234 5678"
                          className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden transition-all bg-[#F0FDF4]/30"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-[#052E16] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-emerald-600/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden transition-all bg-[#F0FDF4]/30"
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] sm:text-xs font-bold text-[#052E16]">Password</label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setErrorMessage(null);
                          }}
                          className="text-[11px] text-[#16A34A] hover:underline font-bold cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-emerald-600/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden transition-all bg-[#F0FDF4]/30"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[#16A34A] hover:bg-[#15803D] text-white py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <span>Please wait...</span>
                  ) : (
                    <>
                      <span>
                        {mode === 'login' && 'Sign In'}
                        {mode === 'signup' && 'Create Account'}
                        {mode === 'forgot' && 'Send Reset Email'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#B7FF00]" />
                    </>
                  )}
                </button>

                {mode === 'forgot' && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage(null);
                      }}
                      className="text-xs font-bold text-neutral-600 hover:text-[#052E16] cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
