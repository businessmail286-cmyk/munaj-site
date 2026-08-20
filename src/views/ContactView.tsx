import React, { useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  MessageCircle,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { WebsiteSettings, SupportTicket } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useBranding } from '../context/BrandingContext';
import { submitContactRequest } from '../lib/supabase';
import { formatCustomerError } from '../lib/errorUtils';

interface ContactViewProps {
  settings: WebsiteSettings;
  setCurrentTab?: (tab: any) => void;
  openAuthModal?: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({
  settings,
  setCurrentTab,
  openAuthModal,
}) => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const { branding } = useBranding();
  const siteName = branding.site_name || settings.site_name || 'MUNAJ';

  const [name, setName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Auto-populate user details when authenticated profile changes
  useEffect(() => {
    if (profile?.full_name && !name) setName(profile.full_name);
    if (user?.email && !email) setEmail(user.email);
    if (profile?.phone && !phone) setPhone(profile.phone);
  }, [user, profile]);

  const faqs = [
    {
      q: 'How fast will my food arrive?',
      a: 'Orders are dispatched within 15-20 minutes of cooking completion. Depending on your location across Lagos Island and Mainland, standard delivery takes 30-45 minutes.',
    },
    {
      q: 'How is the food packaged to stay hot and fresh?',
      a: 'All our soups and rice platters are sealed in microwave-safe, spill-proof thermal foil boxes and bowls that retain cooking heat and prevent transit leaks.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We currently prioritize Cash / Pay on Delivery. When your delivery rider arrives with your food, you can pay using cash or a portable POS card machine.',
    },
    {
      q: 'Can I place large orders for catering, parties, or office meetings?',
      a: 'Yes! We cater for large private events, corporate lunches, and family gatherings. You can use this contact form or call our direct order line directly.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // 1. Validation
    if (!name.trim()) {
      setSubmitError('Please enter your full name.');
      showToast('error', 'Validation Error', 'Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setSubmitError('Please enter a valid email address.');
      showToast('error', 'Validation Error', 'Please enter a valid email address.');
      return;
    }

    if (!subject.trim()) {
      setSubmitError('Please provide a subject for your inquiry.');
      showToast('error', 'Validation Error', 'Please provide a subject.');
      return;
    }

    if (!message.trim() || message.trim().length < 5) {
      setSubmitError('Please write a message with at least 5 characters.');
      showToast('error', 'Validation Error', 'Please write a message.');
      return;
    }

    // 2. Check authentication required by Supabase RLS policies
    if (!user) {
      const authNotice = `Please sign in or create an account so your message reaches ${siteName} Support and you can receive live replies.`;
      setSubmitError(authNotice);
      showToast('info', 'Sign in Required', authNotice);
      openAuthModal?.();
      return;
    }

    // 3. Submit to Supabase
    setLoading(true);

    try {
      const res = await submitContactRequest({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
        category,
        customerId: user.id,
      });

      if (res.error || !res.success) {
        const errorMsg = formatCustomerError(res.error, 'Failed to submit contact message. Please try again.');
        setSubmitError(errorMsg);
        showToast('error', 'Submission Failed', errorMsg);
      } else {
        setCreatedTicket(res.ticket || null);
        setSubmitted(true);
        setSubmitError(null);
        setSubject('');
        setMessage('');
        showToast('success', `Message Sent to ${siteName}!`, 'Your inquiry has been logged with our customer care team.');
      }
    } catch (err: any) {
      const errMsg = formatCustomerError(err, 'Unable to submit your contact message right now. Please try again.');
      setSubmitError(errMsg);
      showToast('error', 'Connection Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 px-3.5 py-1.5 rounded-full text-xs font-bold border border-amber-500/20">
          <MessageCircle className="w-4 h-4" />
          <span>Direct Kitchen & Customer Care</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 font-display">
          We'd Love to Hear From You
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500">
          Have a question about our menu, special dietary requests, bulk catering, or delivery? Reach out directly.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Contact Info & Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-8 border border-neutral-800 space-y-6 shadow-xl">
            <h3 className="font-bold text-lg font-display text-white border-b border-neutral-800 pb-3">
              Direct Contact Channels
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-neutral-300">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Kitchen Address</span>
                  <span className="font-medium text-white">{settings.address || 'No. 15 Dada Street, Oshodi, Lagos, Nigeria'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Order Phone Lines</span>
                  <a href={`tel:${(settings.phone || '+234 806 454 4421').replace(/\s+/g, '')}`} className="font-bold text-amber-400 hover:underline block">
                    {settings.phone || '+234 806 454 4421'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zM12.05 20.21c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.188 8.188 0 0 1-1.26-4.44c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.23 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.17 1.73 2.65 4.2 3.71.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.23-.18-.48-.3z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">WhatsApp Support</span>
                  <a
                    href="https://wa.me/2348064544421?text=Hello%20MUNAJ%20Foods%2C%20I%20need%20help%20with%20my%20order."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#25D366] hover:underline block"
                  >
                    +234 806 454 4421
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Customer Email</span>
                  <a href={`mailto:${settings.email || 'ogonnayaomoke80@gmail.com'}`} className="font-medium text-white hover:underline block">
                    {settings.email || 'ogonnayaomoke80@gmail.com'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Operating Kitchen Hours</span>
                  <span className="font-medium text-white">{settings.opening_hours || 'Mon - Sun: 8:00 AM - 10:30 PM'}</span>
                </div>
              </div>
            </div>

            {/* Live Support Portal Quick Link */}
            <div className="pt-4 border-t border-neutral-800">
              <div className="bg-neutral-800/70 p-3.5 rounded-2xl border border-neutral-700 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    Live Customer Support
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Track existing inquiries & live agent messages
                  </p>
                </div>
                {setCurrentTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('support');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 px-3 py-1.5 rounded-xl shrink-0 transition-colors"
                  >
                    Open Chat
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-lg font-display text-neutral-900">
                Send Us a Message
              </h3>
              {user ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Signed in as {profile?.full_name || user.email}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200"
                >
                  <LogIn className="w-3 h-3" />
                  Sign In for Live Sync
                </button>
              )}
            </div>

            {/* Guest Info Notice Banner */}
            {!user && (
              <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Direct Customer Support</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Signing in connects your inquiry directly with the MUNAJ Customer Support Desk, allowing real-time order lookups and two-way messaging in your Customer Portal.
                  </p>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {submitError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold">Error Sending Message</p>
                  <p className="text-[11px] mt-0.5 whitespace-pre-wrap text-rose-700">
                    {submitError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="text-rose-400 hover:text-rose-700 text-xs font-bold shrink-0"
                >
                  ✕
                </button>
              </div>
            )}

            {submitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-lg text-neutral-900">Inquiry Received & Logged!</h4>
                  {createdTicket && (
                    <div className="inline-block bg-neutral-100 text-neutral-800 px-3 py-1 rounded-lg text-xs font-mono font-bold">
                      Ticket Ref: {createdTicket.ticket_number || `TCK-${createdTicket.id.slice(0, 8).toUpperCase()}`}
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto pt-1">
                    Thank you for contacting MUNAJ. Your message has been sent to our customer care team and we will attend to you promptly.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  {setCurrentTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentTab('support');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      View in Live Support Portal
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setCreatedTicket(null);
                      setSubject('');
                      setMessage('');
                    }}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Babatunde Adeleke"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-neutral-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0801 234 5678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-neutral-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-neutral-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Inquiry Topic</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:border-amber-500 outline-hidden bg-neutral-50"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Event / Bulk Catering">Event / Bulk Catering</option>
                      <option value="Delivery Question">Delivery Question</option>
                      <option value="Feedback & Compliment">Feedback & Compliment</option>
                      <option value="Order Issue">Order Issue</option>
                      <option value="Payment Issue">Payment Issue</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Catering quote for 50 people on Saturday"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-neutral-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Your Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you need..."
                    className="w-full p-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-neutral-50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 text-amber-400 ${loading ? 'animate-bounce' : ''}`} />
                  <span>{loading ? 'Sending to MUNAJ Support...' : 'Send Message to MUNAJ'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200 shadow-xs space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-extrabold text-neutral-900 font-display">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-neutral-500">
            Quick answers to common questions about ordering, packaging, and deliveries.
          </p>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-neutral-100">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-4 font-bold text-sm text-neutral-900 hover:text-amber-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180 text-amber-500' : ''}`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed pr-6 animate-in fade-in duration-200">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
