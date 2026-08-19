import React, { useState, useEffect } from 'react';
import {
  Category,
  FoodItem,
  Promotion,
  Announcement,
  Testimonial,
  WebsiteSettings,
  ViewTab,
  Order,
} from './types';
import {
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORIES,
  DEFAULT_FOOD_ITEMS,
  DEFAULT_ANNOUNCEMENTS,
} from './data/defaults';
import {
  supabase,
  getCategories,
  getFoodItems,
  getWebsiteSettings,
  getPromotions,
  getAnnouncements,
  getTestimonials,
} from './lib/supabase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FoodModal } from './components/FoodModal';
import { AuthModal } from './components/AuthModal';
import { MunajLoadingScreen } from './components/MunajLoadingScreen';
import { AccountSuspendedScreen } from './components/AccountSuspendedScreen';

import { HomeView } from './views/HomeView';
import { MenuView } from './views/MenuView';
import { CartView } from './views/CartView';
import { CheckoutView } from './views/CheckoutView';
import { OrderTrackingView } from './views/OrderTrackingView';
import { AccountView } from './views/AccountView';
import { AboutView } from './views/AboutView';
import { ContactView } from './views/ContactView';
import { ShoppingBag } from 'lucide-react';
import { formatNaira } from './lib/supabase';

// Main Application Inner Component
const MunajApp: React.FC = () => {
  const { itemCount, total } = useCart();
  const { showToast } = useToast();
  const { user, profile, authLoadingActive, authLoadingMode, finishAuthLoading } = useAuth();

  // If the user's status is banned, prevent normal usage and immediately display Account Suspended screen
  if (user && profile?.status === 'banned' && !authLoadingActive) {
    return <AccountSuspendedScreen />;
  }

  const [currentTab, setCurrentTab] = useState<ViewTab>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [foodItems, setFoodItems] = useState<FoodItem[]>(DEFAULT_FOOD_ITEMS);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings>(DEFAULT_SETTINGS);
  const [loadingData, setLoadingData] = useState(false);

  // Modals state
  const [activeFoodModal, setActiveFoodModal] = useState<FoodItem | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultMode, setAuthDefaultMode] = useState<'login' | 'register'>('login');

  // Active Order for Tracking
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [prefilledSupportOrder, setPrefilledSupportOrder] = useState<string | null>(null);

  // Initial Fetch & Realtime Listeners
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [cats, foods, sets, promos, tests, anncs] = await Promise.all([
          getCategories(),
          getFoodItems(),
          getWebsiteSettings(),
          getPromotions(),
          getTestimonials(),
          getAnnouncements(),
        ]);

        if (cats && cats.length > 0) setCategories(cats);
        if (foods && foods.length > 0) setFoodItems(foods);
        if (sets) setSettings(sets);
        if (promos && promos.length > 0) setPromotions(promos);
        if (tests && tests.length > 0) setTestimonials(tests);
        setAnnouncements(anncs || []);
      } catch (err) {
        console.warn('Initial data load warning:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();

    // Subscribe to Realtime food item changes
    const foodChannel = supabase
      .channel('public:food_items_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'food_items' },
        async () => {
          const freshFoods = await getFoodItems();
          if (freshFoods && freshFoods.length > 0) setFoodItems(freshFoods);
        }
      )
      .subscribe();

    // Subscribe to Realtime announcements changes from Admin Panel
    const announcementChannel = supabase
      .channel('public:announcements_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        async () => {
          const freshAnncs = await getAnnouncements();
          setAnnouncements(freshAnncs || []);
        }
      )
      .subscribe();

    // Subscribe to Realtime settings changes from Admin Panel
    const settingsChannel = supabase
      .channel('public:settings_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        async () => {
          const freshSettings = await getWebsiteSettings();
          if (freshSettings) setSettings(freshSettings);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(foodChannel);
      supabase.removeChannel(announcementChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    setCurrentTab('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderPlaced = (order: Order) => {
    setActiveOrder(order);
    setCurrentTab('order-tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTrackOrderFromAccount = (order: Order) => {
    setActiveOrder(order);
    setCurrentTab('order-tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSupportWithOrder = (orderNumber: string) => {
    setPrefilledSupportOrder(orderNumber);
    setCurrentTab('account');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F0FDF4]/50 text-neutral-900 selection:bg-[#B7FF00] selection:text-[#052E16] font-sans antialiased">
      {/* Global Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        settings={settings}
        openAuthModal={() => {
          setAuthDefaultMode('login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Main Content Router */}
      <main className="flex-1 pb-16">
        {currentTab === 'home' && (
          <HomeView
            settings={settings}
            categories={categories}
            foodItems={foodItems}
            promotions={promotions}
            announcements={announcements}
            testimonials={testimonials}
            setCurrentTab={setCurrentTab}
            onSelectCategory={handleSelectCategory}
            onOpenFoodModal={(food) => setActiveFoodModal(food)}
          />
        )}

        {currentTab === 'menu' && (
          <MenuView
            categories={categories}
            foodItems={foodItems}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onOpenFoodModal={(food) => setActiveFoodModal(food)}
            loading={loadingData}
          />
        )}

        {currentTab === 'cart' && (
          <CartView setCurrentTab={setCurrentTab} />
        )}

        {currentTab === 'checkout' && (
          <CheckoutView
            setCurrentTab={setCurrentTab}
            onOrderPlaced={handleOrderPlaced}
            openAuthModal={() => {
              setAuthDefaultMode('login');
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {currentTab === 'order-tracking' && (
          <OrderTrackingView
            order={activeOrder}
            setCurrentTab={setCurrentTab}
            onOpenSupportWithOrder={handleOpenSupportWithOrder}
          />
        )}

        {(currentTab === 'account' || currentTab === 'support') && (
          <AccountView
            setCurrentTab={setCurrentTab}
            onTrackOrder={handleTrackOrderFromAccount}
            openAuthModal={() => {
              setAuthDefaultMode('login');
              setIsAuthModalOpen(true);
            }}
            initialAccountTab={currentTab === 'support' ? 'support' : 'orders'}
            prefilledSupportOrder={prefilledSupportOrder}
          />
        )}

        {currentTab === 'about' && (
          <AboutView settings={settings} setCurrentTab={setCurrentTab} />
        )}

        {currentTab === 'contact' && (
          <ContactView
            settings={settings}
            setCurrentTab={setCurrentTab}
            openAuthModal={() => {
              setAuthDefaultMode('login');
              setIsAuthModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Floating Tray Indicator (Mobile / Quick Desktop Access) */}
      {itemCount > 0 && currentTab !== 'cart' && currentTab !== 'checkout' && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-6 duration-300">
          <button
            id="floating-cart-btn"
            onClick={() => {
              setCurrentTab('cart');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 bg-[#052E16] hover:bg-[#0B3D20] text-white pl-4 pr-5 py-3.5 rounded-2xl shadow-2xl border border-[#16A34A]/40 group transition-all transform hover:-translate-y-0.5"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-[#B7FF00] text-[#052E16] flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#16A34A] text-white text-[11px] font-extrabold flex items-center justify-center border-2 border-[#052E16]">
                {itemCount}
              </span>
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#B7FF00]">
                Food Tray
              </p>
              <p className="text-xs sm:text-sm font-extrabold text-white">
                {formatNaira(total)}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Global Footer */}
      <Footer settings={settings} setCurrentTab={setCurrentTab} />

      {/* Food Details & Customization Modal */}
      {activeFoodModal && (
        <FoodModal
          food={activeFoodModal}
          onClose={() => setActiveFoodModal(null)}
        />
      )}

      {/* Supabase Customer Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authDefaultMode}
      />

      {/* 15-second Premium Post-Auth Loading Screen */}
      {authLoadingActive && (
        <MunajLoadingScreen
          mode={authLoadingMode}
          onComplete={() => {
            const currentMode = authLoadingMode;
            finishAuthLoading();
            if (currentMode === 'signup') {
              showToast(
                'success',
                'Account Created!',
                'Welcome to MUNAJ! You can now track your orders and enjoy faster checkout.'
              );
            } else {
              showToast(
                'success',
                'Welcome Back!',
                'You have successfully signed in.'
              );
            }
          }}
        />
      )}
    </div>
  );
};

// Root Export wrapped with all context providers
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <MunajApp />
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
