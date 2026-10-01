import React, { useState, useEffect } from 'react';
import {
  Store,
  ShoppingCart,
  User as UserIcon,
  Search,
  MapPin,
  Bell,
  ShieldCheck,
  Building2,
  LogOut,
  ChevronDown,
  FileText,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { NotificationItem } from '../types/index.ts';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenVendorOnboarding: () => void;
  onOpenPolicies: (type: string) => void;
  onOpenLogin: (mode?: 'signin' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  selectedCity,
  setSelectedCity,
  searchQuery,
  setSearchQuery,
  onOpenLogin,
}) => {
  const { currentUser, logout, getAuthHeaders } = useAuth();
  const { items, setIsCartOpen } = useCart();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [cities] = useState(['All Cities', 'New Delhi', 'Bengaluru', 'Mumbai', 'Jaipur', 'Hyderabad']);

  const cartCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/notifications', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 25000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [currentUser?.id]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Platform Branding */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <button
              onClick={() => setCurrentTab('discovery')}
              className="flex items-center gap-2.5 group text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-emerald-600 transition">
                    YUNAY
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                    Local
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
                  Digital Storefronts
                </p>
              </div>
            </button>

            {/* City Selector */}
            <div className="hidden lg:flex items-center gap-1 text-slate-700 bg-slate-100/90 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Filter shops by city"
                className="bg-transparent border-none outline-none cursor-pointer pr-1 text-slate-800 font-bold"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search local stores, groceries, bakery, apparel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white rounded-xl text-xs sm:text-sm border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 1. LOGGED OUT STATE */}
            {!currentUser && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('discovery')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentTab === 'discovery'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  <span>All Shop Stores</span>
                </button>

                <button
                  onClick={() => onOpenLogin('signin')}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition border border-slate-200 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-600" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => onOpenLogin('signup')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 hover:shadow-lg transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}

            {/* 2. LOGGED IN: SUPER ADMIN NAVIGATION */}
            {currentUser?.role === 'super_admin' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentTab === 'admin'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Hub</span>
                </button>

                <button
                  onClick={() => setCurrentTab('discovery')}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentTab === 'discovery'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  <span>All Stores</span>
                </button>
              </div>
            )}

            {/* 3. LOGGED IN: SHOP OWNER NAVIGATION */}
            {currentUser?.role === 'shopkeeper' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('vendor')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentTab === 'vendor'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>🏢 My Company Profile</span>
                </button>

                <button
                  onClick={() => setCurrentTab('discovery')}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentTab === 'discovery'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Marketplace</span>
                </button>
              </div>
            )}

            {/* 4. LOGGED IN: CUSTOMER NAVIGATION */}
            {currentUser?.role === 'customer' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('discovery')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentTab === 'discovery'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>🏬 All Shop Stores</span>
                </button>

                <button
                  onClick={() => setCurrentTab('customer_orders')}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentTab === 'customer_orders'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>My Orders</span>
                </button>
              </div>
            )}

            {/* AUTHENTICATED SHARED: Notifications & Cart (Customer Only) */}
            {currentUser && (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition cursor-pointer"
                    title="Notifications"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">Notifications</span>
                        <span className="text-xs text-slate-500">{notifications.length} alerts</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-500">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-3 hover:bg-slate-50 text-xs">
                              <p className="font-semibold text-slate-800">{n.title}</p>
                              <p className="text-slate-600 mt-0.5">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Cart */}
                {currentUser.role === 'customer' && (
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-2 rounded-xl border border-emerald-200 text-xs font-bold transition relative cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">Cart</span>
                    {cartCount > 0 && (
                      <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs">
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Profile Pill & User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 pl-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 transition cursor-pointer"
                    aria-label="User Account Menu"
                  >
                    <div className="text-left hidden sm:block max-w-[120px] truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {currentUser.role === 'shopkeeper'
                          ? currentUser.shop?.name || currentUser.name
                          : currentUser.name}
                      </p>
                      <p className="text-[10px] text-slate-500 capitalize">
                        {currentUser.role === 'super_admin'
                          ? 'Super Admin'
                          : currentUser.role === 'shopkeeper'
                          ? 'Shop Owner'
                          : 'My Profile'}
                      </p>
                    </div>

                    <img
                      src={
                        currentUser.avatarUrl ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
                      }
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {/* Clean User Account Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{currentUser.email || currentUser.phone}</p>
                        <div className="mt-1.5">
                          <span
                            className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              currentUser.role === 'super_admin'
                                ? 'bg-purple-100 text-purple-800'
                                : currentUser.role === 'shopkeeper'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {currentUser.role === 'super_admin'
                              ? 'Platform Administrator'
                              : currentUser.role === 'shopkeeper'
                              ? 'Verified Merchant'
                              : 'Customer Account'}
                          </span>
                        </div>
                      </div>

                      <div className="p-2 space-y-1">
                        {currentUser.role === 'shopkeeper' && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              setCurrentTab('vendor');
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition"
                          >
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            <span>My Company Dashboard</span>
                          </button>
                        )}

                        {currentUser.role === 'customer' && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              setCurrentTab('customer_orders');
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition"
                          >
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span>My Orders & Invoices</span>
                          </button>
                        )}

                        {currentUser.role === 'super_admin' && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              setCurrentTab('admin');
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition"
                          >
                            <ShieldCheck className="w-4 h-4 text-purple-600" />
                            <span>Super Admin Console</span>
                          </button>
                        )}

                        <div className="border-t border-slate-100 pt-1 mt-1">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              logout();
                              setCurrentTab('discovery');
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition cursor-pointer"
                          >
                            <LogOut className="w-4 h-4 text-rose-600" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
