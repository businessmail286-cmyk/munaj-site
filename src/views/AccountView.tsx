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
import {
  Order,
  NotificationItem,
  SupportTicket,
  SupportMessage,
  ViewTab,
  TicketCategory,
  TicketPriority,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import {
  supabase,
  getCustomerOrders,
  getCustomerTickets,
  getTicketMessages,
  createSupportTicket,
  sendSupportMessage,
  uploadAvatar,
  formatNaira,
  formatPaymentMethodForDisplay,
} from '../lib/supabase';

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
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
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

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // New Ticket Form State
  const [showNewTicketModal, setShowNewTicketModal] = useState(!!prefilledSupportOrder);
  const [ticketSubject, setTicketSubject] = useState(
    prefilledSupportOrder ? `Inquiry regarding Order #${prefilledSupportOrder}` : ''
  );
  const [ticketCategory, setTicketCategory] = useState<TicketCategory>('Order Issue');
  const [ticketPriority, setTicketPriority] = useState<TicketPriority>('medium');
  const [ticketMessage, setTicketMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);

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

  // Load tickets
  const loadTickets = async () => {
    if (!user) return;
    try {
      const list = await getCustomerTickets(user.id);
      setTickets(list);
      if (list.length > 0 && !selectedTicket) {
        setSelectedTicket(list[0]);
      }
    } catch (e) {
      console.warn('Tickets load error:', e);
    }
  };

  useEffect(() => {
    if (user) {
      loadOrders();
      loadTickets();
      if (profile) {
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
      }
    }
  }, [user, profile]);

  // Load messages when selectedTicket changes
  useEffect(() => {
    if (!selectedTicket?.id) return;

    getTicketMessages(selectedTicket.id).then((msgs) => {
      setTicketMessages(msgs);
    });

    // Realtime subscription for incoming support messages on this ticket
    const channel = supabase
      .channel(`public:support_messages:ticket_${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        (payload) => {
          const newMsg = payload.new as SupportMessage;
          setTicketMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_id !== user?.id) {
            showToast('info', 'New Support Reply', newMsg.message);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id, user?.id, showToast]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-neutral-900 font-display">
            Customer Portal Sign In
          </h2>
          <p className="text-xs text-neutral-500">
            Sign in to your MUNAJ account to view past orders, track live meal deliveries in real-time, and chat with customer support.
          </p>
        </div>
        <button
          onClick={openAuthModal}
          className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md transition-colors"
        >
          Sign In or Register
        </button>
      </div>
    );
  }

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const success = await updateCustomerProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
    });
    if (success) {
      showToast('success', 'Profile Updated', 'Your profile details have been saved.');
    } else {
      showToast('error', 'Update Failed', 'Could not save profile changes.');
    }
    setSavingProfile(false);
  };

  // Avatar Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarUploading(true);
    const publicUrl = await uploadAvatar(user.id, file);
    if (publicUrl) {
      await updateCustomerProfile({ avatar_url: publicUrl });
      showToast('success', 'Avatar Updated', 'Your new profile photo was uploaded successfully.');
    } else {
      showToast('info', 'Notice', 'Avatar upload completed.');
    }
    setAvatarUploading(false);
  };

  // Support Message Send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newMessageText.trim() || !user) return;

    setSendingMessage(true);
    const sent = await sendSupportMessage({
      ticketId: selectedTicket.id,
      senderId: user.id,
      message: newMessageText.trim(),
    });

    if (sent) {
      setTicketMessages((prev) => [...prev, sent]);
      setNewMessageText('');
    } else {
      showToast('error', 'Failed to send', 'Please check your connection and try again.');
    }
    setSendingMessage(false);
  };

  // Create Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim() || !user) return;

    setCreatingTicket(true);
    const newTicket = await createSupportTicket({
      customerId: user.id,
      customerName: profile?.full_name || 'Customer',
      customerEmail: user.email || '',
      subject: ticketSubject.trim(),
      category: ticketCategory,
      priority: ticketPriority,
      initialMessage: ticketMessage.trim(),
    });

    if (newTicket) {
      showToast('success', 'Ticket Created', 'Our support team will review your inquiry shortly.');
      setShowNewTicketModal(false);
      setTicketSubject('');
      setTicketMessage('');
      await loadTickets();
      setSelectedTicket(newTicket);
    } else {
      showToast('error', 'Error', 'Failed to create support ticket. Please try again.');
    }
    setCreatingTicket(false);
  };

  // Reorder Action
  const handleReorder = (order: Order) => {
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
      <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-8 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg border-2 border-neutral-800 overflow-hidden">
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
            <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center cursor-pointer border border-neutral-700 transition-colors">
              <Camera className="w-3 h-3 text-amber-400" />
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
            <h1 className="text-xl sm:text-2xl font-extrabold font-display">
              {profile?.full_name || 'Valued Customer'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-amber-400" /> {user.email}
              </span>
              {profile?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-400" /> {profile.phone}
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
          className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" /> Sign Out
        </button>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-neutral-200">
        {[
          { id: 'orders', label: 'My Orders', icon: Package, badge: orders.length },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
          { id: 'support', label: 'Customer Support', icon: Headphones, badge: tickets.length },
          { id: 'profile', label: 'Personal Profile', icon: User },
          { id: 'security', label: 'Security', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    isActive ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-200 text-neutral-800'
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
            <h2 className="text-xl font-bold text-neutral-900 font-display">
              Orders History & Active Deliveries
            </h2>
            <button
              onClick={loadOrders}
              disabled={loadingOrders}
              className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
              <span>Refresh Orders</span>
            </button>
          </div>

          {loadingOrders ? (
            <div className="text-center py-12 text-neutral-400 text-xs">
              Loading your orders from Supabase...
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 space-y-4">
              <Package className="w-12 h-12 text-neutral-300 mx-auto" />
              <h3 className="text-base font-bold text-neutral-900">No orders placed yet</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Explore our menu to order smoky party Jollof, royal Egusi soup, or tender Hausa suya!
              </p>
              <button
                onClick={() => setCurrentTab('menu')}
                className="bg-neutral-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200 shadow-xs hover:border-amber-400/80 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-extrabold text-sm sm:text-base text-neutral-900 font-display">
                        #{ord.order_number}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          ord.order_status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.order_status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-900'
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
                      <span>Total: <strong className="text-neutral-900">{formatNaira(ord.total)}</strong></span>
                      <span>•</span>
                      <span>{formatPaymentMethodForDisplay(ord.payment_method)}</span>
                      <span>•</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          ord.payment_status?.toLowerCase() === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ord.payment_status?.toLowerCase() === 'rejected' || ord.payment_status?.toLowerCase() === 'failed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
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
                      className="flex-1 md:flex-none bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Track Order</span>
                    </button>

                    <button
                      onClick={() => handleReorder(ord)}
                      className="flex-1 md:flex-none bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
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
            <h2 className="text-xl font-bold text-neutral-900 font-display">
              Activity & Order Notifications
            </h2>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-amber-600 hover:text-amber-800"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 space-y-3">
              <Bell className="w-10 h-10 text-neutral-300 mx-auto" />
              <h3 className="text-base font-bold text-neutral-900">No notifications</h3>
              <p className="text-xs text-neutral-500">
                You'll receive live alerts here whenever an order status updates or customer support replies.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden shadow-xs">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id);
                  }}
                  className={`p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                    !n.read ? 'bg-amber-50/70' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                      <h4 className={`text-sm font-bold ${!n.read ? 'text-amber-950' : 'text-neutral-900'}`}>
                        {n.title}
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-neutral-400 block pt-1">
                      {new Date(n.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 font-display">
                Customer Care & Support
              </h2>
              <p className="text-xs text-neutral-500">
                Submit an inquiry or chat with our operations team regarding food, delivery, or orders.
              </p>
            </div>
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Create Ticket</span>
            </button>
          </div>

          {/* Tickets & Conversation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Tickets List */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-neutral-100 font-bold text-xs text-neutral-700 uppercase tracking-wider">
                Your Tickets ({tickets.length})
              </div>

              {tickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  <Headphones className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p>No support tickets yet.</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto divide-y divide-neutral-100">
                  {tickets.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className={`p-4 cursor-pointer transition-colors ${
                          isSelected ? 'bg-amber-50/80 border-l-4 border-amber-500' : 'hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs text-neutral-900 line-clamp-1">{t.subject}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              t.status === 'Resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-2">
                          <span>{t.category}</span>
                          <span>{new Date(t.created_at).toLocaleDateString('en-NG')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Active Ticket Chat */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-neutral-200 shadow-xs flex flex-col h-[500px] overflow-hidden">
              {selectedTicket ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 sm:p-5 border-b border-neutral-100 bg-neutral-50/60 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900">{selectedTicket.subject}</h3>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                        <span className="bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                          {selectedTicket.category}
                        </span>
                        <span>• Status: <strong>{selectedTicket.status}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-neutral-50/30">
                    {ticketMessages.length === 0 ? (
                      <div className="text-center py-12 text-xs text-neutral-400">
                        No messages in this conversation yet.
                      </div>
                    ) : (
                      ticketMessages.map((msg) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                isMe
                                  ? 'bg-neutral-900 text-white rounded-br-xs'
                                  : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-xs shadow-xs'
                              }`}
                            >
                              <p>{msg.message}</p>
                            </div>
                            <span className="text-[10px] text-neutral-400 mt-1 px-1">
                              {isMe ? 'You' : 'MUNAJ Support'} •{' '}
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Message Input Box */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-100 flex gap-2 bg-white">
                    <input
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      placeholder="Type your message to MUNAJ support team..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-neutral-50"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessageText.trim()}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                      <span>Send</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400 text-xs">
                  <MessageSquare className="w-10 h-10 mb-2 text-neutral-300" />
                  <p>Select a support ticket on the left or create a new ticket to begin chat.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-neutral-900 font-display pb-3 border-b border-neutral-100">
            Edit Customer Profile
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-neutral-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user.email || ''}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs sm:text-sm bg-neutral-100 text-neutral-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 801 234 5678"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-neutral-50"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
            >
              {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: SECURITY */}
      {activeTab === 'security' && (
        <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-neutral-900 font-display pb-3 border-b border-neutral-100">
            Account Security & Privacy
          </h2>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
              <h4 className="font-bold text-neutral-900">Protected Customer Session</h4>
              <p className="text-neutral-500">
                Your session is safely authenticated via Supabase Row-Level-Security (RLS). Only you have access to your personal delivery addresses, orders, and support tickets.
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
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-5 py-2.5 rounded-xl font-bold text-xs transition-colors"
              >
                Send Password Reset Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SUPPORT TICKET MODAL */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-neutral-200 relative animate-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-900 text-base">New Support Inquiry</h3>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. Delivery delay / Special request for Order #MNJ-49821"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-neutral-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs focus:border-amber-500 outline-hidden bg-neutral-50"
                  >
                    <option value="Order Issue">Order Issue</option>
                    <option value="Delivery Status">Delivery Status</option>
                    <option value="Food Quality">Food Quality</option>
                    <option value="Payment Inquiry">Payment Inquiry</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Priority</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs focus:border-amber-500 outline-hidden bg-neutral-50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Message Description</label>
                <textarea
                  required
                  rows={4}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe your inquiry in detail so our kitchen or rider support can resolve it immediately..."
                  className="w-full p-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-neutral-50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {creatingTicket ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
