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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-xs transition-all">
      {/* Top micro bar for phone / hours announcement */}
      <div className="bg-neutral-900 text-neutral-300 text-xs py-1.5 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Flame className="w-3.5 h-3.5" /> Authentic Naija Firewood Delicacies
            </span>
            <span className="text-neutral-500">|</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-neutral-400" /> {settings.opening_hours || 'Mon - Sun: 8:00 AM - 10:30 PM'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`tel:${settings.phone}`}
              className="flex items-center gap-1 hover:text-amber-400 transition-colors"
            >
              <Phone className="w-3 h-3 text-amber-400" /> Direct Order Line: {settings.phone}
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
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl tracking-tight text-neutral-900 font-display leading-none">
                MUNAJ<span className="text-amber-500">.</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-amber-600 mt-0.5">
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
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'text-amber-600 bg-amber-50 shadow-xs'
                      : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
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
                  className="relative p-2.5 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-neutral-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-neutral-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
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
                        notifications.slice(0, 6).map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (!notif.read) markAsRead(notif.id);
                              if (notif.type === 'order') {
                                setCurrentTab('account');
                                setNotifDropdownOpen(false);
                              }
                            }}
                            className={`p-3.5 hover:bg-neutral-50 cursor-pointer transition-colors ${
                              !notif.read ? 'bg-amber-50/60' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs font-semibold text-neutral-900 ${!notif.read ? 'text-amber-900' : ''}`}>
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0 mt-1"></span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-neutral-400 mt-1.5 block">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        className="text-xs text-amber-600 font-semibold hover:underline"
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
              className="flex items-center gap-2.5 bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs group"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
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
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-neutral-800 hidden lg:inline max-w-[100px] truncate">
                    {profile?.full_name || 'My Account'}
                  </span>
                </button>

                {/* Account dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-neutral-200 py-2 z-50">
                    <div className="px-4 py-2.5 border-b border-neutral-100">
                      <p className="text-xs font-bold text-neutral-900 truncate">
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
                        className="w-full text-left px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5"
                      >
                        <UserIcon className="w-4 h-4 text-neutral-500" /> My Profile
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTab('account');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5"
                      >
                        <Package className="w-4 h-4 text-neutral-500" /> Orders & History
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTab('account');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2.5"
                      >
                        <Headphones className="w-4 h-4 text-neutral-500" /> Customer Support
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
                className="flex items-center gap-1.5 border border-neutral-300 hover:border-neutral-400 bg-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-neutral-800 transition-colors shadow-xs"
              >
                <UserIcon className="w-4 h-4 text-neutral-500" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl">
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
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between ${
                    isActive ? 'bg-amber-50 text-amber-700' : 'text-neutral-700 hover:bg-neutral-50'
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
                className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <UserIcon className="w-4 h-4" /> My Account & Orders
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full bg-neutral-100 text-neutral-800 py-2.5 rounded-xl text-sm font-semibold"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('signup');
                  }}
                  className="w-full bg-amber-500 text-white py-2.5 rounded-xl text-sm font-semibold shadow-xs"
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
