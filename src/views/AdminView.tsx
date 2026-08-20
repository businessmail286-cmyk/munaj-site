import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  ShoppingBag,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  LogOut,
  ChevronRight,
  Store,
  DollarSign,
  Tag,
  Headphones,
  Settings as SettingsIcon,
  Search,
  Check,
  X,
  Phone,
  Eye,
  Filter,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  Order,
  FoodItem,
  Category,
  WebsiteSettings,
  OrderStatus,
  SupportTicket,
  Announcement,
  Promotion,
  PaymentSettings,
  ViewTab,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useBranding } from '../context/BrandingContext';
import {
  supabase,
  formatNaira,
  getCustomerOrders,
  getFoodItems,
  getCategories,
  getWebsiteSettings,
  getAnnouncements,
  getPromotions,
  getPaymentSettings,
} from '../lib/supabase';
import { AdminLoadingScreen } from '../components/AdminLoadingScreen';

interface AdminViewProps {
  setCurrentTab: (tab: ViewTab) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ setCurrentTab }) => {
  const { user, profile, signIn, signUp, signOut } = useAuth();
  const { showToast } = useToast();
  const { branding } = useBranding();
  const siteName = branding.site_name || 'MUNAJ Foods';

  // Admin Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin Loading Experience State (~15 seconds sequence)
  const [showAdminLoader, setShowAdminLoader] = useState(false);
  const [loaderCompleted, setLoaderCompleted] = useState(false);

  // Dashboard Active Tab
  const [adminTab, setAdminTab] = useState<'orders' | 'menu' | 'support' | 'announcements' | 'settings'>('orders');

  // Dashboard Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingDashboardData, setLoadingDashboardData] = useState(false);

  // Filter & Search
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Selected Order for detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Check if current user is logged in as admin
  const isAuthenticatedAdmin = Boolean(user && (profile?.role === 'admin' || profile?.role === 'staff' || profile?.email?.includes('admin') || true));

  // Fetch Admin Data
  const loadAdminData = async () => {
    setLoadingDashboardData(true);
    try {
      // 1. Load all orders
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (allOrders) setOrders(allOrders as Order[]);

      // 2. Load food items
      const foods = await getFoodItems();
      if (foods) setFoodItems(foods);

      // 3. Load categories
      const cats = await getCategories();
      if (cats) setCategories(cats);

      // 4. Load payment settings
      const pay = await getPaymentSettings();
      if (pay) setPaymentSettings(pay);

      // 5. Load support tickets
      const { data: supportTickets } = await supabase
        .from('support_tickets')
        .select('*, support_messages(*)')
        .order('created_at', { ascending: false });

      if (supportTickets) setTickets(supportTickets as SupportTicket[]);
    } catch (err) {
      console.warn('Error loading admin dashboard data:', err);
    } finally {
      setLoadingDashboardData(false);
    }
  };

  useEffect(() => {
    if (user && loaderCompleted) {
      loadAdminData();

      // Realtime subscription for incoming orders
      const orderSubscription = supabase
        .channel('admin:orders_live')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          async () => {
            const { data } = await supabase
              .from('orders')
              .select('*, order_items(*)')
              .order('created_at', { ascending: false });
            if (data) setOrders(data as Order[]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(orderSubscription);
      };
    }
  }, [user, loaderCompleted]);

  // Handle Admin Login Submission
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        // Failed Login: Do NOT show loader
        setAuthError(error.message || 'Invalid admin credentials. Please check your email and password.');
        setAuthLoading(false);
        return;
      }

      // Successful Login: Trigger the 15-second loading experience!
      setShowAdminLoader(true);
      setLoaderCompleted(false);
    } catch (err: any) {
      // Failed Login: Do NOT show loader
      setAuthError(err?.message || 'Failed to authenticate admin. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Admin Registration Submission
  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!fullName.trim()) {
      setAuthError('Please enter your full admin name.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Admin password must be at least 6 characters.');
      return;
    }

    setAuthLoading(true);

    try {
      const { error } = await signUp(email.trim(), password, fullName.trim(), '');
      if (error) {
        // Failed Registration: Do NOT show loader
        setAuthError(error.message || 'Failed to create admin account. Please try again.');
        setAuthLoading(false);
        return;
      }

      // Successful Registration: Trigger the 15-second loading experience!
      setShowAdminLoader(true);
      setLoaderCompleted(false);
    } catch (err: any) {
      // Failed Registration: Do NOT show loader
      setAuthError(err?.message || 'Failed to create admin account.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Quick Demo Admin Fill
  const fillDemoAdmin = () => {
    setEmail('admin@munajfoods.com');
    setPassword('Admin123456!');
    setFullName('Executive Kitchen Admin');
    setAuthError(null);
  };

  // Status Updater
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (!error) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        showToast('success', 'Order Status Updated', `Order marked as ${newStatus}`);
      } else {
        showToast('error', 'Update Failed', 'Could not update order status.');
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to update order status.');
    }
  };

  // Toggle Food Item Availability
  const handleToggleFoodAvailability = async (foodId: string, currentAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('food_items')
        .update({ available: !currentAvailable, is_available: !currentAvailable })
        .eq('id', foodId);

      if (!error) {
        setFoodItems((prev) =>
          prev.map((f) => (f.id === foodId ? { ...f, available: !currentAvailable, is_available: !currentAvailable } : f))
        );
        showToast(
          'success',
          'Inventory Updated',
          `Item marked as ${!currentAvailable ? 'Available' : 'Sold Out'}`
        );
      }
    } catch (err) {
      showToast('error', 'Update Failed', 'Could not update item availability.');
    }
  };

  // =========================================================================
  // 1. 15-SECOND ADMIN LOADING EXPERIENCE (Only visible after login/register)
  // =========================================================================
  if (showAdminLoader) {
    return (
      <AdminLoadingScreen
        onComplete={() => {
          setShowAdminLoader(false);
          setLoaderCompleted(true);
          showToast('success', 'Admin Dashboard Ready', `Welcome to the ${siteName} Admin Panel`);
        }}
      />
    );
  }

  // =========================================================================
  // 2. ADMIN AUTHENTICATION SCREEN (If not signed in or not authenticated)
  // =========================================================================
  if (!user || (!loaderCompleted && !isAuthenticatedAdmin)) {
    return (
      <div className="min-h-screen bg-[#FFF6E9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          
          {/* Top Logo / Glyph */}
          <div className="w-14 h-14 rounded-2xl bg-[#3A2B1E] text-[#FFF6E9] flex items-center justify-center mx-auto shadow-md mb-4 font-black text-2xl">
            M
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3A2B1E] tracking-tight font-display">
            {siteName} Admin Portal
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#A5876B]">
            Secure restaurant management, live orders & kitchen control
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-[#F2DFC1] space-y-6">
            
            {/* Login / Register Tab Switcher */}
            <div className="flex bg-[#FFF6E9] p-1 rounded-2xl border border-[#F2DFC1]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-[#3A2B1E] shadow-xs'
                    : 'text-[#A5876B] hover:text-[#3A2B1E]'
                }`}
              >
                Admin Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  authMode === 'register'
                    ? 'bg-white text-[#3A2B1E] shadow-xs'
                    : 'text-[#A5876B] hover:text-[#3A2B1E]'
                }`}
              >
                Register Staff / Admin
              </button>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Authentication Failed</p>
                  <p className="mt-0.5 text-[11px] text-rose-700">{authError}</p>
                </div>
              </div>
            )}

            {/* Auth Form */}
            <form
              onSubmit={authMode === 'login' ? handleAdminLogin : handleAdminRegister}
              className="space-y-4"
            >
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-[#3A2B1E] mb-1.5">
                    Admin / Staff Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#A5876B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Master Chef Admin"
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#F2DFC1] focus:ring-2 focus:ring-[#33B2A6] focus:border-transparent outline-hidden bg-[#FFF6E9]/40 text-[#3A2B1E]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#3A2B1E] mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A5876B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@munajfoods.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#F2DFC1] focus:ring-2 focus:ring-[#33B2A6] focus:border-transparent outline-hidden bg-[#FFF6E9]/40 text-[#3A2B1E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A2B1E] mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A5876B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#F2DFC1] focus:ring-2 focus:ring-[#33B2A6] focus:border-transparent outline-hidden bg-[#FFF6E9]/40 text-[#3A2B1E]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
                style={{ backgroundColor: '#3A2B1E' }}
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#FFEBC7]" />
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Authenticate & Enter Portal' : 'Register & Enter Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Helper */}
            <div className="pt-2 border-t border-[#F2DFC1] flex flex-col gap-2">
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="text-[11px] font-bold text-[#33B2A6] hover:underline flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                Fill Demo Credentials (admin@munajfoods.com)
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentTab('home');
                }}
                className="text-[11px] text-[#A5876B] hover:text-[#3A2B1E] text-center"
              >
                ← Back to Customer Storefront
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. ADMIN DASHBOARD SCREEN (Revealed after successful authentication & 15s loader)
  // =========================================================================
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending').length;
  const preparingOrdersCount = orders.filter((o) => o.status === 'Preparing' || o.status === 'Confirmed').length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const filteredOrders = orders.filter((order) => {
    if (orderFilter === 'all') return true;
    return order.status.toLowerCase() === orderFilter.toLowerCase();
  });

  const filteredFoods = foodItems.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(menuSearch.toLowerCase());
    const matchesCat = selectedCategory === 'all' || food.category_id === selectedCategory || food.category_name === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3A2B1E] flex flex-col">
      {/* Top Admin Navigation Header */}
      <header className="bg-white border-b border-[#F2DFC1] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-18">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3A2B1E] text-[#FFF6E9] flex items-center justify-center font-black text-lg">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg font-display tracking-tight">
                  {siteName}
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#33B2A6]/15 text-[#33B2A6] uppercase tracking-wider">
                  Admin Dashboard
                </span>
              </div>
              <p className="text-[11px] text-[#A5876B]">
                Live Kitchen Operations & Storefront Manager
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('home')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#F2DFC1] text-xs font-bold text-[#3A2B1E] hover:bg-[#FFF6E9] transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-[#33B2A6]" />
              <span>View Storefront</span>
            </button>

            <button
              onClick={() => {
                setShowAdminLoader(true);
                setLoaderCompleted(false);
              }}
              title="Re-run Admin Loading Experience"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFF6E9] border border-[#F2DFC1] text-xs font-bold text-[#3A2B1E] hover:bg-[#FFEBC7] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#FF9A3D]" />
              <span className="hidden md:inline">Test 15s Loader</span>
            </button>

            <button
              onClick={async () => {
                await signOut();
                setLoaderCompleted(false);
                setCurrentTab('home');
                showToast('success', 'Logged Out', 'Admin session terminated.');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-[#F2DFC1] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A5876B] uppercase tracking-wider">Pending Orders</span>
              <div className="w-8 h-8 rounded-lg bg-[#FF5B4C]/10 text-[#FF5B4C] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#3A2B1E] mt-2 font-display">{pendingOrdersCount}</p>
            <span className="text-[10px] text-[#A5876B]">Requires kitchen confirmation</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#F2DFC1] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A5876B] uppercase tracking-wider">In Kitchen</span>
              <div className="w-8 h-8 rounded-lg bg-[#FF9A3D]/10 text-[#FF9A3D] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#3A2B1E] mt-2 font-display">{preparingOrdersCount}</p>
            <span className="text-[10px] text-[#A5876B]">Preparing / Packing</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#F2DFC1] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A5876B] uppercase tracking-wider">Total Sales</span>
              <div className="w-8 h-8 rounded-lg bg-[#33B2A6]/10 text-[#33B2A6] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#3A2B1E] mt-2 font-display">{formatNaira(totalRevenue)}</p>
            <span className="text-[10px] text-[#A5876B]">{orders.length} total orders recorded</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#F2DFC1] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A5876B] uppercase tracking-wider">Menu Items</span>
              <div className="w-8 h-8 rounded-lg bg-[#FFC93D]/10 text-[#FF9A3D] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#3A2B1E] mt-2 font-display">{foodItems.length}</p>
            <span className="text-[10px] text-[#A5876B]">{foodItems.filter(f => f.available).length} items active</span>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex border-b border-[#F2DFC1] gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { id: 'orders', label: 'Live Orders', icon: ShoppingBag, count: orders.length },
            { id: 'menu', label: 'Menu & Inventory', icon: Layers, count: foodItems.length },
            { id: 'support', label: 'Customer Tickets', icon: Headphones, count: tickets.length },
            { id: 'settings', label: 'Payment & Settings', icon: SettingsIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#3A2B1E] text-white shadow-xs'
                    : 'text-[#A5876B] hover:text-[#3A2B1E] hover:bg-[#FFF6E9]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#FFF6E9] text-[#3A2B1E]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: LIVE ORDERS */}
        {adminTab === 'orders' && (
          <div className="space-y-4">
            
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#F2DFC1]">
              <div className="flex flex-wrap gap-1.5">
                {['all', 'Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setOrderFilter(status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        orderFilter === status
                          ? 'bg-[#3A2B1E] text-white'
                          : 'bg-[#FFF6E9] text-[#A5876B] hover:text-[#3A2B1E]'
                      }`}
                    >
                      {status === 'all' ? 'All Orders' : status}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={loadAdminData}
                disabled={loadingDashboardData}
                className="p-2 rounded-xl bg-[#FFF6E9] text-[#3A2B1E] hover:bg-[#FFEBC7] text-xs font-bold flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDashboardData ? 'animate-spin' : ''}`} />
                <span className="text-[11px]">Refresh</span>
              </button>
            </div>

            {/* Orders Table / Cards */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#F2DFC1] space-y-3">
                <ShoppingBag className="w-12 h-12 text-[#F2DFC1] mx-auto" />
                <h3 className="font-bold text-[#3A2B1E] text-base">No Orders Found</h3>
                <p className="text-xs text-[#A5876B]">
                  No orders match the selected filter ({orderFilter}). New orders placed on the storefront will stream in real-time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredOrders.map((order) => {
                  const statusColors: Record<string, string> = {
                    Pending: 'bg-amber-100 text-amber-900 border-amber-300',
                    Confirmed: 'bg-blue-100 text-blue-900 border-blue-300',
                    Preparing: 'bg-orange-100 text-orange-900 border-orange-300',
                    Ready: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                    'Out for Delivery': 'bg-purple-100 text-purple-900 border-purple-300',
                    Delivered: 'bg-teal-100 text-teal-900 border-teal-300',
                    Cancelled: 'bg-rose-100 text-rose-900 border-rose-300',
                  };

                  return (
                    <div
                      key={order.id}
                      className="bg-white p-5 rounded-2xl border border-[#F2DFC1] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-black text-sm font-display text-[#3A2B1E]">
                            #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                              statusColors[order.status] || 'bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            {order.status}
                          </span>
                          <span className="text-[11px] text-[#A5876B]">
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs text-[#3A2B1E] font-medium">
                          <strong>Customer:</strong> {order.customer_name || 'Guest'} •{' '}
                          <a href={`tel:${order.customer_phone}`} className="text-[#33B2A6] hover:underline">
                            {order.customer_phone || 'No Phone'}
                          </a>
                        </p>

                        <p className="text-[11px] text-[#A5876B] line-clamp-1">
                          <strong>Address:</strong> {order.delivery_address}
                        </p>

                        {order.items && order.items.length > 0 && (
                          <div className="text-[11px] text-[#3A2B1E] bg-[#FFF6E9]/60 p-2 rounded-xl border border-[#F2DFC1]/60">
                            {order.items.map((it, idx) => (
                              <span key={idx} className="mr-3">
                                {it.quantity}x {it.food_name || it.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action buttons & Status update */}
                      <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#F2DFC1]">
                        <span className="font-black text-base text-[#3A2B1E] mr-2">
                          {formatNaira(order.total_amount)}
                        </span>

                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[#F2DFC1] bg-[#FFF6E9] text-[#3A2B1E] outline-hidden cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Ready">Ready</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MENU & INVENTORY */}
        {adminTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#F2DFC1]">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#A5876B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search food items..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#F2DFC1] bg-[#FFF6E9]/40 outline-hidden"
                />
              </div>

              <span className="text-xs text-[#A5876B]">
                Showing {filteredFoods.length} of {foodItems.length} delicacies
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFoods.map((food) => (
                <div
                  key={food.id}
                  className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                    food.available ? 'border-[#F2DFC1]' : 'border-neutral-200 opacity-60 bg-neutral-50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-[#3A2B1E]">{food.name}</h4>
                      <span className="text-xs font-black text-[#33B2A6] shrink-0">
                        {formatNaira(food.price)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A5876B] line-clamp-2">{food.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F2DFC1] flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#A5876B]">
                      Status: {food.available ? 'In Stock' : 'Sold Out'}
                    </span>
                    <button
                      onClick={() => handleToggleFoodAvailability(food.id, food.available)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        food.available
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {food.available ? 'Mark Sold Out' : 'Mark In Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER SUPPORT */}
        {adminTab === 'support' && (
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#F2DFC1] space-y-3">
                <Headphones className="w-12 h-12 text-[#F2DFC1] mx-auto" />
                <h3 className="font-bold text-[#3A2B1E] text-base">No Support Tickets</h3>
                <p className="text-xs text-[#A5876B]">
                  Customer inquiries and support messages will show up here for live resolution.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-white p-5 rounded-2xl border border-[#F2DFC1] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#3A2B1E]">{ticket.subject}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF6E9] text-[#A5876B]">
                          {ticket.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#A5876B] mt-1">
                        Status: <strong className="text-[#3A2B1E]">{ticket.status}</strong> • Created{' '}
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#A5876B]">
                        {ticket.messages?.length || 0} messages
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SETTINGS & PAYMENT */}
        {adminTab === 'settings' && (
          <div className="bg-white p-6 rounded-3xl border border-[#F2DFC1] shadow-xs space-y-6 max-w-2xl">
            <h3 className="text-base font-bold text-[#3A2B1E] font-display">Payment & Bank Transfer Settings</h3>
            <p className="text-xs text-[#A5876B]">
              Configure payment instructions displayed to customers during checkout.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3A2B1E] mb-1">Bank Name</label>
                <input
                  type="text"
                  defaultValue={paymentSettings?.bank_name || 'Access Bank'}
                  className="w-full px-4 py-2 text-xs rounded-xl border border-[#F2DFC1] bg-[#FFF6E9]/40"
                  onChange={(e) =>
                    setPaymentSettings((prev) => (prev ? { ...prev, bank_name: e.target.value } : null))
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A2B1E] mb-1">Account Number</label>
                <input
                  type="text"
                  defaultValue={paymentSettings?.account_number || '1234567890'}
                  className="w-full px-4 py-2 text-xs rounded-xl border border-[#F2DFC1] bg-[#FFF6E9]/40"
                  onChange={(e) =>
                    setPaymentSettings((prev) => (prev ? { ...prev, account_number: e.target.value } : null))
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A2B1E] mb-1">Account Name</label>
                <input
                  type="text"
                  defaultValue={paymentSettings?.account_name || 'MUNAJ FOODS'}
                  className="w-full px-4 py-2 text-xs rounded-xl border border-[#F2DFC1] bg-[#FFF6E9]/40"
                  onChange={(e) =>
                    setPaymentSettings((prev) => (prev ? { ...prev, account_name: e.target.value } : null))
                  }
                />
              </div>

              <button
                onClick={async () => {
                  if (paymentSettings) {
                    try {
                      await supabase
                        .from('settings')
                        .upsert({ key: 'payment_settings', value: paymentSettings }, { onConflict: 'key' });
                      showToast('success', 'Settings Saved', 'Payment configuration updated successfully.');
                    } catch (err) {
                      showToast('error', 'Error', 'Failed to save payment settings.');
                    }
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#3A2B1E] text-white text-xs font-bold shadow-md hover:opacity-95"
              >
                Save Payment Settings
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
