import React, { useState } from 'react';
import {
  ShieldAlert,
  Phone,
  Mail,
  LogOut,
  Headphones,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { submitContactRequest } from '../lib/supabase';

interface AccountSuspendedScreenProps {
  onContactSupportClick?: () => void;
}

export const AccountSuspendedScreen: React.FC<AccountSuspendedScreenProps> = () => {
  const { user, profile, signOut } = useAuth();
  const { showToast } = useToast();

  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquirySubject, setInquirySubject] = useState('Account Suspension Inquiry');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const supportEmail = 'support@munaj.ng';
  const supportPhone = '+234 801 234 5678';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    showToast('info', 'Email Copied', `${supportEmail} copied to clipboard.`);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(supportPhone);
    setCopiedPhone(true);
    showToast('info', 'Phone Copied', `${supportPhone} copied to clipboard.`);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const handleSendSuspensionInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) {
      showToast('warning', 'Message Required', 'Please enter your message for the support team.');
      return;
    }

    setSubmittingInquiry(true);
    try {
      const res = await submitContactRequest({
        name: profile?.full_name || user?.user_metadata?.full_name || 'Suspended Account User',
        email: user?.email || profile?.email || 'customer@munaj.ng',
        phone: profile?.phone || undefined,
        subject: inquirySubject.trim() || 'Account Suspension Inquiry',
        message: inquiryMessage.trim(),
        category: 'account',
        customerId: user?.id || null,
      });

      if (res.success) {
        setInquirySent(true);
        showToast('success', 'Message Sent', 'Your appeal has been submitted to MUNAJ Customer Support.');
      } else {
        showToast('error', 'Submission Failed', res.error || 'Failed to submit support message.');
      }
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Could not connect to support service.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  return (
    <div
      id="account-suspended-screen"
      className="min-h-screen bg-radial from-[#052E16] via-[#031D0E] to-[#010D06] flex flex-col items-center justify-center p-4 sm:p-6 text-white selection:bg-[#B7FF00] selection:text-[#052E16]"
    >
      {/* Brand Header */}
      <div className="mb-6 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl bg-[#16A34A] text-white flex items-center justify-center shadow-lg border border-[#B7FF00]/40">
          <span className="font-extrabold text-lg text-[#B7FF00] font-display">M</span>
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight text-white font-display">
            MUNAJ
          </span>
          <span className="block text-[10px] uppercase font-bold tracking-widest text-[#B7FF00]">
            Kitchen & Delivery
          </span>
        </div>
      </div>

      {/* Main Suspension Card */}
      <div className="w-full max-w-xl bg-white/5 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center">
        {/* Warning Icon Badge */}
        <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-xl animate-in zoom-in-90 duration-300">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>

        {/* Headings */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-600/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Account Notice</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
            Account Suspended
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-md mx-auto">
            Your MUNAJ account has been suspended. Please contact Customer Support if you believe this was a mistake.
          </p>
        </div>

        {/* User Account Info Chip */}
        {user?.email && (
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs text-neutral-300 flex items-center justify-center gap-2">
            <span className="text-neutral-400">Account ID / Email:</span>
            <span className="font-mono font-bold text-white">{user.email}</span>
          </div>
        )}

        {/* Direct Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            id="contact-support-btn"
            onClick={() => setShowInquiryModal(true)}
            className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#16A34A]/30 transition-all cursor-pointer group"
          >
            <Headphones className="w-4 h-4 text-[#B7FF00]" />
            <span>Contact Customer Support</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            id="suspended-signout-btn"
            onClick={() => signOut()}
            className="bg-white/10 hover:bg-white/15 text-neutral-200 hover:text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-white/15 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Official Channels Footer Info */}
        <div className="pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#B7FF00] shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Support Email</span>
                <span className="text-xs font-semibold text-white">{supportEmail}</span>
              </div>
            </div>
            <button
              onClick={handleCopyEmail}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors cursor-pointer"
              title="Copy email"
            >
              {copiedEmail ? <Check className="w-3.5 h-3.5 text-[#B7FF00]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#B7FF00] shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Customer Hotline</span>
                <span className="text-xs font-semibold text-white">{supportPhone}</span>
              </div>
            </div>
            <button
              onClick={handleCopyPhone}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 transition-colors cursor-pointer"
              title="Copy phone"
            >
              {copiedPhone ? <Check className="w-3.5 h-3.5 text-[#B7FF00]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400 pt-1">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Support hours: Mon - Sun, 8:00 AM - 10:00 PM WAT</span>
        </div>
      </div>

      {/* Support Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#052E16] border border-[#16A34A]/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800/60">
              <div className="flex items-center gap-2.5">
                <Headphones className="w-5 h-5 text-[#B7FF00]" />
                <h3 className="text-lg font-bold font-display">Contact Customer Support</h3>
              </div>
              <button
                onClick={() => {
                  setShowInquiryModal(false);
                  setInquirySent(false);
                }}
                className="text-neutral-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {inquirySent ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-[#B7FF00] flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">Appeal Submitted</h4>
                  <p className="text-xs text-neutral-300 max-w-sm mx-auto">
                    Your inquiry has been logged. Our customer support desk will review your account status and respond to your email shortly.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowInquiryModal(false);
                    setInquirySent(false);
                  }}
                  className="bg-[#16A34A] hover:bg-[#15803D] text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendSuspensionInquiry} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    Your Registered Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.email || profile?.email || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={inquirySubject}
                    onChange={(e) => setInquirySubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#031D0E] border border-emerald-700/60 text-white text-xs focus:border-[#B7FF00] focus:ring-1 focus:ring-[#B7FF00] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-200 mb-1">
                    Message / Explanation <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Describe your account issue or why you believe your suspension was a mistake..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#031D0E] border border-emerald-700/60 text-white text-xs focus:border-[#B7FF00] focus:ring-1 focus:ring-[#B7FF00] outline-hidden resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowInquiryModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInquiry}
                    className="px-6 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingInquiry ? 'Sending...' : 'Send to Support'}
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
