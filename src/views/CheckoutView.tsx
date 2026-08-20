import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Truck,
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Banknote,
  Building2,
  Copy,
  Check,
  AlertCircle,
  ChevronLeft,
  Lock,
  Info,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ViewTab, Order, PaymentSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { supabase, createOrder, formatNaira, getPaymentSettings } from '../lib/supabase';
import { formatCustomerError } from '../lib/errorUtils';
import { DEFAULT_PAYMENT_SETTINGS } from '../data/defaults';
import { AccountRestrictedBanner } from '../components/AccountRestrictedBanner';

interface CheckoutViewProps {
  setCurrentTab: (tab: ViewTab) => void;
  onOrderPlaced: (order: Order) => void;
  openAuthModal: () => void;
}

type PaymentMethodType = 'bank_transfer' | 'cod' | 'paystack' | 'flutterwave';

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  setCurrentTab,
  onOrderPlaced,
  openAuthModal,
}) => {
  const { user, profile } = useAuth();
  const { items, subtotal, deliveryFee, discountAmount, appliedPromo, total, clearCart } = useCart();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState(
    profile?.full_name || user?.user_metadata?.full_name || ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    profile?.phone || user?.user_metadata?.phone || ''
  );
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Payment settings state from public.payment_settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('bank_transfer');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Load payment settings from public.payment_settings and subscribe to Realtime updates
  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      const s = await getPaymentSettings();
      if (isMounted && s) {
        setPaymentSettings(s);
      }
    };

    fetchSettings();

    // Subscribe to Realtime payment_settings updates from Admin Panel
    const channel = supabase
      .channel('public:payment_settings_live_checkout')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_settings' },
        async () => {
          const fresh = await getPaymentSettings();
          if (isMounted && fresh) {
            setPaymentSettings(fresh);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Synchronize active payment method with enabled options from Admin Panel
  useEffect(() => {
    const availableMethods: PaymentMethodType[] = [];
    if (paymentSettings.bank_transfer_enabled) availableMethods.push('bank_transfer');
    if (paymentSettings.cash_on_delivery_enabled) availableMethods.push('cod');
    if (paymentSettings.paystack_enabled) availableMethods.push('paystack');
    if (paymentSettings.flutterwave_enabled) availableMethods.push('flutterwave');

    if (availableMethods.length > 0 && !availableMethods.includes(paymentMethod)) {
      setPaymentMethod(availableMethods[0]);
    }
  }, [paymentSettings, paymentMethod]);

  const handleCopyAccountNumber = () => {
    if (paymentSettings?.account_number) {
      navigator.clipboard.writeText(paymentSettings.account_number);
      setCopiedAccount(true);
      showToast('info', 'Account number copied!', `${paymentSettings.bank_name} account number copied to clipboard.`);
      setTimeout(() => setCopiedAccount(false), 3000);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#052E16] font-display">
          Your Tray is Empty
        </h2>
        <p className="text-xs text-neutral-500">
          Please add items to your cart before proceeding to checkout.
        </p>
        <button
          onClick={() => setCurrentTab('menu')}
          className="bg-[#16A34A] hover:bg-[#15803D] text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-md transition-colors"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validations
    if (!customerName.trim()) {
      setErrorMessage('Please provide your full recipient name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setErrorMessage('Please provide a valid active phone number for the delivery driver.');
      return;
    }
    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 5) {
      setErrorMessage('Please provide a detailed delivery street address with house or flat number.');
      return;
    }

    // Authentication check
    if (!user) {
      setErrorMessage('Please sign in before placing your order.');
      showToast('error', 'Sign In Required', 'Please sign in or create an account to complete checkout.');
      openAuthModal();
      return;
    }

    // Profile Status Check (Restricted or Banned)
    if (profile?.status === 'banned') {
      setErrorMessage('Your MUNAJ account has been suspended. Please contact Customer Support if you believe this was a mistake.');
      showToast('error', 'Account Suspended', 'Your account has been suspended.');
      return;
    }

    if (profile?.status === 'restricted') {
      setErrorMessage('Your account currently has restricted access. Please contact MUNAJ Customer Support for assistance.');
      showToast('warning', 'Account Restricted', 'Ordering is disabled for restricted accounts.');
      return;
    }

    setLoading(true);

    try {
      let selectedMethodName = 'Bank Transfer';
      let selectedPaymentStatus = 'pending';

      if (paymentMethod === 'bank_transfer') {
        selectedMethodName = 'Bank Transfer';
        selectedPaymentStatus = 'pending';
      } else if (paymentMethod === 'cod') {
        selectedMethodName = 'Cash on Delivery';
        selectedPaymentStatus = 'pending';
      } else if (paymentMethod === 'paystack') {
        selectedMethodName = 'Paystack';
        selectedPaymentStatus = 'pending';
      } else if (paymentMethod === 'flutterwave') {
        selectedMethodName = 'Flutterwave';
        selectedPaymentStatus = 'pending';
      }

      const orderPayload = {
        customerId: user.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || user.email || null,
        deliveryAddress: deliveryAddress.trim(),
        deliveryNotes: deliveryNotes.trim() || undefined,
        paymentMethod: selectedMethodName,
        paymentStatus: selectedPaymentStatus,
        subtotal,
        deliveryFee,
        discountAmount,
        promoCode: appliedPromo?.promo_code || undefined,
        total,
        items: items.map((item) => ({
          foodItemId: item.foodItem.id,
          foodName: item.foodItem.name,
          quantity: item.quantity,
          unitPrice: item.foodItem.price,
          subtotal: item.foodItem.price * item.quantity,
          options: item.instructions || undefined,
        })),
      };

      const result = await createOrder(orderPayload);

      if (result.error || !result.order?.id) {
        setErrorMessage(formatCustomerError(result.error, 'Unable to place your order right now. Please try again.'));
        setLoading(false);
        return;
      }

      // Celebrate success
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#16A34A', '#B7FF00', '#0B3D20'],
        });
      } catch {}

      showToast('success', 'Order Placed!', `Your order #${result.order.order_number} has been received.`);
      clearCart();
      onOrderPlaced(result.order);
    } catch (err: any) {
      console.error("ORDER PLACEMENT ERROR", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
      });
      console.error("MUNAJ ORDER CONTEXT", {
        authenticatedUserId: user?.id,
        cartContents: items,
        customerName,
        customerPhone,
        deliveryAddress,
        paymentMethod,
      });
      const errText = formatCustomerError(err, 'Unable to complete your order right now. Please try again.');
      setErrorMessage(errText);
    } finally {
      setLoading(false);
    }
  };

  const hasAnyPaymentMethod =
    paymentSettings.bank_transfer_enabled ||
    paymentSettings.cash_on_delivery_enabled ||
    paymentSettings.paystack_enabled ||
    paymentSettings.flutterwave_enabled;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentTab('cart')}
          className="p-2 rounded-xl border border-emerald-200 hover:bg-[#F0FDF4] text-emerald-800 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#052E16] font-display">
            Delivery & Checkout
          </h1>
          <p className="text-xs text-emerald-800/80 mt-0.5">
            Complete your recipient and delivery details to receive your freshly prepared Nigerian delicacies.
          </p>
        </div>
      </div>

      {/* Restricted Account Warning Banner */}
      {user && profile?.status === 'restricted' && (
        <AccountRestrictedBanner
          onContactSupport={() => {
            setCurrentTab('account');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Guest Notice */}
      {!user && (
        <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#0B3D20]">
            <User className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>
              Ordering as a Guest. <strong>Have an account?</strong> Sign in to auto-fill your saved addresses and track live updates!
            </span>
          </div>
          <button
            onClick={openAuthModal}
            className="bg-[#052E16] hover:bg-[#0B3D20] text-[#B7FF00] border border-[#16A34A]/40 px-4 py-2 rounded-xl font-bold transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Customer Form */}
        <div className="lg:col-span-7">
          <form
            id="checkout-form"
            onSubmit={handlePlaceOrder}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6"
          >
            <h3 className="font-bold text-[#052E16] text-lg font-display pb-3 border-b border-emerald-100 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#16A34A]" />
              <span>Recipient & Delivery Address</span>
            </h3>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900 text-xs shadow-xs" id="checkout-error-container">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-1 w-full">
                  <span className="font-extrabold text-rose-950 block text-xs">Unable to Complete Order</span>
                  <p className="text-xs text-rose-900 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#052E16] mb-1">
                  Full Recipient Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-emerald-700/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    id="checkout-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Babatunde Adeleke"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden bg-[#F0FDF4]/30 text-[#052E16]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#052E16] mb-1">
                  Active Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-700/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    id="checkout-phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 0801 234 5678"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden bg-[#F0FDF4]/30 text-[#052E16]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#052E16] mb-1">
                Email Address (For Order Receipts)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-emerald-700/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="checkout-email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="babatunde@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden bg-[#F0FDF4]/30 text-[#052E16]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#052E16] mb-1">
                Detailed Delivery Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-emerald-700/50 absolute left-3.5 top-3" />
                <textarea
                  required
                  rows={3}
                  id="checkout-address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Flat 4B, Block 12, Dada Street, Oshodi, Lagos"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden bg-[#F0FDF4]/30 resize-none text-[#052E16]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#052E16] mb-1">
                Delivery Instructions & Nearby Landmark (Optional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-emerald-700/50 absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Opposite standard pharmacy, call when gate security asks for access code."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden bg-[#F0FDF4]/30 resize-none text-[#052E16]"
                />
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="pt-4 border-t border-emerald-100 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#052E16]">
                  Payment Method
                </label>
                <span className="text-[11px] font-semibold text-emerald-700">
                  All transactions in ₦ NGN
                </span>
              </div>

              {!hasAnyPaymentMethod ? (
                <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200 text-emerald-800 text-xs">
                  Payment methods are currently being configured by MUNAJ Kitchen. Please call our hotline to complete your order.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Bank Transfer */}
                  {paymentSettings.bank_transfer_enabled && (
                    <div
                      id="pay-method-bank"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-[#16A34A] bg-[#F0FDF4] shadow-xs'
                          : 'border-emerald-100 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-[#16A34A] flex items-center justify-center mt-1">
                          {paymentMethod === 'bank_transfer' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <h4 className="font-bold text-sm text-[#052E16] flex items-center gap-1.5">
                          <span>Bank Transfer</span>
                          <span className="text-[10px] bg-[#16A34A] text-white font-extrabold px-1.5 py-0.5 rounded-md">
                            Direct
                          </span>
                        </h4>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Transfer directly to our official bank account.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cash on delivery */}
                  {paymentSettings.cash_on_delivery_enabled && (
                    <div
                      id="pay-method-cod"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-[#16A34A] bg-[#F0FDF4] shadow-xs'
                          : 'border-emerald-100 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center shrink-0">
                          <Banknote className="w-5 h-5" />
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-[#16A34A] flex items-center justify-center mt-1">
                          {paymentMethod === 'cod' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <h4 className="font-bold text-sm text-[#052E16]">
                          Cash on Delivery
                        </h4>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Pay with cash or card swipe POS upon food handover.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Paystack Online */}
                  {paymentSettings.paystack_enabled && (
                    <div
                      id="pay-method-paystack"
                      onClick={() => setPaymentMethod('paystack')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                        paymentMethod === 'paystack'
                          ? 'border-[#16A34A] bg-[#F0FDF4] shadow-xs'
                          : 'border-emerald-100 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-700 flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-[#16A34A] flex items-center justify-center mt-1">
                          {paymentMethod === 'paystack' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <h4 className="font-bold text-sm text-[#052E16] flex items-center gap-1.5">
                          <span>Paystack</span>
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.5 rounded-md">
                            Online
                          </span>
                        </h4>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Pay securely with Debit Card, USSD, or Bank Account.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Flutterwave Online */}
                  {paymentSettings.flutterwave_enabled && (
                    <div
                      id="pay-method-flutterwave"
                      onClick={() => setPaymentMethod('flutterwave')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                        paymentMethod === 'flutterwave'
                          ? 'border-[#16A34A] bg-[#F0FDF4] shadow-xs'
                          : 'border-emerald-100 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-[#16A34A] flex items-center justify-center mt-1">
                          {paymentMethod === 'flutterwave' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <h4 className="font-bold text-sm text-[#052E16] flex items-center gap-1.5">
                          <span>Flutterwave</span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-md">
                            Instant
                          </span>
                        </h4>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Pay with Cards, Bank Transfer, or Mobile Money.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Bank Transfer Information Card */}
              {paymentMethod === 'bank_transfer' && paymentSettings.bank_transfer_enabled && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#052E16] via-[#0B3D20] to-[#071A0E] text-white border border-[#16A34A]/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#B7FF00]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#B7FF00]">
                        Official Bank Account Details
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-200">Nigerian Naira (NGN / ₦)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Bank Name */}
                    <div>
                      <span className="text-[11px] text-emerald-300/80 block">Bank Name</span>
                      <span className="font-bold text-white text-sm" id="checkout-bank-name">
                        {paymentSettings.bank_name || 'Access Bank'}
                      </span>
                    </div>

                    {/* Account Name */}
                    <div>
                      <span className="text-[11px] text-emerald-300/80 block">Account Name</span>
                      <span className="font-bold text-white text-sm" id="checkout-account-name">
                        {paymentSettings.account_name || 'MUNAJ FOODS'}
                      </span>
                    </div>

                    {/* Account Number & Copy Button */}
                    <div className="sm:col-span-2 p-3.5 bg-[#071A0E] rounded-xl border border-emerald-800/60 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-[#B7FF00] uppercase font-bold block">
                          Account Number
                        </span>
                        <span className="font-mono font-extrabold text-lg sm:text-xl tracking-wider text-white" id="checkout-account-number">
                          {paymentSettings.account_number || '1234567890'}
                        </span>
                      </div>
                      <button
                        type="button"
                        id="copy-account-number-btn"
                        onClick={handleCopyAccountNumber}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        {copiedAccount ? (
                          <>
                            <Check className="w-4 h-4 text-[#B7FF00]" />
                            <span className="text-[#B7FF00]">Account copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Account Number</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Amount */}
                    <div className="sm:col-span-2 p-3 bg-emerald-950/60 rounded-xl border border-[#16A34A]/40 flex items-center justify-between text-xs">
                      <span className="text-emerald-100 font-medium">Exact Transfer Amount Due:</span>
                      <span className="font-extrabold text-[#B7FF00] text-base">{formatNaira(total)}</span>
                    </div>

                    {/* Transfer Instructions */}
                    {paymentSettings.transfer_instructions && (
                      <div className="sm:col-span-2 flex items-start gap-2 text-[11px] text-emerald-100 bg-[#0B3D20]/80 p-3 rounded-xl border border-emerald-800/40">
                        <Info className="w-4 h-4 text-[#B7FF00] shrink-0 mt-0.5" />
                        <span>{paymentSettings.transfer_instructions}</span>
                      </div>
                    )}

                    {/* Payment Reference Instructions */}
                    {paymentSettings.payment_reference_instructions && (
                      <div className="sm:col-span-2 flex items-start gap-2 text-[11px] text-emerald-100 bg-[#0B3D20]/60 p-3 rounded-xl border border-emerald-800/40">
                        <Sparkles className="w-4 h-4 text-[#B7FF00] shrink-0 mt-0.5" />
                        <span>{paymentSettings.payment_reference_instructions}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {user && profile?.status === 'restricted' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled
                  id="place-order-btn"
                  className="w-full bg-neutral-300 text-neutral-600 py-4 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <span>Place Order Disabled (Account Restricted)</span>
                </button>
                <p className="text-center text-[11px] text-amber-800 font-semibold">
                  Your account has restricted access. Please contact support to enable ordering.
                </p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading || !hasAnyPaymentMethod}
                id="place-order-btn"
                className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white py-4 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#16A34A]/25 hover:shadow-[#16A34A]/35 transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span>Placing your order...</span>
                ) : (
                  <>
                    <span>Place Order • {formatNaira(total)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </form>
        </div>

        {/* Right: Items Review */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
            <h3 className="font-bold text-[#052E16] text-base font-display pb-3 border-b border-emerald-100">
              Items in Your Order ({items.length})
            </h3>

            <div className="max-h-64 overflow-y-auto divide-y divide-emerald-50 pr-1">
              {items.map(({ foodItem, quantity, instructions }) => (
                <div key={foodItem.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] font-bold flex items-center justify-center shrink-0 border border-emerald-200">
                      {quantity}x
                    </div>
                    <div>
                      <p className="font-bold text-[#052E16] line-clamp-1">{foodItem.name}</p>
                      {instructions && (
                        <p className="text-[10px] text-neutral-400 italic">{instructions}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-extrabold text-[#052E16] shrink-0">
                    {formatNaira(foodItem.price * quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-emerald-100 space-y-2 text-xs text-emerald-950">
              <div className="flex justify-between">
                <span className="text-neutral-600">Subtotal</span>
                <span className="font-bold text-[#052E16]">{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Delivery Fee</span>
                <span className="font-bold text-[#052E16]">
                  {deliveryFee === 0 ? 'FREE' : formatNaira(deliveryFee)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#16A34A]">
                  <span>Promo Discount</span>
                  <span className="font-bold">-{formatNaira(discountAmount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-emerald-100 flex justify-between text-sm font-extrabold text-[#052E16]">
                <span>Total Amount Due</span>
                <span className="text-[#16A34A] text-base font-black">{formatNaira(total)}</span>
              </div>
            </div>

            <div className="p-3 bg-[#F0FDF4] rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
              <span>Safe and protected checkout session. Real-time driver dispatch.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
