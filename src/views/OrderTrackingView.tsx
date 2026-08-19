import React, { useEffect, useState } from 'react';
import {
  Package,
  Calendar,
  Phone,
  MapPin,
  CheckCircle2,
  ChefHat,
  Bike,
  Home,
  Headphones,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  CreditCard,
  Banknote,
  Building2,
  Info,
  Clock,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { Order, ViewTab, OrderStatus, PaymentSettings } from '../types';
import { OrderProgress } from '../components/OrderProgress';
import { supabase, getOrderById, formatNaira, getPaymentSettings, confirmBankTransferPayment, formatPaymentMethodForDisplay } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { DEFAULT_PAYMENT_SETTINGS } from '../data/defaults';

interface OrderTrackingViewProps {
  order: Order | null;
  setCurrentTab: (tab: ViewTab) => void;
  onOpenSupportWithOrder?: (orderNumber: string) => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  order: initialOrder,
  setCurrentTab,
  onOpenSupportWithOrder,
}) => {
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [copied, setCopied] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmingTransfer, setConfirmingTransfer] = useState(false);
  const [transferSubmitted, setTransferSubmitted] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);

  // Sync state if prop changes
  useEffect(() => {
    if (initialOrder) {
      setOrder(initialOrder);
    }
  }, [initialOrder]);

  // Load payment settings from public.payment_settings and subscribe to updates
  useEffect(() => {
    let isMounted = true;
    getPaymentSettings().then((s) => {
      if (isMounted && s) setPaymentSettings(s);
    });

    const settingsChannel = supabase
      .channel('public:payment_settings_tracking')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_settings' },
        async () => {
          const fresh = await getPaymentSettings();
          if (isMounted && fresh) setPaymentSettings(fresh);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  // Set up Supabase Realtime subscription for this specific order
  useEffect(() => {
    if (!order?.id) return;

    const channel = supabase
      .channel(`public:orders:order_${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated) {
            const newStatus = (updated.status || updated.order_status || 'Pending') as OrderStatus;
            const newPayStatus = updated.payment_status || order.payment_status;

            setOrder((prev) =>
              prev
                ? {
                    ...prev,
                    status: newStatus,
                    order_status: newStatus,
                    payment_status: newPayStatus,
                    rider_id: updated.rider_id || prev.rider_id,
                    updated_at: updated.updated_at,
                  }
                : null
            );

            if (newPayStatus === 'paid') {
              showToast('success', 'Payment Confirmed!', 'Your bank transfer has been verified and approved by the restaurant.');
            } else if (newPayStatus === 'rejected') {
              showToast('error', 'Payment Notice', 'Bank transfer verification could not be confirmed. Please check with support.');
            } else {
              showToast('info', 'Order Status Updated', `Status is now: ${newStatus}`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id, showToast]);

  const handleManualRefresh = async () => {
    if (!order?.id) return;
    setRefreshing(true);
    const updated = await getOrderById(order.id);
    if (updated) {
      setOrder(updated);
      showToast('info', 'Status Refreshed', 'Order status is up to date.');
    }
    setRefreshing(false);
  };

  const handleCopyOrderNumber = () => {
    if (!order) return;
    navigator.clipboard?.writeText(order.order_number);
    setCopied(true);
    showToast('info', 'Copied!', 'Order number copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAccountNumber = () => {
    if (paymentSettings?.account_number) {
      navigator.clipboard.writeText(paymentSettings.account_number);
      setCopiedAccount(true);
      showToast('info', 'Account number copied!', `${paymentSettings.bank_name} account number copied.`);
      setTimeout(() => setCopiedAccount(false), 3000);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!order?.id) return;
    setConfirmingTransfer(true);

    try {
      const res = await confirmBankTransferPayment(order.id);
      if (res.success) {
        setTransferSubmitted(true);
        setOrder((prev) => (prev ? { ...prev, payment_status: 'pending' } : null));
        showToast(
          'success',
          'Transfer Confirmation Received',
          'Thank you! Our accounting team is verifying your payment and your meal preparation will proceed shortly.'
        );
      } else {
        showToast('error', 'Submission Failed', res.error || 'Please try again or contact support.');
      }
    } catch (err: any) {
      showToast('error', 'Error', err.message || 'Failed to submit payment confirmation.');
    } finally {
      setConfirmingTransfer(false);
    }
  };

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <Package className="w-12 h-12 text-emerald-400 mx-auto" />
        <h2 className="text-xl font-bold text-[#052E16]">No active order selected</h2>
        <p className="text-xs text-neutral-500">
          You can track orders from your account dashboard or by placing a new order.
        </p>
        <button
          onClick={() => setCurrentTab('menu')}
          className="bg-[#16A34A] hover:bg-[#15803D] text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  const isBankTransfer =
    order.payment_method?.toLowerCase() === 'bank transfer' ||
    order.payment_method?.toLowerCase() === 'bank_transfer' ||
    order.payment_method?.toLowerCase() === 'transfer';
  const isPaid = order.payment_status?.toLowerCase() === 'paid';
  const isRejected = order.payment_status?.toLowerCase() === 'rejected' || order.payment_status?.toLowerCase() === 'failed';
  const isPendingVerification = isBankTransfer && !isPaid && !isRejected;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#052E16] via-[#0B3D20] to-[#071A0E] text-white rounded-3xl p-6 sm:p-8 border border-[#16A34A]/30 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#0B3D20]">
          <div>
            <span className="text-[11px] font-bold text-[#B7FF00] uppercase tracking-widest block mb-1">
              Live Order Tracker
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
                #{order.order_number}
              </h1>
              <button
                onClick={handleCopyOrderNumber}
                className="p-1.5 rounded-lg bg-[#071A0E] hover:bg-[#0B3D20] text-neutral-300 transition-colors text-xs flex items-center gap-1 cursor-pointer border border-[#16A34A]/20"
                title="Copy order number"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#B7FF00]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-emerald-200 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })} at{' '}
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-[#071A0E] hover:bg-[#0B3D20] text-[#B7FF00] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#16A34A]/30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Real-time Order Progress Stepper */}
        <div>
          <OrderProgress status={order.order_status} />
        </div>
      </div>

      {/* BANK TRANSFER INSTRUCTIONS & VERIFICATION CARD */}
      {isBankTransfer && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0 border border-emerald-200">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#052E16] text-base font-display">
                  Bank Transfer Details & Payment Status
                </h3>
                <p className="text-xs text-neutral-500">
                  Direct transfer to the official MUNAJ Kitchen account.
                </p>
              </div>
            </div>

            {/* Payment Status Badge */}
            <div>
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-[#16A34A] font-extrabold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  Payment Verified & Paid
                </span>
              ) : isRejected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 font-extrabold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Payment Rejected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0FDF4] text-[#0B3D20] font-extrabold text-xs border border-emerald-200">
                  <Clock className="w-4 h-4 text-[#16A34A] animate-pulse" />
                  Awaiting Payment Verification
                </span>
              )}
            </div>
          </div>

          {/* Transfer Instruction Notice */}
          {!isPaid && !isRejected && (
            <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200 text-[#0B3D20] text-xs flex items-start gap-3">
              <Info className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm">
                  Transfer the exact amount to the bank account above.
                </p>
                <p className="text-neutral-600 text-xs leading-relaxed">
                  Please initiate a bank transfer for <strong className="text-[#052E16]">{formatNaira(order.total)}</strong>. After sending, click the <strong>"I Have Made the Transfer"</strong> button below so our cashier can verify and dispatch your food immediately.
                </p>
              </div>
            </div>
          )}

          {/* Account Details Box */}
          <div className="bg-gradient-to-br from-[#052E16] to-[#0B3D20] text-white rounded-2xl p-5 sm:p-6 space-y-4 border border-[#16A34A]/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[11px] text-emerald-200 block">Bank Name</span>
                <span className="font-bold text-white text-sm">
                  {paymentSettings.bank_name || 'Access Bank'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-emerald-200 block">Account Name</span>
                <span className="font-bold text-white text-sm">
                  {paymentSettings.account_name || 'MUNAJ FOODS'}
                </span>
              </div>

              <div className="sm:col-span-2 p-3.5 bg-[#071A0E] rounded-xl border border-[#16A34A]/30 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-[#B7FF00] uppercase font-bold block">
                    Account Number
                  </span>
                  <span className="font-mono font-extrabold text-lg sm:text-xl tracking-wider text-white">
                    {paymentSettings.account_number || '1234567890'}
                  </span>
                </div>
                <button
                  type="button"
                  id="tracking-copy-account-btn"
                  onClick={handleCopyAccountNumber}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#052E16] hover:bg-[#0B3D20] text-[#B7FF00] text-xs font-bold transition-all cursor-pointer shadow-xs border border-[#16A34A]/40"
                >
                  {copiedAccount ? (
                    <>
                      <Check className="w-4 h-4 text-[#B7FF00]" />
                      <span className="text-[#B7FF00]">Account number copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Account Number</span>
                    </>
                  )}
                </button>
              </div>

              <div className="sm:col-span-2 p-3 bg-[#16A34A]/15 rounded-xl border border-[#16A34A]/30 flex items-center justify-between text-xs">
                <span className="text-emerald-200 font-medium">Exact Transfer Amount Due:</span>
                <span className="font-extrabold text-[#B7FF00] text-base">{formatNaira(order.total)}</span>
              </div>

              {paymentSettings.transfer_instructions && (
                <div className="sm:col-span-2 text-[11px] text-neutral-300 bg-[#071A0E]/60 p-3 rounded-xl border border-[#16A34A]/20">
                  {paymentSettings.transfer_instructions}
                </div>
              )}
            </div>
          </div>

          {/* Customer Action Button: "I Have Made the Transfer" */}
          {!isPaid && !isRejected && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-neutral-500">
                {isPendingVerification ? (
                  <span className="text-[#16A34A] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                    Transfer marked for verification. Awaiting restaurant cashier confirmation.
                  </span>
                ) : (
                  <span>Click below once you have completed the bank transfer in your banking app.</span>
                )}
              </div>

              <button
                type="button"
                id="i-have-transferred-btn"
                onClick={handleConfirmTransfer}
                disabled={confirmingTransfer || isPendingVerification}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                  isPendingVerification
                    ? 'bg-[#F0FDF4] text-emerald-800 border border-emerald-200 cursor-default'
                    : 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-[#16A34A]/20'
                }`}
              >
                {confirmingTransfer ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Confirmation...</span>
                  </>
                ) : isPendingVerification ? (
                  <>
                    <Check className="w-4 h-4 text-[#16A34A]" />
                    <span>Transfer Confirmation Sent</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>I Have Made the Transfer</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Details */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <h3 className="font-bold text-[#052E16] text-base font-display pb-3 border-b border-emerald-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#16A34A]" />
            <span>Delivery Information</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Recipient</span>
              <span className="font-bold text-[#052E16] text-sm">{order.customer_name}</span>
            </div>

            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Contact Phone</span>
              <span className="font-bold text-[#052E16]">{order.customer_phone}</span>
            </div>

            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Drop-off Address</span>
              <span className="text-neutral-700 leading-relaxed font-medium">{order.delivery_address}</span>
            </div>

            {order.delivery_notes && (
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Special Instructions</span>
                <span className="text-neutral-600 italic">{order.delivery_notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-4">
          <h3 className="font-bold text-[#052E16] text-base font-display pb-3 border-b border-emerald-100 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-[#16A34A]" />
            <span>Payment Breakdown</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>Payment Mode</span>
              <span className="font-bold text-[#052E16]">{formatPaymentMethodForDisplay(order.payment_method)}</span>
            </div>

            <div className="flex justify-between text-neutral-600">
              <span>Payment Status</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-md ${
                  isPaid
                    ? 'text-[#16A34A] bg-emerald-50 border border-emerald-200'
                    : isRejected
                    ? 'text-rose-700 bg-rose-50 border border-rose-200'
                    : 'text-[#0B3D20] bg-[#F0FDF4] border border-emerald-200'
                }`}
              >
                {order.payment_status || 'Pending'}
              </span>
            </div>

            <div className="flex justify-between text-neutral-600">
              <span>Food Subtotal</span>
              <span className="font-bold text-[#052E16]">{formatNaira(order.subtotal)}</span>
            </div>

            <div className="flex justify-between text-neutral-600">
              <span>Delivery Fee</span>
              <span className="font-bold text-[#052E16]">
                {order.delivery_fee === 0 ? 'FREE' : formatNaira(order.delivery_fee)}
              </span>
            </div>

            <div className="pt-2 border-t border-emerald-100 flex justify-between text-sm font-extrabold text-[#052E16]">
              <span>Total Amount</span>
              <span className="text-[#16A34A]">{formatNaira(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Items List */}
      {order.items && order.items.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-4">
          <h3 className="font-bold text-[#052E16] text-base font-display pb-3 border-b border-emerald-100">
            Ordered Delicacies ({order.items.length})
          </h3>

          <div className="divide-y divide-emerald-50">
            {order.items.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] border border-emerald-200 font-bold flex items-center justify-center text-xs shrink-0">
                    {item.quantity}x
                  </div>
                  <div>
                    <span className="font-bold text-[#052E16] block">{item.food_name}</span>
                    <span className="text-xs text-neutral-400">{formatNaira(item.unit_price)} each</span>
                  </div>
                </div>
                <span className="font-extrabold text-[#052E16]">
                  {formatNaira(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help & Support Actions */}
      <div className="p-6 rounded-3xl bg-[#F0FDF4] border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-white text-[#16A34A] flex items-center justify-center shrink-0 shadow-xs border border-emerald-200">
            <Headphones className="w-5 h-5 text-[#16A34A]" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#052E16]">Need Help with This Order?</h4>
            <p className="text-xs text-neutral-600">
              Our 24/7 kitchen and delivery support team is ready to assist you.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              if (onOpenSupportWithOrder) {
                onOpenSupportWithOrder(order.order_number);
              } else {
                setCurrentTab('contact');
              }
            }}
            className="w-full sm:w-auto bg-[#052E16] hover:bg-[#0B3D20] text-[#B7FF00] px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-[#16A34A]/30"
          >
            Contact Support
          </button>
          <button
            onClick={() => setCurrentTab('menu')}
            className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803D] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Order More
          </button>
        </div>
      </div>
    </div>
  );
};
