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

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const list = await getCustomerNotifications(user.id);
      setNotifications(list);
    } catch (e) {
      console.warn('Could not load notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Realtime subscription for customer notifications and order updates
  useEffect(() => {
    if (!user) return;

    // 1. Subscribe to notifications table
    const notifChannel = supabase
      .channel(`public:notifications:user_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as any;
          if (newNotif) {
            const formatted: NotificationItem = {
              id: newNotif.id,
              user_id: newNotif.user_id,
              title: newNotif.title,
              message: newNotif.message,
              type: newNotif.type || 'system',
              is_read: Boolean(newNotif.is_read),
              read: Boolean(newNotif.is_read),
              created_at: newNotif.created_at,
            };
            setNotifications((prev) => [formatted, ...prev]);
            showToast('info', formatted.title, formatted.message);
          }
        }
      )
      .subscribe();

    // 2. Subscribe to order status updates for this customer
    const ordersChannel = supabase
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

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [user, showToast]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await markNotificationAsRead(id);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      await markNotificationAsRead(n.id);
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
