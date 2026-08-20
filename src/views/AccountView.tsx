import React, { useState, useEffect } from 'react';
import {
  User,
  Package,
  Bell,
  Headphones,
  Shield,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  ArrowRight,
  Eye,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Camera,
} from 'lucide-react';
import { Order, ViewTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import {
  supabase,
  getCustomerOrders,
  uploadAvatar,
  formatNaira,
  formatPaymentMethodForDisplay,
} from '../lib/supabase';
import { CustomerSupport } from '../components/CustomerSupport';
import { AccountRestrictedBanner } from '../components/AccountRestrictedBanner';

interface AccountViewProps {
  setCurrentTab: (tab: ViewTab) => void;
  onTrackOrder: (order: Order) => void;
  openAuthModal: () => void;
  initialAccountTab?: 'profile' | 'orders' | 'notifications' | 'support' | 'security';
  prefilledSupportOrder?: string | null;
}

export const AccountView: React.FC<AccountViewProps> = ({
  setCurrentTab,
  onTrackOrder,
  openAuthModal,
  initialAccountTab = 'orders',
  prefilledSupportOrder = null,
}) => {
  const { user, profile, signOut, updateCustomerProfile } = useAuth();
  const { addItem } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'notifications' | 'support' | 'security'>(
    prefilledSupportOrder ? 'support' : initialAccountTab
  );

  // Profile Form State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Load orders
  const loadOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const data = await getCustomerOrders(user.id);
      setOrders(data);
    } catch (e) {
      console.warn('Orders load error:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadOrders();
      if (profile) {
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
      }
    }
  }, [user, profile]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mx-auto border border-emerald-200">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-[#052E16] font-display">
            Customer Account
          </h2>
          <p className="text-sm text-neutral-600">
            Sign in to manage your deliveries, view receipts, and chat live with MUNAJ customer support.
          </p>
        </div>
        <button
          onClick={openAuthModal}
          className="bg-[#16A34A] hover:bg-[#15803D] text-white px-6 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Sign In / Create Account</span>
          <ArrowRight className="w-4 h-4 text-[#B7FF00]" />
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('error', 'Validation Error', 'Full name is required.');
      return;
    }

    setSavingProfile(true);
    const { success, error } = await updateCustomerProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
    });

    if (success) {
      showToast('success', 'Profile Updated', 'Your profile details have been saved successfully.');
    } else {
      showToast('error', 'Update Failed', error || 'Failed to update profile.');
    }
    setSavingProfile(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarUploading(true);
    const url = await uploadAvatar(user.id, file);
    if (url) {
      await updateCustomerProfile({ avatar_url: url });
      showToast('success', 'Avatar Updated', 'Your profile photo has been updated.');
    } else {
      showToast('error', 'Upload Failed', 'Failed to upload photo. Please check image size.');
    }
    setAvatarUploading(false);
  };

  // Reorder Action
  const handleReorder = (order: Order) => {
    if (profile?.status === 'restricted') {
      showToast('warning', 'Account Restricted', 'Your account currently has restricted access. Placing orders is disabled.');
      setActiveTab('support');
      return;
    }
    if (!order.items || order.items.length === 0) return;
    order.items.forEach((it) => {
      addItem(
        {
          id: it.food_item_id || `reorder-${it.food_name}`,
          name: it.food_name,
          price: it.unit_price,
          available: true,
          featured: false,
          image_url: it.image_url || null,
        },
        it.quantity
      );
    });
    showToast('success', 'Added to Tray', `Items from order #${order.order_number} added to your food tray.`);
    setCurrentTab('cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Account Profile Header */}
      <div className="bg-gradient-to-br from-[#052E16] via-[#0B3D20] to-[#071A0E] text-white rounded-3xl p-6 sm:p-8 border border-[#16A34A]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#16A34A] to-[#052E16] text-white flex items-center justify-center font-extrabold text-2xl shadow-lg border-2 border-[#B7FF00]/40 overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : profile?.full_name ? (
                profile.full_name.charAt(0).toUpperCase()
              ) : (
                'U'
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#071A0E] hover:bg-[#0B3D20] text-white flex items-center justify-center cursor-pointer border border-[#16A34A]/40 transition-colors">
              <Camera className="w-3 h-3 text-[#B7FF00]" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={avatarUploading}
              />
            </label>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold font-display">
                {profile?.full_name || 'Valued Customer'}
              </h1>
              {profile?.status === 'restricted' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Restricted
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-[#B7FF00] border border-[#16A34A]/40">
                  Active
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-200">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#B7FF00]" /> {user.email}
              </span>
              {profile?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#B7FF00]" /> {profile.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={async () => {
            await signOut();
            setCurrentTab('home');
          }}
          className="bg-[#071A0E] hover:bg-neutral-800 text-neutral-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#16A34A]/20 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" /> Sign Out
        </button>
      </div>

      {/* Restricted User Alert Banner */}
      {profile?.status === 'restricted' && (
        <AccountRestrictedBanner
          onContactSupport={() => setActiveTab('support')}
        />
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-emerald-100">
        {[
          { id: 'orders', label: 'My Orders', icon: Package, badge: orders.length },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
          { id: 'support', label: 'Customer Support', icon: Headphones },
          { id: 'profile', label: 'Personal Profile', icon: User },
          { id: 'security', label: 'Security', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#052E16] text-[#B7FF00] border border-[#16A34A]/40 shadow-xs'
                  : 'text-neutral-600 hover:text-[#052E16] hover:bg-[#F0FDF4]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#B7FF00]' : 'text-neutral-500'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    isActive ? 'bg-[#16A34A] text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#052E16] font-display">
              Orders History & Active Deliveries
            </h2>
            <button
              onClick={loadOrders}
              disabled={loadingOrders}
              className="text-xs font-semibold text-[#16A34A] hover:text-[#15803D] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
              <span>Refresh Orders</span>
            </button>
          </div>

          {loadingOrders ? (
            <div className="text-center py-12 text-neutral-400 text-xs">
              Loading your orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 space-y-4">
              <Package className="w-12 h-12 text-emerald-300 mx-auto" />
              <h3 className="text-base font-bold text-[#052E16]">No orders placed yet</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Explore our menu to order smoky party Jollof, royal Egusi soup, or tender Hausa suya!
              </p>
              <button
                onClick={() => setCurrentTab('menu')}
                className="bg-[#16A34A] hover:bg-[#15803D] text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-100 shadow-xs hover:border-[#16A34A]/50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-extrabold text-sm sm:text-base text-[#052E16] font-display">
                        #{ord.order_number}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          ord.order_status === 'Delivered'
                            ? 'bg-emerald-100 text-[#16A34A]'
                            : ord.order_status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-[#F0FDF4] text-[#0B3D20] border border-emerald-200'
                        }`}
                      >
                        {ord.order_status}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {new Date(ord.created_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                      </span>
                    </div>

                    {ord.items && ord.items.length > 0 && (
                      <p className="text-xs text-neutral-600 line-clamp-1 font-medium">
                        {ord.items.map((it) => `${it.quantity}x ${it.food_name}`).join(', ')}
                      </p>
                    )}

                    <div className="text-xs text-neutral-500 flex flex-wrap items-center gap-2">
                      <span>Total: <strong className="text-[#052E16]">{formatNaira(ord.total)}</strong></span>
                      <span>•</span>
                      <span>{formatPaymentMethodForDisplay(ord.payment_method)}</span>
                      <span>•</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          ord.payment_status?.toLowerCase() === 'paid'
                            ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                            : ord.payment_status?.toLowerCase() === 'rejected' || ord.payment_status?.toLowerCase() === 'failed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-[#F0FDF4] text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {ord.payment_status?.toLowerCase() === 'paid'
                          ? 'Paid'
                          : ord.payment_status?.toLowerCase() === 'failed' || ord.payment_status?.toLowerCase() === 'rejected'
                          ? 'Failed'
                          : (ord.payment_method?.toLowerCase().includes('transfer') || ord.payment_method?.toLowerCase().includes('bank'))
                          ? 'Awaiting Payment Verification'
                          : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                      onClick={() => onTrackOrder(ord)}
                      className="flex-1 md:flex-none bg-[#16A34A] hover:bg-[#15803D] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#B7FF00]" />
                      <span>Track Order</span>
                    </button>

                    <button
                      onClick={() => handleReorder(ord)}
                      className="flex-1 md:flex-none bg-[#F0FDF4] hover:bg-emerald-100 text-[#16A34A] border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reorder Tray
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#052E16] font-display">
              Activity & Order Notifications
            </h2>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-[#16A34A] hover:text-[#15803D] cursor-pointer"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 space-y-3">
              <Bell className="w-10 h-10 text-emerald-300 mx-auto" />
              <h3 className="text-base font-bold text-[#052E16]">No notifications</h3>
              <p className="text-xs text-neutral-500">
                You'll receive live alerts here whenever an announcement is made, order status updates, or customer support replies.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-emerald-100 divide-y divide-emerald-50 overflow-hidden shadow-xs">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id);
                  }}
                  className={`p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                    !n.read ? 'bg-[#F0FDF4] border-l-4 border-[#16A34A]' : 'hover:bg-emerald-50/40'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!n.user_id && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#052E16] text-[#B7FF00] tracking-wider">
                          Broadcast
                        </span>
                      )}
                      {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] shadow-[0_0_6px_#16A34A]" />}
                      <h4 className={`text-sm font-bold ${!n.read ? 'text-[#052E16]' : 'text-neutral-900'}`}>
                        {n.title}
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-neutral-400 block pt-0.5 font-mono">
                      {new Date(n.created_at).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(n.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SUPPORT TICKETS & REAL-TIME CHAT */}
      {activeTab === 'support' && (
        <CustomerSupport
          prefilledOrderNumber={prefilledSupportOrder}
          onNavigateToOrders={() => setActiveTab('orders')}
          onTrackOrder={onTrackOrder}
          openAuthModal={openAuthModal}
        />
      )}

      {/* TAB CONTENT: PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-[#052E16] font-display pb-3 border-b border-emerald-100">
            Edit Customer Profile
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#052E16] mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden bg-[#F0FDF4]/30 text-[#052E16]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#052E16] mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user.email || ''}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm bg-neutral-100 text-neutral-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#052E16] mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 801 234 5678"
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 text-xs sm:text-sm focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 outline-hidden bg-[#F0FDF4]/30 text-[#052E16]"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="bg-[#16A34A] hover:bg-[#15803D] text-white px-6 py-3 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: SECURITY */}
      {activeTab === 'security' && (
        <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-[#052E16] font-display pb-3 border-b border-emerald-100">
            Account Security & Privacy
          </h2>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200 space-y-2">
              <h4 className="font-bold text-[#052E16]">Protected Customer Session</h4>
              <p className="text-neutral-600">
                Your session is safely encrypted and authenticated. Only you have access to your personal delivery addresses, orders, and support tickets.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={async () => {
                  if (user.email) {
                    await supabase.auth.resetPasswordForEmail(user.email);
                    showToast('success', 'Reset Email Sent', 'Password reset instructions sent to your email.');
                  }
                }}
                className="bg-[#052E16] hover:bg-[#0B3D20] text-[#B7FF00] px-5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Send Password Reset Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
