import React, { createContext, useContext, useState, useEffect } from 'react';
import { FoodItem, CartItem, Promotion, WebsiteSettings } from '../types';
import { getWebsiteSettings, getPromotions } from '../lib/supabase';
import { DEFAULT_WEBSITE_SETTINGS } from '../data/defaults';
import { useToast } from './ToastContext';

interface CartContextType {
  items: CartItem[];
  addItem: (foodItem: FoodItem, quantity?: number, specialInstructions?: string) => void;
  removeItem: (foodItemId: string) => void;
  updateQuantity: (foodItemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  appliedPromo: Promotion | null;
  applyPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromoCode: () => void;
  total: number;
  settings: WebsiteSettings;
  refreshSettings: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'munaj_customer_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<WebsiteSettings>(DEFAULT_WEBSITE_SETTINGS);
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);

  // Load website settings
  const refreshSettings = async () => {
    try {
      const s = await getWebsiteSettings();
      setSettings(s);
    } catch (e) {
      console.warn('Could not load settings in cart context:', e);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save cart:', e);
    }
  }, [items]);

  const addItem = (foodItem: FoodItem, quantity = 1, specialInstructions?: string) => {
    if (!foodItem.available) {
      showToast('warning', 'Item Unavailable', `${foodItem.name} is currently out of stock.`);
      return;
    }

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.foodItem.id === foodItem.id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          specialInstructions: specialInstructions || updated[existingIndex].specialInstructions,
        };
        return updated;
      } else {
        return [...prevItems, { foodItem, quantity, specialInstructions }];
      }
    });

    showToast('success', 'Added to Cart', `${foodItem.name} (${quantity}x) added to your tray.`);
  };

  const removeItem = (foodItemId: string) => {
    const itemToRemove = items.find((i) => i.foodItem.id === foodItemId);
    setItems((prev) => prev.filter((i) => i.foodItem.id !== foodItemId));
    if (itemToRemove) {
      showToast('info', 'Item Removed', `${itemToRemove.foodItem.name} removed from your tray.`);
    }
  };

  const updateQuantity = (foodItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(foodItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.foodItem.id === foodItemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedPromo(null);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  };

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = items.reduce(
    (acc, item) => acc + item.foodItem.price * item.quantity,
    0
  );

  // Delivery fee logic
  const isFreeDelivery =
    settings.free_delivery_threshold &&
    subtotal >= settings.free_delivery_threshold &&
    subtotal > 0;

  const deliveryFee = items.length === 0 ? 0 : isFreeDelivery ? 0 : settings.delivery_fee || 1500;

  // Calculate promo discount
  let discountAmount = 0;
  if (appliedPromo && subtotal > 0) {
    if (appliedPromo.discount_type === 'percentage') {
      discountAmount = Math.round((subtotal * appliedPromo.discount) / 100);
    } else {
      discountAmount = Math.min(subtotal, appliedPromo.discount);
    }
  }

  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  const applyPromoCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Please enter a valid coupon code.' };
    }

    try {
      const promotions = await getPromotions();
      const match = promotions.find(
        (p) => p.active && (p.promo_code?.toUpperCase() === cleanCode || p.title.toUpperCase().includes(cleanCode))
      );

      if (match) {
        setAppliedPromo(match);
        showToast('success', 'Coupon Applied!', `You unlocked ${match.discount}${match.discount_type === 'percentage' ? '%' : '₦'} off!`);
        return { success: true, message: `Promo code "${cleanCode}" applied successfully!` };
      } else {
        return { success: false, message: 'Invalid or expired promotional code.' };
      }
    } catch (e) {
      return { success: false, message: 'Failed to validate promo code.' };
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    showToast('info', 'Promo Removed', 'Discount coupon has been removed.');
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        deliveryFee,
        discountAmount,
        appliedPromo,
        applyPromoCode,
        removePromoCode,
        total,
        settings,
        refreshSettings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
