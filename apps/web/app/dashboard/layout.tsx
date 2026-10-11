'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  PenSquare,
  Share2,
  Calendar,
  CreditCard,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  BarChart3,
  Image as ImageIcon,
  ShieldAlert,
  Wallet,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import { useNotificationStore } from '../../lib/stores/useNotificationStore';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { toggleSidebar } from '../../lib/store/slices/uiSlice';
import { ThemeToggle } from '../../components/ui/theme-toggle';
import { Avatar } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { formatCurrency } from '../../lib/utils';
import {
  requestNotificationPermissionAndRegisterToken,
  listenToForegroundMessages,
} from '../../lib/firebase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);

  const { notifications, unreadCount, markAsRead, markAllAsRead, addNotification } = useNotificationStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Synchronize FCM Push Token and listen to foreground notifications
  React.useEffect(() => {
    if (user) {
      requestNotificationPermissionAndRegisterToken().catch(console.warn);

      const unsubscribe = listenToForegroundMessages((payload) => {
        const title = payload.notification?.title || payload.data?.title || 'PostSpritz Notification';
        const body = payload.notification?.body || payload.data?.body || '';
        addNotification({
          id: String(Date.now()),
          title,
          body,
          read: false,
          created_at: new Date().toISOString(),
        } as any);
      });

      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, [user, addNotification]);

  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  const adminNavItems = [
    { name: 'Governance Hub', href: '/dashboard/admin', icon: ShieldAlert, badge: 'ADMIN' },
  ];

  const creatorNavItems = [
    { name: isAdmin ? 'Creator Sandbox' : 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Compose & AI', href: '/dashboard/compose', icon: PenSquare, badge: 'AI' },
    { name: 'Accounts', href: '/dashboard/accounts', icon: Share2 },
    { name: 'Posts Calendar', href: '/dashboard/posts', icon: Calendar },
    { name: 'Media Library', href: '/dashboard/media', icon: ImageIcon },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Billing & Wallet', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground antialiased selection:bg-primary selection:text-white">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-2xl p-5 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center justify-between px-2 mb-6">
          <Link href={isAdmin ? '/dashboard/admin' : '/dashboard'} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#17191C] flex items-center justify-center p-1.5 shadow-lg shadow-primary/25 border border-primary/30">
              <svg viewBox="0 0 128 128" className="w-7 h-7" aria-label="PostSpritz Logo">
                <path d="M20 54 103 21c5.7-2.3 11.3 3.3 8.9 9L72 106c-2.1 5-9.4 4.8-11.1-.4L49.4 72.1 15 60c-5.2-1.8-5.1-9.1 5-6Z" fill="#FF5A1F"/>
                <path d="M49.4 72.1 100 24 61 83.4Z" fill="#E84712" opacity=".72"/>
                <path d="M8 77H31M2 91H22" stroke="#FF5A1F" strokeWidth="8" strokeLinecap="round"/>
              </svg>
            </div>
            {sidebarOpen && (
              <div>
                <span className="text-lg font-extrabold tracking-tight text-foreground block leading-tight">
                  Post<span className="text-primary">Spritz</span>
                </span>
                <span className="text-[9px] font-medium text-muted-foreground block truncate max-w-[130px]">
                  {isAdmin ? 'Governance Console' : 'Create once. Spritz everywhere.'}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-4 overflow-y-auto">
          {isAdmin && (
            <div className="space-y-1.5">
              {sidebarOpen && (
                <p className="px-3 text-[10px] uppercase font-bold text-indigo-400/80 tracking-wider">
                  Platform Control
                </p>
              )}
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-indigo-300 hover:text-white hover:bg-indigo-500/10'
                    }`}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {sidebarOpen && <span className="flex-1 truncate">{item.name}</span>}
                    {sidebarOpen && item.badge && (
                      <Badge className="text-[9px] py-0 px-1.5 bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="space-y-1.5">
            {sidebarOpen && isAdmin && (
              <p className="px-3 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider pt-2">
                Creator Workspace
              </p>
            )}
            {creatorNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {sidebarOpen && <span className="flex-1 truncate">{item.name}</span>}
                  {sidebarOpen && item.badge && (
                    <Badge variant="glow" className="text-[10px] py-0 px-1.5 uppercase font-bold">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Card & Sign Out */}
        <div className="pt-4 border-t border-border/60 space-y-3">
          {sidebarOpen && (
            <div className="flex items-center gap-3 px-2 py-1">
              <Avatar
                src={user?.avatar_url || user?.profileImageUrl}
                alt={user?.name || user?.fullName || 'User'}
                className="w-9 h-9 border-primary/20"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.name || user?.fullName || 'Super Administrator'}</p>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email || 'admin@postspritz.com'}</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size={sidebarOpen ? 'default' : 'icon'}
            onClick={handleSignOut}
            className={`w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="ml-2 text-sm">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/40 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileMenuOpen(!mobileMenuOpen);
                } else {
                  dispatch(toggleSidebar());
                }
              }}
              className="p-2 rounded-xl border border-border bg-card/60 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-1.5 md:hidden">
              <svg viewBox="0 0 128 128" className="w-5 h-5">
                <path d="M20 54 103 21c5.7-2.3 11.3 3.3 8.9 9L72 106c-2.1 5-9.4 4.8-11.1-.4L49.4 72.1 15 60c-5.2-1.8-5.1-9.1 5-6Z" fill="#FF5A1F"/>
                <path d="M49.4 72.1 100 24 61 83.4Z" fill="#E84712" opacity=".72"/>
                <path d="M8 77H31M2 91H22" stroke="#FF5A1F" strokeWidth="8" strokeLinecap="round"/>
              </svg>
              <span className="font-extrabold text-base">Post<span className="text-primary">Spritz</span></span>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full border border-border/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Publisher Cluster: Healthy</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Wallet Balance Pill */}
            <Link
              href="/dashboard/billing"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/15 transition-all shadow-sm"
              title="Click to recharge wallet for X API tweets"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{formatCurrency(user?.walletBalancePaise || 0, 'INR')}</span>
              <span className="text-[10px] opacity-75 font-normal">(X Tweet Fuel)</span>
            </Link>

            {/* Dark / Light Mode Toggle */}
            <ThemeToggle />

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-all"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-border bg-card/95 backdrop-blur-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <span className="text-sm font-semibold">Live Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border/40 py-2">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        No notifications yet. You will see live dispatch updates here!
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`py-2.5 px-2 rounded-lg cursor-pointer transition-colors ${
                            n.isRead ? 'opacity-70 hover:bg-muted/40' : 'bg-primary/5 hover:bg-primary/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-foreground">{n.title}</p>
                            {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <Link href="/dashboard/settings" className="hover:opacity-85 transition-opacity">
              <Avatar
                src={user?.profileImageUrl}
                alt={user?.fullName || 'User'}
                className="w-9 h-9 border border-border"
              />
            </Link>
          </div>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-card/95 backdrop-blur-xl p-4 space-y-2 z-30">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
