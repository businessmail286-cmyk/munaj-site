import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Flame, AlertCircle, Sparkles } from 'lucide-react';
import { FoodItem } from '../types';
import { formatNaira } from '../lib/supabase';
import { useCart } from '../context/CartContext';

interface FoodModalProps {
  food: FoodItem | null;
  onClose: () => void;
}

export const FoodModal: React.FC<FoodModalProps> = ({ food, onClose }) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [imgError, setImgError] = useState(false);

  if (!food) return null;

  const isAvailable = food.is_available !== undefined ? Boolean(food.is_available) : Boolean(food.available);
  const isFeatured = food.is_featured !== undefined ? Boolean(food.is_featured) : Boolean(food.featured);

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addItem(food, quantity, specialInstructions);
    onClose();
  };

  const totalPrice = food.price * quantity;
  const fallbackImage =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-neutral-200 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-neutral-900/70 hover:bg-neutral-900 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Large Image Header */}
        <div className="relative aspect-16/9 sm:aspect-21/9 w-full bg-neutral-100 overflow-hidden">
          <img
            src={imgError || !food.image_url ? fallbackImage : food.image_url}
            alt={food.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent"></div>

          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {isFeatured && (
                <span className="bg-[#052E16] text-[#B7FF00] border border-[#16A34A]/50 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                  <Flame className="w-3.5 h-3.5 text-[#B7FF00] fill-[#B7FF00]" /> Signature Dish
                </span>
              )}
              {food.category_name && (
                <span className="bg-[#052E16]/85 backdrop-blur-xs text-[#F0FDF4] text-xs font-semibold px-3 py-1 rounded-full border border-emerald-800/40">
                  {food.category_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <h2 className="text-2xl font-bold text-[#052E16] font-display">
                {food.name}
              </h2>
              <span className="text-2xl font-black text-[#16A34A]">
                {formatNaira(food.price)}
              </span>
            </div>

            <p className="text-neutral-600 text-sm leading-relaxed mt-3">
              {food.description ||
                'Prepared freshly by seasoned Nigerian chefs using farm-fresh ingredients, local spices, and traditional techniques.'}
            </p>
          </div>

          {/* Availability Alert */}
          {!isAvailable ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Currently Unavailable</p>
                <p className="text-xs text-rose-700">
                  This dish has sold out for today. Please explore our other delicious selections.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-bold text-[#052E16] uppercase tracking-wider mb-2">
                  Special Instructions / Preferences (Optional)
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Mild pepper, extra crispy fried plantain, deliver with extra napkins, etc."
                  rows={2}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-emerald-200 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden transition-all resize-none bg-[#F0FDF4]/40"
                />
              </div>

              {/* Quantity and CTA */}
              <div className="pt-4 border-t border-emerald-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Quantity stepper */}
                <div className="flex items-center gap-3 bg-[#F0FDF4] p-1.5 rounded-2xl border border-emerald-200 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-9 rounded-xl bg-white text-[#052E16] flex items-center justify-center font-bold shadow-xs hover:bg-emerald-50 disabled:opacity-40 transition-all border border-emerald-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-black text-base text-[#052E16] px-3">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 rounded-xl bg-white text-[#052E16] flex items-center justify-center font-bold shadow-xs hover:bg-emerald-50 transition-all border border-emerald-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Tray CTA */}
                <button
                  id="modal-add-to-cart-btn"
                  onClick={handleAddToCart}
                  className="w-full sm:flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/15 hover:shadow-xl transition-all"
                >
                  <ShoppingBag className="w-4 h-4 text-[#B7FF00]" />
                  <span>Add to Tray • {formatNaira(totalPrice)}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
