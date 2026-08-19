import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Bell,
  User as UserIcon,
  Menu as MenuIcon,
  X,
  Phone,
  Clock,
  ChevronRight,
  LogOut,
  Package,
  Headphones,
  Sparkles,
  Flame,
} from 'lucide-react';
import { ViewTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { formatNaira } from '../lib/supabase';

interface NavbarProps {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
  openAuthModal: (initialTab?: 'login' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openAuthModal,
}) => {
  const { user, profile, signOut } = useAuth();
  const { itemCount, subtotal, settings } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Our Menu' },
    { id: 'about', label: 'Our Story' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/80 shadow-xs transition-all">
      {/* Top micro bar for phone / hours announcement */}
      <div className="bg-[#052E16] text-neutral-200 text-xs py-1.5 px-4 hidden sm:block border-b border-[#0B3D20]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#B7FF00] font-bold">
              <Flame className="w-3.5 h-3.5 text-[#B7FF00]" /> Authentic Naija Firewood Delicacies
            </span>
            <span className="text-emerald-800">|</span>
            <span className="flex items-center gap-1 text-neutral-300">
              <Clock className="w-3 h-3 text-emerald-400" /> {settings.opening_hours || 'Mon - Sun: 8:00 AM - 10:30 PM'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`tel:${settings.phone}`}
              className="flex items-center gap-1 text-neutral-200 hover:text-[#B7FF00] transition-colors font-medium"
            >
              <Phone className="w-3 h-3 text-[#B7FF00]" /> Direct Order Line: {settings.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div
            id="brand-logo"
            onClick={() => {
              setCurrentTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#16A34A] to-[#052E16] flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform border border-[#B7FF00]/40">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tight text-[#052E16] font-display leading-none">
                MUNAJ<span className="text-[#16A34A]">.</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-extrabold text-[#16A34A] mt-0.5">
                Nigerian Kitchen
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  onClick={() => {
                    setCurrentTab(link.id as ViewTab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'text-[#16A34A] bg-[#F0FDF4] border border-[#16A34A]/25 shadow-xs'
                      : 'text-neutral-700 hover:text-[#052E16] hover:bg-[#F0FDF4]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Popover */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  id="notifications-btn"
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  aria-label="Notifications"
                  className="relative p-2.5 rounded-xl text-neutral-700 hover:bg-[#F0FDF4] hover:text-[#16A34A] transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#16A34A] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-emerald-100 py-3 z-50 animate-in fade-in slide-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-neutral-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#052E16] text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-[#F0FDF4] text-[#16A34A] border border-[#16A34A]/30 text-xs px-2 py-0.5 rounded-full font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-[#16A34A] hover:text-[#0B3D20] font-semibold transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-neutral-500 text-sm">
                          <Bell className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 8).map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (!notif.read) markAsRead(notif.id);
                              if (notif.type === 'order') {
                                setCurrentTab('account');
                                setNotifDropdownOpen(false);
                              }
                            }}
                            className={`p-3.5 hover:bg-[#F0FDF4]/80 cursor-pointer transition-colors ${
                              !notif.read ? 'bg-[#F0FDF4] border-l-3 border-[#16A34A]' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {!notif.user_id && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#052E16] text-[#B7FF00]">
                                    Broadcast
                                  </span>
                                )}
                                <p className={`text-xs font-bold ${!notif.read ? 'text-[#052E16]' : 'text-neutral-800'}`}>
                                  {notif.title}
                                </p>
                              </div>
                              {!notif.read && (
                                <span className="w-2 h-2 bg-[#16A34A] rounded-full shrink-0 mt-1 shadow-[0_0_6px_#16A34A]" />
                              )}
                            </div>
                            <p className="text-xs text-neutral-600 mt-1 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-neutral-400 mt-1.5 block font-mono">
                              {new Date(notif.created_at).toLocaleDateString('en-NG', {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              •{' '}
                              {new Date(notif.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="px-4 pt-2 border-t border-neutral-100 text-center">
                      <button
                        onClick={() => {
                          setCurrentTab('account');
                          setNotifDropdownOpen(false);
                        }}
                        className="text-xs text-[#16A34A] font-bold hover:underline"
                      >
                        View All Activity
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shopping Cart Trigger */}
            <button
              id="header-cart-btn"
              onClick={() => {
                setCurrentTab('cart');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 bg-[#052E16] hover:bg-[#0B3D20] text-white px-3.5 sm:px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md group border border-[#16A34A]/40"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-[#B7FF00] group-hover:scale-110 transition-transform" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-[#16A34A] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-[#052E16]">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">
                {itemCount > 0 ? formatNaira(subtotal) : 'Tray'}
              </span>
            </button>

            {/* User Account / Login Button */}
            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  id="user-account-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl border border-emerald-200 hover:bg-[#F0FDF4] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] border border-[#16A34A]/30 flex items-center justify-center font-extrabold text-xs">
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-[#052E16] hidden lg:inline max-w-[100px] truncate">
                    {profile?.full_name || 'My Account'}
                  </span>
                </button>

                {/* Account dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-emerald-100 py-2 z-50">
                    <div className="px-4 py-2.5 border-b border-neutral-100 bg-[#F0FDF4]/50">
                      <p className="text-xs font-bold text-[#052E16] truncate">
                        {profile?.full_name || 'Valued Customer'}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setCurrentTab('account');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-[#F0FDF4] hover:text-[#16A34A] flex items-center gap-2.5"
                      >
                        <UserIcon className="w-4 h-4 text-emerald-600" /> My Profile
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTab('account');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-[#F0FDF4] hover:text-[#16A34A] flex items-center gap-2.5"
                      >
                        <Package className="w-4 h-4 text-emerald-600" /> Orders & History
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTab('support');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-[#F0FDF4] hover:text-[#16A34A] flex items-center gap-2.5"
                      >
                        <Headphones className="w-4 h-4 text-emerald-600" /> Customer Support
                      </button>
                    </div>

                    <div className="border-t border-neutral-100 pt-1">
                      <button
                        onClick={async () => {
                          await signOut();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="header-sign-in-btn"
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 border border-[#16A34A]/40 hover:border-[#16A34A] bg-[#F0FDF4] hover:bg-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#052E16] transition-colors shadow-xs"
              >
                <UserIcon className="w-4 h-4 text-[#16A34A]" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-neutral-700 hover:bg-[#F0FDF4] transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#052E16]" /> : <MenuIcon className="w-6 h-6 text-[#052E16]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-emerald-100 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setCurrentTab(link.id as ViewTab);
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between ${
                    isActive ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#16A34A]/30' : 'text-neutral-700 hover:bg-[#F0FDF4]'
                  }`}
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
            {user ? (
              <button
                onClick={() => {
                  setCurrentTab('account');
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[#F0FDF4] hover:bg-emerald-100 text-[#052E16] border border-[#16A34A]/30 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                <UserIcon className="w-4 h-4 text-[#16A34A]" /> My Account & Orders
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full bg-[#F0FDF4] border border-emerald-200 text-[#052E16] py-2.5 rounded-xl text-sm font-bold"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('signup');
                  }}
                  className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white py-2.5 rounded-xl text-sm font-bold shadow-md"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
