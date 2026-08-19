import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { NotificationItem } from '../types';
import { supabase, getCustomerNotifications, markNotificationAsRead } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY_READ_BROADCASTS = 'munaj_customer_read_broadcast_ids';

function getLocalReadBroadcasts(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_READ_BROADCASTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReadBroadcast(id: string) {
  try {
    const current = getLocalReadBroadcasts();
    if (!current.includes(id)) {
      current.push(id);
      localStorage.setItem(STORAGE_KEY_READ_BROADCASTS, JSON.stringify(current));
    }
  } catch (err) {
    console.warn('Could not save read broadcast to localStorage:', err);
  }
}

function saveAllLocalReadBroadcasts(ids: string[]) {
  try {
    const current = getLocalReadBroadcasts();
    const merged = Array.from(new Set([...current, ...ids]));
    localStorage.setItem(STORAGE_KEY_READ_BROADCASTS, JSON.stringify(merged));
  } catch (err) {
    console.warn('Could not save read broadcasts to localStorage:', err);
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getCustomerNotifications(user?.id);
      const readBroadcasts = getLocalReadBroadcasts();

      // Apply read status for broadcast notifications if read locally or in db
      const processed = list.map((n) => {
        const isBroadcast = !n.user_id;
        const isRead = Boolean(n.is_read) || (isBroadcast && readBroadcasts.includes(n.id));
        return {
          ...n,
          is_read: isRead,
          read: isRead,
        };
      });

      setNotifications(processed);
    } catch (e) {
      console.warn('Could not load notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Realtime subscription for customer notifications (both user-specific & broadcast) and order updates
  useEffect(() => {
    // 1. Subscribe to public.notifications table for both targeted and broadcast (user_id IS NULL)
    const notifChannel = supabase
      .channel(`public:notifications:live_${user ? user.id : 'guest'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotif = payload.new as any;
          if (!newNotif) return;

          const isBroadcast = !newNotif.user_id;
          const isForThisUser = user && newNotif.user_id === user.id;

          // Process if broadcast (user_id is NULL) OR targeted specifically to this customer
          if (isBroadcast || isForThisUser) {
            const readBroadcasts = getLocalReadBroadcasts();
            const isRead = Boolean(newNotif.is_read) || (isBroadcast && readBroadcasts.includes(newNotif.id));

            const formatted: NotificationItem = {
              id: newNotif.id,
              user_id: newNotif.user_id,
              title: newNotif.title || 'MUNAJ Notification',
              message: newNotif.message || '',
              type: newNotif.type || 'system',
              order_id: newNotif.order_id || null,
              is_read: isRead,
              read: isRead,
              created_at: newNotif.created_at || new Date().toISOString(),
            };

            setNotifications((prev) => {
              if (prev.some((n) => n.id === formatted.id)) return prev;
              return [formatted, ...prev];
            });

            showToast('info', formatted.title, formatted.message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const updatedNotif = payload.new as any;
          if (!updatedNotif) return;

          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedNotif.id
                ? {
                    ...n,
                    title: updatedNotif.title || n.title,
                    message: updatedNotif.message || n.message,
                    type: updatedNotif.type || n.type,
                    order_id: updatedNotif.order_id || n.order_id,
                    is_read: Boolean(updatedNotif.is_read),
                    read: Boolean(updatedNotif.is_read),
                  }
                : n
            )
          );
        }
      )
      .subscribe();

    // 2. Subscribe to order status updates for this customer
    let ordersChannel: any = null;
    if (user) {
      ordersChannel = supabase
        .channel(`public:orders:customer_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `customer_id=eq.${user.id}`,
          },
          (payload) => {
            const updatedOrder = payload.new as any;
            const newStatus = updatedOrder?.status || updatedOrder?.order_status;
            if (updatedOrder && newStatus) {
              showToast(
                'success',
                `Order #${updatedOrder.order_number} Update`,
                `Status changed to: ${newStatus}`
              );
            }
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(notifChannel);
      if (ordersChannel) {
        supabase.removeChannel(ordersChannel);
      }
    };
  }, [user, showToast]);

  const markAsRead = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read: true } : n))
    );

    if (target && !target.user_id) {
      // Broadcast notification: save locally
      saveLocalReadBroadcast(id);
    }

    if (user && target && target.user_id === user.id) {
      await markNotificationAsRead(id, user.id);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    const broadcastIds = unread.filter((n) => !n.user_id).map((n) => n.id);
    if (broadcastIds.length > 0) {
      saveAllLocalReadBroadcasts(broadcastIds);
    }

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read: true }))
    );

    if (user) {
      const userSpecificUnread = unread.filter((n) => n.user_id === user.id);
      for (const n of userSpecificUnread) {
        await markNotificationAsRead(n.id, user.id);
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
