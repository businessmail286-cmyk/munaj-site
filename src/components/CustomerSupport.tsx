import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Plus,
  Send,
  RefreshCw,
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  ArrowLeft,
  Paperclip,
  X,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Phone,
  Mail,
  User,
  Shield,
  RotateCcw,
  Sparkles,
  Lock,
  Tag,
  Sliders,
  FileText,
  Info,
} from 'lucide-react';
import { SupportTicket, SupportMessage, Order, TicketCategory, TicketPriority, SupportDbCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCustomerError } from '../lib/errorUtils';
import {
  supabase,
  getCustomerTickets,
  getTicketMessages,
  createSupportTicket,
  sendSupportMessage,
  updateTicketStatus,
  uploadSupportAttachment,
  getCustomerOrders,
  getOrderById,
  formatNaira,
  SUPPORT_CATEGORY_OPTIONS,
  getSupportCategoryLabel,
  normalizeSupportCategory,
  ValidSupportCategory,
} from '../lib/supabase';

interface CustomerSupportProps {
  prefilledOrderNumber?: string | null;
  onNavigateToOrders?: () => void;
  onTrackOrder?: (order: Order) => void;
  openAuthModal?: () => void;
}

export const CustomerSupport: React.FC<CustomerSupportProps> = ({
  prefilledOrderNumber = null,
  onNavigateToOrders,
  onTrackOrder,
  openAuthModal,
}) => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  // Tickets & Chat State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [relatedOrder, setRelatedOrder] = useState<Order | null>(null);

  // Customer Orders (for selecting related order)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [showTicketSelector, setShowTicketSelector] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState<'chat' | 'info'>('chat');

  // Send Message State
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendMessageError, setSendMessageError] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Status Action State (Close / Reopen)
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Create Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(!!prefilledOrderNumber);
  const [createSubject, setCreateSubject] = useState(
    prefilledOrderNumber ? `Inquiry regarding Order #${prefilledOrderNumber}` : ''
  );
  const [createCategory, setCreateCategory] = useState<ValidSupportCategory>('order');
  const [createOrderId, setCreateOrderId] = useState<string>('');
  const [createMessage, setCreateMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll messages to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticketMessages]);

  // Load customer orders for order-dropdown
  const loadCustomerOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const orders = await getCustomerOrders(user.id);
      setCustomerOrders(orders);
      if (prefilledOrderNumber) {
        const matched = orders.find(
          (o) =>
            o.order_number?.toLowerCase() === prefilledOrderNumber.toLowerCase() ||
            o.id === prefilledOrderNumber
        );
        if (matched) {
          setCreateOrderId(matched.id);
        }
      }
    } catch (err) {
      console.warn('Orders load error in support:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Load customer tickets
  const loadTickets = async (autoSelectFirst = true) => {
    if (!user) return;
    setLoadingTickets(true);
    try {
      const list = await getCustomerTickets(user.id);
      setTickets(list);
      if (list.length > 0 && autoSelectFirst && !selectedTicket) {
        setSelectedTicket(list[0]);
      } else if (selectedTicket) {
        const found = list.find((t) => t.id === selectedTicket.id);
        if (found) {
          setSelectedTicket((prev) => (prev ? { ...prev, ...found } : found));
        }
      }
    } catch (err) {
      console.error('SUPPORT ERROR', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTickets();
      loadCustomerOrders();
    }
  }, [user]);

  // Load messages & related order when selectedTicket changes
  useEffect(() => {
    if (!selectedTicket?.id) {
      setTicketMessages([]);
      setRelatedOrder(null);
      return;
    }

    let isMounted = true;
    setLoadingMessages(true);

    // 1. Fetch initial messages
    getTicketMessages(selectedTicket.id).then((msgs) => {
      if (isMounted) {
        setTicketMessages(msgs);
        setLoadingMessages(false);
      }
    });

    // 2. Fetch related order if ticket has order_id
    if (selectedTicket.order_id) {
      const localOrd = customerOrders.find((o) => o.id === selectedTicket.order_id);
      if (localOrd) {
        setRelatedOrder(localOrd);
      } else {
        getOrderById(selectedTicket.order_id).then((ord) => {
          if (isMounted) setRelatedOrder(ord);
        });
      }
    } else {
      setRelatedOrder(null);
    }

    // 3. Subscribe to Realtime messages for this ticket
    const msgChannel = supabase
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
          if (newMsg.is_admin_message || newMsg.sender_type === 'admin') {
            showToast('info', 'MUNAJ Support Reply', newMsg.message);
          }
        }
      )
      .subscribe();

    // 4. Subscribe to Realtime ticket status changes for this ticket
    const ticketChannel = supabase
      .channel(`public:support_tickets:ticket_${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_tickets',
          filter: `id=eq.${selectedTicket.id}`,
        },
        (payload) => {
          const updated = payload.new as SupportTicket;
          setSelectedTicket((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
          setTickets((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(ticketChannel);
    };
  }, [selectedTicket?.id, customerOrders]);

  // Handle Attachment Selection
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setAttachmentPreview(url);
    } else {
      setAttachmentPreview(null);
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
      setAttachmentPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Send Message Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!messageText.trim() && !attachmentFile) || sendingMessage) return;

    // Verify authentication
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser || !currentUser.id) {
      console.error("MUNAJ SUPPORT MESSAGE ERROR", {
        message: authError?.message || 'Authenticated user required',
        code: authError?.name || 'AUTH_REQUIRED',
        details: (authError as any)?.details || authError?.message,
        hint: 'Please log in to contact MUNAJ Support.',
      });
      setSendMessageError(authError?.message || 'Authentication required. Please sign in.');
      showToast('error', 'Authentication Required', 'Please log in to contact MUNAJ Support.');
      openAuthModal?.();
      return;
    }

    setSendingMessage(true);
    setSendMessageError(null);
    const textToSend = messageText.trim();
    let uploadedUrl: string | null = null;

    if (attachmentFile) {
      setUploadingAttachment(true);
      uploadedUrl = await uploadSupportAttachment(currentUser.id, attachmentFile);
      setUploadingAttachment(false);
    }

    const res = await sendSupportMessage({
      ticketId: selectedTicket.id,
      senderId: currentUser.id,
      message: textToSend,
      attachmentUrl: uploadedUrl,
    });

    if (res.message) {
      setTicketMessages((prev) => {
        if (prev.some((m) => m.id === res.message!.id)) return prev;
        return [...prev, res.message!];
      });
      setMessageText('');
      removeAttachment();
      setSendMessageError(null);
    } else {
      const formattedMsg = formatCustomerError(res.error, 'Failed to send support message. Please try again.');
      setSendMessageError(formattedMsg);
      showToast('error', 'Message Error', formattedMsg);
    }
    setSendingMessage(false);
  };

  // Create Ticket Handler
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createSubject.trim() || !createMessage.trim() || creatingTicket) return;

    // Verify authentication
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      showToast('error', 'Authentication Required', 'Please log in to contact MUNAJ Support.');
      openAuthModal?.();
      return;
    }

    setCreatingTicket(true);
    const res = await createSupportTicket({
      customerId: currentUser.id,
      orderId: createOrderId ? createOrderId : null,
      subject: createSubject.trim(),
      category: createCategory,
      priority: 'normal',
      message: createMessage.trim(),
    });

    if (res.ticket) {
      showToast(
        'success',
        'Ticket Created',
        `Ticket #${res.ticket.ticket_number || res.ticket.id.slice(0, 8)} is now open.`
      );
      setShowCreateModal(false);
      setCreateSubject('');
      setCreateMessage('');
      setCreateOrderId('');
      await loadTickets(false);
      setSelectedTicket(res.ticket);
      setShowTicketSelector(false);
    } else {
      const createErrMsg = formatCustomerError(res.error, 'Failed to create support ticket. Please try again.');
      showToast('error', 'Creation Error', createErrMsg);
    }
    setCreatingTicket(false);
  };

  // Status Change: Close or Reopen Ticket
  const handleStatusChange = async (newStatus: 'open' | 'closed') => {
    if (!selectedTicket || updatingStatus) return;

    setUpdatingStatus(true);
    const res = await updateTicketStatus(selectedTicket.id, newStatus);
    if (res.success) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: newStatus } : t))
      );
      showToast(
        'success',
        newStatus === 'closed' ? 'Ticket Closed' : 'Ticket Reopened',
        newStatus === 'closed'
          ? 'Support ticket has been marked as closed.'
          : 'Support ticket is now reopened for live support.'
      );
    } else {
      showToast('error', 'Status Update Failed', res.error || 'Could not update ticket status.');
    }
    setUpdatingStatus(false);
  };

  // Helpers for Status Label & Style
  const formatTicketStatus = (st?: string) => {
    switch (st?.toLowerCase()) {
      case 'open':
        return 'Open';
      case 'in_progress':
      case 'in progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return st || 'Open';
    }
  };

  const getStatusBadge = (st?: string) => {
    const s = st?.toLowerCase();
    if (s === 'open') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#B7FF00]/15 text-[#88cc00] border border-[#B7FF00]/30 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B7FF00] animate-pulse" />
          Open
        </span>
      );
    }
    if (s === 'in_progress' || s === 'in progress') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-500/15 text-sky-400 border border-sky-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          In Progress
        </span>
      );
    }
    if (s === 'resolved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          Resolved
        </span>
      );
    }
    if (s === 'closed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-neutral-800 text-neutral-400 border border-neutral-700">
          Closed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-neutral-800 text-neutral-300 border border-neutral-700">
        {st || 'Open'}
      </span>
    );
  };

  const formatMessageTime = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatTicketDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesFilter =
      statusFilter === 'all' ||
      (statusFilter === 'open' && t.status?.toLowerCase() === 'open') ||
      (statusFilter === 'in_progress' && (t.status?.toLowerCase() === 'in_progress' || t.status?.toLowerCase() === 'in progress')) ||
      (statusFilter === 'resolved' && t.status?.toLowerCase() === 'resolved') ||
      (statusFilter === 'closed' && t.status?.toLowerCase() === 'closed');

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.subject?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      String(t.ticket_number || '').toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  // Customer Display Info
  const customerName = profile?.full_name || user?.user_metadata?.full_name || 'Valued Customer';
  const customerEmail = user?.email || profile?.email || 'customer@munaj.ng';
  const customerPhone = profile?.phone || 'Not provided';
  const originalMessage = ticketMessages.length > 0 ? ticketMessages[0]?.message : selectedTicket?.subject;

  // Not Logged In View
  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#B7FF00]/10 border border-[#B7FF00]/30 text-[#B7FF00] flex items-center justify-center mx-auto shadow-sm">
          <Headphones className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-neutral-900 font-display">
            MUNAJ Live Customer Support
          </h2>
          <p className="text-sm text-neutral-600">
            Please log in to contact MUNAJ Support. Authenticated customers can chat directly with our operations and rider dispatch team in real time.
          </p>
        </div>
        <button
          onClick={openAuthModal}
          className="bg-[#050505] hover:bg-[#111111] text-[#B7FF00] border border-[#B7FF00]/30 px-6 py-3.5 rounded-2xl font-extrabold text-sm shadow-lg transition-all inline-flex items-center gap-2"
        >
          <Lock className="w-4 h-4 text-[#B7FF00]" />
          <span>Sign In to Access Support</span>
        </button>
      </div>
    );
  }

  const isClosed = selectedTicket?.status?.toLowerCase() === 'closed';

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER & TICKET CONTROLS BAR */}
      <div className="bg-[#050505] text-white rounded-3xl p-5 sm:p-6 border border-neutral-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#111111] border border-[#B7FF00]/40 flex items-center justify-center shrink-0 shadow-xs">
            <Headphones className="w-6 h-6 text-[#B7FF00]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#B7FF00] text-[#050505]">
                MUNAJ Desk
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                {tickets.length} Active Ticket{tickets.length === 1 ? '' : 's'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white mt-0.5 truncate">
              Customer Support Workspace
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Ticket Selector Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowTicketSelector(!showTicketSelector)}
              className="bg-[#111111] hover:bg-neutral-900 text-neutral-200 border border-neutral-700/80 px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#B7FF00]" />
              <span className="max-w-[140px] truncate">
                {selectedTicket
                  ? `Ticket #${selectedTicket.ticket_number || selectedTicket.id.slice(0, 6)}`
                  : 'Select Ticket'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {/* Dropdown Menu for Tickets */}
            {showTicketSelector && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111111] border border-neutral-700 rounded-2xl shadow-2xl z-50 p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="text-xs font-bold text-neutral-300">My Support Tickets</span>
                  <button
                    onClick={() => {
                      setShowTicketSelector(false);
                      setShowCreateModal(true);
                    }}
                    className="text-[11px] font-bold text-[#B7FF00] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-neutral-800/60">
                  {tickets.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-400">
                      No support tickets found.
                    </div>
                  ) : (
                    tickets.map((t) => {
                      const isSel = selectedTicket?.id === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTicket(t);
                            setShowTicketSelector(false);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                            isSel
                              ? 'bg-neutral-800 border-l-2 border-[#B7FF00] text-white'
                              : 'hover:bg-neutral-800/50 text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span className="font-bold text-[#B7FF00]">
                              #{t.ticket_number || t.id.slice(0, 8)}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-neutral-400">
                              {t.status}
                            </span>
                          </div>
                          <p className="text-xs font-medium truncate">{t.subject}</p>
                          <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1">
                            <span>{getSupportCategoryLabel(t.category)}</span>
                            <span>{new Date(t.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* New Ticket Button */}
          <button
            id="create-support-ticket-btn"
            onClick={() => {
              setCreateSubject(prefilledOrderNumber ? `Inquiry regarding Order #${prefilledOrderNumber}` : '');
              setCreateMessage('');
              setShowCreateModal(true);
            }}
            className="bg-[#B7FF00] hover:bg-[#a5e600] text-[#050505] px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md transform hover:-translate-y-0.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>New Ticket</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => loadTickets(false)}
            disabled={loadingTickets}
            className="bg-[#111111] hover:bg-neutral-800 text-neutral-300 border border-neutral-800 p-2.5 rounded-2xl text-xs transition-colors"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin text-[#B7FF00]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. TWO-PANEL SUPPORT WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* LEFT / MAIN AREA — CHAT (Col Span 8 on Desktop)                            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-neutral-200 shadow-md flex flex-col h-[700px] overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Top Chat Header */}
              <div className="px-5 py-4 border-b border-neutral-100 bg-[#050505] text-white flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#111111] border border-[#B7FF00]/50 flex items-center justify-center shrink-0">
                    <Headphones className="w-5 h-5 text-[#B7FF00]" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        Customer Support
                      </span>
                      <span className="font-mono text-xs font-black text-[#B7FF00] bg-[#111111] px-2 py-0.5 rounded-md border border-neutral-800">
                        Ticket {selectedTicket.ticket_number ? `#${selectedTicket.ticket_number}` : `#${selectedTicket.id.slice(0, 8).toUpperCase()}`}
                      </span>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-sm text-white truncate">
                        {customerName}
                      </span>
                      <span className="text-neutral-500 text-xs hidden sm:inline">•</span>
                      <span className="text-xs text-neutral-400 truncate hidden sm:inline">
                        {selectedTicket.subject}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Info Switcher */}
                <div className="flex items-center gap-2 lg:hidden">
                  <button
                    onClick={() => setMobileActiveView(mobileActiveView === 'chat' ? 'info' : 'chat')}
                    className="p-2 rounded-xl bg-neutral-800 text-neutral-200 text-xs font-bold flex items-center gap-1"
                  >
                    <Info className="w-4 h-4 text-[#B7FF00]" />
                    <span>{mobileActiveView === 'chat' ? 'Details' : 'Chat'}</span>
                  </button>
                </div>
              </div>

              {/* Chat Viewport or Mobile Info View */}
              {mobileActiveView === 'info' && (
                <div className="lg:hidden p-5 overflow-y-auto space-y-4 bg-neutral-50 flex-1">
                  <div className="bg-white p-4 rounded-2xl border border-neutral-200 space-y-3 text-xs">
                    <h3 className="font-bold text-neutral-900 border-b pb-2">Ticket Summary</h3>
                    <div><span className="text-neutral-500">Customer:</span> <strong className="text-neutral-900">{customerName}</strong></div>
                    <div><span className="text-neutral-500">Email:</span> <strong className="text-neutral-900">{customerEmail}</strong></div>
                    <div><span className="text-neutral-500">Phone:</span> <strong className="text-neutral-900">{customerPhone}</strong></div>
                    <div><span className="text-neutral-500">Category:</span> <strong className="text-neutral-900">{getSupportCategoryLabel(selectedTicket.category)}</strong></div>
                    <div><span className="text-neutral-500">Priority:</span> <strong className="capitalize text-neutral-900">{selectedTicket.priority || 'Normal'}</strong></div>
                    <div><span className="text-neutral-500">Subject:</span> <strong className="text-neutral-900">{selectedTicket.subject}</strong></div>
                    <div><span className="text-neutral-500">Assigned Admin:</span> <strong className="text-neutral-900">{selectedTicket.assigned_to || 'MUNAJ Support Desk'}</strong></div>
                  </div>
                  <button
                    onClick={() => setMobileActiveView('chat')}
                    className="w-full py-2.5 rounded-xl bg-[#050505] text-[#B7FF00] font-bold text-xs"
                  >
                    Back to Conversation
                  </button>
                </div>
              )}

              {/* MAIN CHAT CONVERSATION AREA (Independent Scrollable) */}
              <div
                className={`flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-neutral-50/60 ${
                  mobileActiveView === 'info' ? 'hidden lg:block' : 'block'
                }`}
              >
                {loadingMessages ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-xs text-neutral-400 space-y-2 py-16">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#88cc00] mx-auto" />
                    <p className="font-medium text-neutral-600">Loading conversation...</p>
                  </div>
                ) : ticketMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-xs text-neutral-400 space-y-2 py-16">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 text-neutral-400 flex items-center justify-center mx-auto mb-1">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-neutral-700 text-sm">No messages in this conversation yet</p>
                    <p className="text-neutral-400 max-w-xs">Type below to begin chatting with MUNAJ Support desk.</p>
                  </div>
                ) : (
                  ticketMessages.map((msg) => {
                    // EXACT STRICT POSITIONING RULE:
                    // ADMIN / MUNAJ MESSAGES = LEFT
                    // CUSTOMER MESSAGES = RIGHT
                    const isAdmin = msg.is_admin_message === true || msg.sender_type === 'admin';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                      >
                        {/* Sender Label Above Bubble */}
                        <div
                          className={`flex items-center gap-1.5 mb-1.5 px-1 text-[11px] font-extrabold ${
                            isAdmin ? 'text-neutral-900 justify-start' : 'text-neutral-700 justify-end'
                          }`}
                        >
                          {isAdmin ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-[#88cc00]" />
                              <span className="tracking-tight text-neutral-900 font-black">
                                MUNAJ Support
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#B7FF00] text-[#050505] font-black uppercase">
                                Admin
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-neutral-500 font-bold">
                                {customerName}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-neutral-200 text-neutral-800 font-bold uppercase">
                                Customer
                              </span>
                            </>
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`max-w-[85%] sm:max-w-lg p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                            isAdmin
                              ? 'bg-white border-2 border-neutral-200/90 text-neutral-900 rounded-tl-xs shadow-xs'
                              : 'bg-[#111111] border border-neutral-800 text-white rounded-tr-xs shadow-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>

                          {/* Message Attachment Preview if present */}
                          {msg.attachment_url && (
                            <div
                              className={`mt-3 pt-2.5 border-t ${
                                isAdmin ? 'border-neutral-200' : 'border-neutral-800'
                              }`}
                            >
                              <a
                                href={msg.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center gap-1.5 text-xs font-bold underline ${
                                  isAdmin
                                    ? 'text-neutral-900 hover:text-black'
                                    : 'text-[#B7FF00] hover:text-[#a5e600]'
                                }`}
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>View Attachment / Proof</span>
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Timestamp under Bubble */}
                        <span className="text-[10px] text-neutral-400 mt-1 px-1 font-mono">
                          {formatMessageTime(msg.created_at)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* FIXED REPLY AREA AT BOTTOM */}
              {isClosed ? (
                <div className="p-4 border-t border-neutral-200 bg-neutral-100 text-center space-y-2 shrink-0">
                  <p className="text-xs text-neutral-600 font-semibold">
                    This support ticket is currently marked as closed.
                  </p>
                  <button
                    onClick={() => handleStatusChange('open')}
                    disabled={updatingStatus}
                    className="bg-[#050505] hover:bg-[#111111] text-[#B7FF00] border border-[#B7FF00]/40 px-4 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#B7FF00]" />
                    <span>Reopen Ticket to Reply</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 sm:p-4 border-t border-neutral-200 bg-white space-y-2 shrink-0">
                  {/* Message Error Notice */}
                  {sendMessageError && (
                    <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold">Error sending reply</p>
                        <p className="text-[11px] whitespace-pre-wrap mt-0.5 text-rose-700">
                          {sendMessageError}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSendMessageError(null)}
                        className="text-rose-400 hover:text-rose-700 shrink-0 ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Attachment Preview Chip */}
                  {attachmentFile && (
                    <div className="flex items-center justify-between bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-xl text-xs text-neutral-800">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-[#88cc00] shrink-0" />
                        <span className="truncate font-medium">{attachmentFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeAttachment}
                        className="text-neutral-400 hover:text-neutral-700 shrink-0 ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Reply Form */}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAttachmentChange}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 rounded-2xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors shrink-0 border border-neutral-200 bg-neutral-50"
                      title="Attach file or image"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 px-4 py-3 rounded-2xl border border-neutral-300 text-xs sm:text-sm focus:border-[#88cc00] focus:ring-2 focus:ring-[#B7FF00]/30 outline-hidden bg-neutral-50"
                    />

                    <button
                      type="submit"
                      disabled={sendingMessage || (!messageText.trim() && !attachmentFile)}
                      className="bg-[#050505] hover:bg-[#111111] text-[#B7FF00] border border-[#B7FF00]/40 px-5 sm:px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all disabled:opacity-40 shrink-0 shadow-md transform active:scale-95"
                    >
                      {sendingMessage ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-[#B7FF00]" />
                      ) : (
                        <Send className="w-4 h-4 text-[#B7FF00]" />
                      )}
                      <span>{sendingMessage ? 'Sending...' : 'Send'}</span>
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-neutral-100 border border-neutral-200 text-neutral-400 flex items-center justify-center">
                <Headphones className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900 font-display">
                  No Support Ticket Selected
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm">
                  Select an existing ticket from your workspace or create a new support ticket below.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-[#050505] hover:bg-[#111111] text-[#B7FF00] border border-[#B7FF00]/40 px-5 py-2.5 rounded-2xl text-xs font-black inline-flex items-center gap-1.5 transition-all shadow-md"
              >
                <Plus className="w-4 h-4 text-[#B7FF00]" />
                <span>Create Support Ticket</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT SIDE — TICKET INFORMATION PANEL (Col Span 4 on Desktop)             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-neutral-200 shadow-md p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#88cc00]" />
              <h2 className="text-sm font-extrabold text-neutral-900 font-display uppercase tracking-wider">
                Ticket Information
              </h2>
            </div>
            {selectedTicket && getStatusBadge(selectedTicket.status)}
          </div>

          {selectedTicket ? (
            <div className="space-y-4 text-xs">
              {/* Customer Profile Section */}
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2.5">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#050505] text-[#B7FF00] flex items-center justify-center font-bold text-xs">
                    {customerName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-neutral-900 text-xs sm:text-sm">
                      {customerName}
                    </h4>
                    <span className="text-[10px] text-neutral-400 font-medium">Customer Account</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>{customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Ticket Details List */}
              <div className="space-y-3 divide-y divide-neutral-100">
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-neutral-500">Ticket Number</span>
                  <span className="font-mono font-extrabold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md">
                    #{selectedTicket.ticket_number || selectedTicket.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-neutral-500">Status</span>
                  <span className="capitalize font-bold text-neutral-900">
                    {formatTicketStatus(selectedTicket.status)}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-neutral-500">Category</span>
                  <span className="font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md">
                    {getSupportCategoryLabel(selectedTicket.category)}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-neutral-500">Priority</span>
                  <span className="capitalize font-bold text-neutral-900">
                    {selectedTicket.priority || 'Normal'}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-neutral-500">Inquiry Topic</span>
                  <span className="font-medium text-neutral-800">
                    {getSupportCategoryLabel(selectedTicket.category)}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-neutral-500">Assigned Admin</span>
                  <span className="font-bold text-neutral-900 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#88cc00]" />
                    <span>{selectedTicket.assigned_to || 'MUNAJ Support Desk'}</span>
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-neutral-500">Created At</span>
                  <span className="text-neutral-600 font-mono text-[11px]">
                    {formatTicketDate(selectedTicket.created_at)}
                  </span>
                </div>
              </div>

              {/* Subject & Original Message Card */}
              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 space-y-1.5">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-neutral-400">
                  Subject
                </span>
                <p className="font-bold text-neutral-900 text-xs">{selectedTicket.subject}</p>
                {originalMessage && (
                  <div className="pt-2 mt-2 border-t border-neutral-200">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">
                      Original Inquiry
                    </span>
                    <p className="text-neutral-600 text-[11px] leading-relaxed line-clamp-4 mt-0.5">
                      "{originalMessage}"
                    </p>
                  </div>
                )}
              </div>

              {/* Related Order Card if present */}
              {relatedOrder && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                      <Package className="w-3 h-3 text-[#88cc00]" />
                      Related Order
                    </span>
                    <span className="font-mono text-neutral-900 font-bold">
                      #{relatedOrder.order_number}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-600">
                    <span>Status: <strong className="text-neutral-900">{relatedOrder.status}</strong></span>
                    <span>Total: <strong className="text-neutral-900">{formatNaira(relatedOrder.total)}</strong></span>
                  </div>
                  {onTrackOrder && (
                    <button
                      onClick={() => onTrackOrder(relatedOrder)}
                      className="w-full mt-1 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>Track Order Status</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Close / Reopen Ticket Button */}
              <div className="pt-2 border-t border-neutral-100">
                {isClosed ? (
                  <button
                    onClick={() => handleStatusChange('open')}
                    disabled={updatingStatus}
                    className="w-full bg-[#050505] hover:bg-[#111111] text-[#B7FF00] border border-[#B7FF00]/40 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4 text-[#B7FF00]" />
                    <span>Reopen Ticket</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange('closed')}
                    disabled={updatingStatus}
                    className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-neutral-500" />
                    <span>Close Ticket</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <Info className="w-8 h-8 mx-auto text-neutral-300" />
              <p className="text-xs">Select a support ticket to see its details and customer info.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#050505]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#050505] text-[#B7FF00] border border-[#B7FF00]/30 flex items-center justify-center">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900 font-display">
                    Create Support Ticket
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Connect directly with the MUNAJ live support desk
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createSubject}
                  onChange={(e) => setCreateSubject(e.target.value)}
                  placeholder="e.g. My order has not arrived / Delivery delay"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:border-[#88cc00] focus:ring-2 focus:ring-[#B7FF00]/30 outline-hidden bg-neutral-50"
                />
              </div>

              {/* Category & Related Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value as ValidSupportCategory)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs focus:border-[#88cc00] outline-hidden bg-neutral-50"
                  >
                    {SUPPORT_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Related Order <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={createOrderId}
                    onChange={(e) => setCreateOrderId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-xs focus:border-[#88cc00] outline-hidden bg-neutral-50"
                  >
                    <option value="">No Related Order (General)</option>
                    {customerOrders.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        #{ord.order_number} • {new Date(ord.created_at).toLocaleDateString('en-NG')} • {formatNaira(ord.total)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={createMessage}
                  onChange={(e) => setCreateMessage(e.target.value)}
                  placeholder="Describe your inquiry in detail so our kitchen or rider support can assist you immediately..."
                  className="w-full p-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:border-[#88cc00] focus:ring-2 focus:ring-[#B7FF00]/30 outline-hidden bg-neutral-50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket || !createSubject.trim() || !createMessage.trim()}
                  className="bg-[#050505] hover:bg-[#111111] text-[#B7FF00] border border-[#B7FF00]/30 px-5 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                >
                  {creatingTicket ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#B7FF00]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-[#B7FF00]" />
                  )}
                  <span>{creatingTicket ? 'Submitting...' : 'Create Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
