import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Tag,
  ShieldCheck,
  Truck,
  ChevronLeft,
  X,
} from 'lucide-react';
import { ViewTab } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatNaira } from '../lib/supabase';
import { AccountRestrictedBanner } from '../components/AccountRestrictedBanner';

interface CartViewProps {
  setCurrentTab: (tab: ViewTab) => void;
}

export const CartView: React.FC<CartViewProps> = ({ setCurrentTab }) => {
  const { user, profile } = useAuth();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    deliveryFee,
    discountAmount,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    total,
    settings,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ success: boolean; text: string } | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMessage(null);

    const res = await applyPromoCode(couponInput.trim());
    setCouponMessage({ success: res.success, text: res.message });
    setCouponLoading(false);
  };

  const amountForFreeDelivery = settings.free_delivery_threshold
    ? Math.max(0, settings.free_delivery_threshold - subtotal)
    : 0;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mx-auto shadow-sm border border-emerald-200">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-[#052E16] font-display">
            Your Food Tray is Empty
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
            You haven't added any authentic Nigerian delicacies to your tray yet. Explore our freshly cooked firewood party jollof, soups, and suya!
          </p>
        </div>
        <button
          onClick={() => {
            setCurrentTab('menu');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white px-6 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          <span>Explore Delicious Menu</span>
          <ArrowRight className="w-4 h-4 text-[#B7FF00]" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('menu')}
            className="p-2 rounded-xl border border-emerald-200 hover:bg-[#F0FDF4] text-emerald-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#052E16] font-display">
            Your Food Tray ({items.reduce((a, b) => a + b.quantity, 0)} items)
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Tray
        </button>
      </div>

      {/* Free Delivery Bar */}
      {settings.free_delivery_threshold && (
        <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              {amountForFreeDelivery > 0 ? (
                <p className="text-xs font-semibold text-[#0B3D20]">
                  Add <span className="font-extrabold text-[#16A34A]">{formatNaira(amountForFreeDelivery)}</span> more to qualify for <span className="underline font-bold">FREE DELIVERY</span>!
                </p>
              ) : (
                <p className="text-xs font-bold text-[#16A34A]">
                  🎉 Congratulations! You have unlocked FREE DELIVERY on this order!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map(({ foodItem, quantity, specialInstructions }) => (
            <div
              key={foodItem.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1">
                <img
                  src={foodItem.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'}
                  alt={foodItem.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-emerald-100 shrink-0"
                />
                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base text-[#052E16] leading-snug">
                    {foodItem.name}
                  </h3>
                  <p className="text-xs text-[#16A34A] font-semibold">
                    {formatNaira(foodItem.price)} each
                  </p>
                  {specialInstructions && (
                    <p className="text-[11px] text-neutral-500 italic bg-[#F0FDF4] px-2 py-0.5 rounded-md inline-block border border-emerald-100">
                      Note: {specialInstructions}
                    </p>
                  )}
                </div>
              </div>

              {/* Quantity Stepper & Price */}
              <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-emerald-50">
                <div className="flex items-center gap-2 bg-[#F0FDF4] p-1 rounded-xl border border-emerald-200">
                  <button
                    onClick={() => updateQuantity(foodItem.id, quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white text-[#052E16] flex items-center justify-center hover:bg-emerald-100 transition-colors shadow-xs cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-xs text-[#052E16] w-6 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(foodItem.id, quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-white text-[#052E16] flex items-center justify-center hover:bg-emerald-100 transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-sm sm:text-base text-[#052E16]">
                    {formatNaira(foodItem.price * quantity)}
                  </span>
                </div>

                <button
                  onClick={() => removeItem(foodItem.id)}
                  className="text-neutral-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Continue Shopping Button */}
          <div className="pt-2">
            <button
              onClick={() => {
                setCurrentTab('menu');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs font-bold text-[#16A34A] hover:text-[#15803D] flex items-center gap-1 cursor-pointer"
            >
              <span>+ Add More Dishes from Menu</span>
            </button>
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-md space-y-6">
            <h3 className="font-bold text-[#052E16] text-lg font-display pb-3 border-b border-emerald-100">
              Order Summary
            </h3>

            {/* Subtotal & Fee Rows */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-neutral-600">
                <span>Tray Subtotal</span>
                <span className="font-bold text-[#052E16]">{formatNaira(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-neutral-600">
                <span>Standard Delivery Fee</span>
                <span className="font-bold text-[#052E16]">
                  {deliveryFee === 0 ? (
                    <span className="text-[#16A34A] font-bold uppercase">Free</span>
                  ) : (
                    formatNaira(deliveryFee)
                  )}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-[#16A34A] bg-[#F0FDF4] p-2.5 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon Discount</span>
                  </div>
                  <span className="font-bold">-{formatNaira(discountAmount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-emerald-100 flex items-center justify-between">
                <span className="text-base font-extrabold text-[#052E16]">Total Due</span>
                <span className="text-xl font-extrabold text-[#16A34A]">
                  {formatNaira(total)}
                </span>
              </div>
            </div>

            {/* Coupon Code Box */}
            <div className="pt-2 border-t border-emerald-100">
              {appliedPromo ? (
                <div className="flex items-center justify-between bg-[#F0FDF4] border border-emerald-200 p-3 rounded-xl text-xs text-[#0B3D20]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#16A34A]" />
                    <div>
                      <p className="font-bold">Coupon "{appliedPromo.promo_code || 'MUNAJPROMO'}" Active</p>
                      <p className="text-[10px] text-[#16A34A]">
                        {appliedPromo.discount}{appliedPromo.discount_type === 'percentage' ? '%' : '₦'} discount applied!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="p-1 text-neutral-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                    Promotional Coupon
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="e.g. MUNAJWEEKEND"
                      className="flex-1 px-3 py-2 rounded-xl border border-emerald-200 text-xs focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden bg-[#F0FDF4]/30 text-[#052E16]"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="bg-[#052E16] hover:bg-[#0B3D20] text-[#B7FF00] px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponMessage && (
                    <p className={`text-[11px] font-medium ${couponMessage.success ? 'text-[#16A34A]' : 'text-rose-600'}`}>
                      {couponMessage.text}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Account Restricted Notice if User is Restricted */}
            {user && profile?.status === 'restricted' ? (
              <div className="space-y-3">
                <AccountRestrictedBanner
                  onContactSupport={() => {
                    setCurrentTab('account');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
                <button
                  disabled
                  className="w-full bg-neutral-300 text-neutral-600 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <span>Checkout Disabled (Account Restricted)</span>
                </button>
              </div>
            ) : (
              /* Checkout CTA */
              <button
                id="proceed-to-checkout-btn"
                onClick={() => {
                  setCurrentTab('checkout');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#16A34A]/20 hover:shadow-[#16A34A]/30 transition-all group cursor-pointer"
              >
                <span>Proceed to Delivery & Checkout</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Payment on Delivery Assurance */}
            <div className="flex items-center gap-2.5 text-xs text-emerald-800 bg-[#F0FDF4] p-3 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>Pay on delivery via Cash or Card on arrival</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
