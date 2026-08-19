import React, { useState } from 'react';
import { Plus, Check, Eye, Flame, AlertCircle } from 'lucide-react';
import { FoodItem } from '../types';
import { formatNaira } from '../lib/supabase';
import { useCart } from '../context/CartContext';

interface FoodCardProps {
  food: FoodItem;
  onOpenDetails: (food: FoodItem) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ food, onOpenDetails }) => {
  const { addItem, items } = useCart();
  const [imageError, setImageError] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);

  const cartItem = items.find((i) => i.foodItem.id === food.id);
  const inCartCount = cartItem?.quantity || 0;

  const isAvailable = food.is_available !== undefined ? Boolean(food.is_available) : Boolean(food.available);
  const isFeatured = food.is_featured !== undefined ? Boolean(food.is_featured) : Boolean(food.featured);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;

    addItem(food, 1);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1200);
  };

  const fallbackImage =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      id={`food-card-${food.id}`}
      onClick={() => onOpenDetails(food)}
      className="group bg-white rounded-2xl border border-emerald-100/90 hover:border-[#16A34A] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
    >
      {/* Image Wrap */}
      <div className="relative aspect-4/3 w-full bg-emerald-50/50 overflow-hidden">
        <img
          src={imageError || !food.image_url ? fallbackImage : food.image_url}
          alt={food.name}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            !isAvailable ? 'grayscale opacity-60' : ''
          }`}
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isFeatured && (
            <span className="bg-[#052E16] text-[#B7FF00] border border-[#16A34A]/50 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
              <Flame className="w-3 h-3 text-[#B7FF00] fill-[#B7FF00]" /> Special
            </span>
          )}
          {food.category_name && (
            <span className="bg-[#052E16]/85 backdrop-blur-xs text-[#F0FDF4] text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-800/40">
              {food.category_name}
            </span>
          )}
        </div>

        {/* Quick View Button on Hover */}
        <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 backdrop-blur-xs text-[#052E16] text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform border border-emerald-100">
            <Eye className="w-3.5 h-3.5 text-[#16A34A]" /> View Details
          </span>
        </div>

        {/* Unavailable overlay badge */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-[2px] flex items-center justify-center p-3 text-center">
            <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Currently Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-bold text-[#052E16] text-base group-hover:text-[#16A34A] transition-colors line-clamp-1 leading-snug">
            {food.name}
          </h3>

          <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2 leading-relaxed">
            {food.description || 'Prepared fresh with authentic native ingredients and traditional seasoning.'}
          </p>
        </div>

        {/* Price & Action */}
        <div className="mt-4 pt-3.5 border-t border-emerald-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-emerald-700/70 font-bold">Price</span>
            <span className="font-black text-[#052E16] text-lg sm:text-xl">
              {formatNaira(food.price)}
            </span>
          </div>

          <div>
            {isAvailable ? (
              <button
                id={`add-to-cart-${food.id}`}
                onClick={handleQuickAdd}
                className={`relative flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  addedAnim
                    ? 'bg-[#16A34A] text-white scale-105'
                    : inCartCount > 0
                    ? 'bg-[#052E16] text-[#B7FF00] hover:bg-[#0B3D20] border border-[#16A34A]/40'
                    : 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm'
                }`}
              >
                {addedAnim ? (
                  <>
                    <Check className="w-4 h-4 text-[#B7FF00]" /> Added
                  </>
                ) : inCartCount > 0 ? (
                  <>
                    <span>In Tray ({inCartCount})</span>
                    <Plus className="w-3.5 h-3.5 text-[#B7FF00]" />
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-white" />
                    <span>Add</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-xs font-semibold text-neutral-400 py-2 px-3 bg-neutral-100 rounded-xl">
                Currently Unavailable
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
