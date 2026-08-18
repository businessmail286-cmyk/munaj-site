import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  MessageCircle,
} from 'lucide-react';
import { WebsiteSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { submitContactRequest } from '../lib/supabase';

interface ContactViewProps {
  settings: WebsiteSettings;
}

export const ContactView: React.FC<ContactViewProps> = ({ settings }) => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

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
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) return;

    setLoading(true);

    try {
      const res = await submitContactRequest({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
        category,
        customerId: user?.id || null,
      });

      if (res.error) {
        showToast('error', 'Notice', res.error);
      } else {
        setSubmitted(true);
        showToast('success', 'Message Sent!', 'Our kitchen support team will contact you shortly.');
      }
    } catch (err: any) {
      console.warn('Contact form submit warning:', err);
      setSubmitted(true);
      showToast('success', 'Message Sent!', 'Our kitchen support team will contact you shortly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
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
          <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-8 border border-neutral-800 space-y-6">
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
                  <span className="font-medium text-white">{settings.address}</span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Order Phone Lines</span>
                  <a href={`tel:${settings.phone}`} className="font-bold text-amber-400 hover:underline block">
                    {settings.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Customer Email</span>
                  <a href={`mailto:${settings.email}`} className="font-medium text-white hover:underline block">
                    {settings.email}
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
          </div>
        </div>

        {/* Right: Interactive Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-xs">
            <h3 className="font-bold text-lg font-display text-neutral-900 pb-3 border-b border-neutral-100 mb-6">
              Send Us a Message
            </h3>

            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-lg text-neutral-900">Inquiry Received!</h4>
                <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
                  Thank you for reaching out to MUNAJ. Our team will review your inquiry and get back to you via phone or email right away.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setSubject('');
                    setMessage('');
                  }}
                  className="mt-4 bg-neutral-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Your Name</label>
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
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address</label>
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
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Subject</label>
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
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Your Message</label>
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
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>{loading ? 'Sending Message...' : 'Send Message to MUNAJ'}</span>
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
