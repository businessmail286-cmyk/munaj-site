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
import { formatNaira } from '../lib/supabase';

interface CartViewProps {
  setCurrentTab: (tab: ViewTab) => void;
}

export const CartView: React.FC<CartViewProps> = ({ setCurrentTab }) => {
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
        <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-neutral-900 font-display">
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
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all"
        >
          <span>Explore Delicious Menu</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
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
            className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-display">
            Your Food Tray ({items.reduce((a, b) => a + b.quantity, 0)} items)
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Tray
        </button>
      </div>

      {/* Free Delivery Bar */}
      {settings.free_delivery_threshold && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              {amountForFreeDelivery > 0 ? (
                <p className="text-xs font-semibold text-amber-900">
                  Add <span className="font-extrabold text-amber-800">{formatNaira(amountForFreeDelivery)}</span> more to qualify for <span className="underline">FREE DELIVERY</span>!
                </p>
              ) : (
                <p className="text-xs font-bold text-emerald-800">
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
              className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1">
                <img
                  src={foodItem.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'}
                  alt={foodItem.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-neutral-200 shrink-0"
                />
                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base text-neutral-900 leading-snug">
                    {foodItem.name}
                  </h3>
                  <p className="text-xs text-amber-600 font-semibold">
                    {formatNaira(foodItem.price)} each
                  </p>
                  {specialInstructions && (
                    <p className="text-[11px] text-neutral-500 italic bg-neutral-50 px-2 py-0.5 rounded-md inline-block">
                      Note: {specialInstructions}
                    </p>
                  )}
                </div>
              </div>

              {/* Quantity Stepper & Price */}
              <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                  <button
                    onClick={() => updateQuantity(foodItem.id, quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white text-neutral-700 flex items-center justify-center hover:bg-neutral-50 transition-colors shadow-xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-xs text-neutral-900 w-6 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(foodItem.id, quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-white text-neutral-700 flex items-center justify-center hover:bg-neutral-50 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-sm sm:text-base text-neutral-900">
                    {formatNaira(foodItem.price * quantity)}
                  </span>
                </div>

                <button
                  onClick={() => removeItem(foodItem.id)}
                  className="text-neutral-400 hover:text-rose-600 p-1.5 transition-colors"
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
              className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1"
            >
              <span>+ Add More Dishes from Menu</span>
            </button>
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-md space-y-6">
            <h3 className="font-bold text-neutral-900 text-lg font-display pb-3 border-b border-neutral-100">
              Order Summary
            </h3>

            {/* Subtotal & Fee Rows */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-neutral-600">
                <span>Tray Subtotal</span>
                <span className="font-bold text-neutral-900">{formatNaira(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-neutral-600">
                <span>Standard Delivery Fee</span>
                <span className="font-bold text-neutral-900">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase">Free</span>
                  ) : (
                    formatNaira(deliveryFee)
                  )}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon Discount</span>
                  </div>
                  <span className="font-bold">-{formatNaira(discountAmount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-base font-extrabold text-neutral-900">Total Due</span>
                <span className="text-xl font-extrabold text-amber-600">
                  {formatNaira(total)}
                </span>
              </div>
            </div>

            {/* Coupon Code Box */}
            <div className="pt-2 border-t border-neutral-100">
              {appliedPromo ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-bold">Coupon "{appliedPromo.promo_code || 'MUNAJPROMO'}" Active</p>
                      <p className="text-[10px] text-emerald-700">
                        {appliedPromo.discount}{appliedPromo.discount_type === 'percentage' ? '%' : '₦'} discount applied!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="p-1 text-emerald-700 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Promotional Coupon
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="e.g. MUNAJWEEKEND"
                      className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-neutral-50"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                  {couponMessage && (
                    <p className={`text-[11px] font-medium ${couponMessage.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {couponMessage.text}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Checkout CTA */}
            <button
              id="proceed-to-checkout-btn"
              onClick={() => {
                setCurrentTab('checkout');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all group"
            >
              <span>Proceed to Delivery & Checkout</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Payment on Delivery Assurance */}
            <div className="flex items-center gap-2.5 text-xs text-neutral-500 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Pay on delivery via Cash or Card on arrival</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
