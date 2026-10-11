'use client';

import React, { useState, useEffect } from 'react';
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
  Users,
  Radio,
  Server,
  Clock,
  Activity,
  Wallet,
  Pencil,
  Loader2,
  PanelLeft,
  CheckCircle2,
  Sparkles,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../lib/hooks/useAuth';
import { useNotificationStore } from '../../lib/stores/useNotificationStore';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { toggleSidebar } from '../../lib/store/slices/uiSlice';
import { ThemeToggle } from '../../components/ui/theme-toggle';
import { Avatar } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { formatCurrency } from '../../lib/utils';
import {
  requestNotificationPermissionAndRegisterToken,
  listenToForegroundMessages,
} from '../../lib/firebase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, updateProfile } = useAuth();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);

  const { notifications, unreadCount, markAsRead, markAllAsRead, addNotification } = useNotificationStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Edit Profile Dialog State
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Synchronize FCM Push Token and listen to foreground notifications
  useEffect(() => {
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

  // Navigation Items - Strictly Separated by Role
  const adminNavItems = [
    { name: 'Governance Hub', href: '/dashboard/admin', icon: ShieldAlert },
    { name: 'User Directory', href: '/dashboard/admin?tab=users', icon: Users },
    { name: 'Broadcast Studio', href: '/dashboard/admin?tab=broadcast', icon: Radio },
    { name: 'Worker Queues', href: '/dashboard/admin?tab=queues', icon: Server },
    { name: 'Security Audit Trail', href: '/dashboard/admin?tab=audit', icon: Clock },
    { name: 'Circuit Breakers', href: '/dashboard/admin?tab=overview', icon: Activity },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const creatorNavItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Compose & AI', href: '/dashboard/compose', icon: PenSquare, badge: 'AI' },
    { name: 'Accounts', href: '/dashboard/accounts', icon: Share2 },
    { name: 'Posts Calendar', href: '/dashboard/posts', icon: Calendar },
    { name: 'Media Library', href: '/dashboard/media', icon: ImageIcon },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Billing & Wallet', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  // Pick exactly the right navigation items based on role
  const navItems = isAdmin ? adminNavItems : creatorNavItems;

  const handleOpenProfile = () => {
    setEditFullName(user?.fullName || user?.name || '');
    setEditPhone(user?.phone || '');
    setEditBio(user?.bio || '');
    setEditAvatarUrl(user?.profileImageUrl || user?.avatar_url || '');
    setProfileSaved(false);
    setProfileDialogOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile({
        fullName: editFullName.trim(),
        name: editFullName.trim(),
        phone: editPhone.trim(),
        bio: editBio.trim(),
        profileImageUrl: editAvatarUrl.trim(),
        avatar_url: editAvatarUrl.trim(),
      } as any);
      setProfileSaved(true);
      setTimeout(() => {
        setProfileDialogOpen(false);
        setProfileSaved(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  const displayName = user?.fullName || user?.name || (isAdmin ? 'Administrator' : 'Creator');
  const displayEmail = user?.email || (isAdmin ? 'admin@postspritz.com' : 'user@postspritz.com');
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-background text-foreground antialiased selection:bg-primary selection:text-white">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-card/70 backdrop-blur-2xl p-4 transition-all duration-300 shrink-0 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center justify-between px-2 mb-6">
          <Link href={isAdmin ? '/dashboard/admin' : '/dashboard'} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#17191C] flex items-center justify-center p-1.5 shadow-lg shadow-primary/25 border border-primary/30 shrink-0">
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
                  {isAdmin ? 'Governance Console' : 'Autonomous Social Director'}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {sidebarOpen && (
            <p className="px-3 text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider mb-2">
              {isAdmin ? 'Platform Control' : 'Main Workspace'}
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href.split('?')[0];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span className="flex-1 truncate">{item.name}</span>}
                {sidebarOpen && (item as any).badge && (
                  <Badge variant="glow" className="text-[9px] py-0 px-1.5 uppercase font-bold">
                    {(item as any).badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card in Footer (Matching Fe AppSidebar) */}
        <div className="pt-3 border-t border-border/60 space-y-2">
          <div
            onClick={handleOpenProfile}
            className="group flex items-center justify-between p-2 rounded-xl hover:bg-muted/60 cursor-pointer transition-colors"
            title="View & Edit Profile"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                src={user?.profileImageUrl || user?.avatar_url}
                alt={displayName}
                className="w-8 h-8 border-border shrink-0 ring-1 ring-primary/20"
              />
              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate leading-tight">
                    {displayName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[10px] text-muted-foreground truncate max-w-[90px]">
                      {displayEmail}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1 py-0 uppercase font-bold shrink-0 ${
                        isAdmin
                          ? 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {user?.role || 'CREATOR'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
            )}
          </div>

          <Button
            variant="ghost"
            size={sidebarOpen ? 'default' : 'icon'}
            onClick={handleSignOut}
            className={`w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="ml-2 font-medium">Log out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-xl px-5 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileMenuOpen(!mobileMenuOpen);
                } else {
                  dispatch(toggleSidebar());
                }
              }}
              className="p-1.5 rounded-lg border border-border bg-card/60 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle Navigation"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-muted-foreground">
              {isAdmin ? 'Platform Governance Console' : 'Creator Workspace'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Context Pill */}
            {isAdmin ? (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 border-emerald-500/30 text-emerald-400 gap-1 py-0.5 px-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Cluster Operational
              </Badge>
            ) : (
              <Link
                href="/dashboard/billing"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/10 text-[11px] font-semibold text-primary hover:bg-primary/15 transition-all"
              >
                <Wallet className="w-3 h-3" />
                <span>{formatCurrency(((user?.wallet_balance_paise ?? user?.walletBalancePaise) || 0) / 100, 'INR')}</span>
              </Link>
            )}

            {/* Dark / Light Mode Toggle */}
            <ThemeToggle className="h-8 w-8" />

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-all"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-border bg-card/95 backdrop-blur-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <span className="text-xs font-bold">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-primary hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border/40 py-1 text-xs">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`py-2 px-2 rounded-lg cursor-pointer transition-colors ${
                            n.isRead ? 'opacity-70 hover:bg-muted/40' : 'bg-primary/5 hover:bg-primary/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-foreground text-xs">{n.title}</p>
                            {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar trigger */}
            <div onClick={handleOpenProfile} className="cursor-pointer hover:opacity-80 transition-opacity">
              <Avatar
                src={user?.profileImageUrl || user?.avatar_url}
                alt={displayName}
                className="w-8 h-8 border border-border"
              />
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-card/95 backdrop-blur-xl p-4 space-y-1 z-30">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-5 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Quick Edit Profile Dialog (Inspired by Fe/src/components/AppSidebar.tsx) */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} className="max-w-md">
        <DialogHeader className="text-left pb-2 border-b border-border/60">
          <div className="flex items-center gap-3">
            <Avatar
              src={editAvatarUrl || user?.profileImageUrl || user?.avatar_url}
              alt={displayName}
              className="w-12 h-12 border-2 border-primary/20"
            />
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                User Profile & Credentials
                <Badge variant="outline" className="text-[9px] uppercase font-bold py-0.5">
                  {user?.role || 'CREATOR'}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Manage your account identity, display name, and contact details.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSaveProfile} className="space-y-3.5 pt-3 text-xs">
          {profileSaved && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Account Email</label>
            <Input
              value={user?.email || ''}
              readOnly
              className="bg-muted/50 text-muted-foreground cursor-not-allowed font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">Email is tied to authentication and cannot be changed.</p>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Full Name</label>
            <Input
              required
              placeholder="e.g. Aditya Kumar"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Phone Number</label>
            <Input
              placeholder="+91 98765 43210"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Avatar Image URL</label>
            <Input
              placeholder="https://..."
              value={editAvatarUrl}
              onChange={(e) => setEditAvatarUrl(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Bio / Headline</label>
            <Input
              placeholder="Digital Creator, Social Strategist..."
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-border/60 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setProfileDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={profileSaving}
              className="text-xs bg-primary hover:bg-primary/90 text-white gap-1.5"
            >
              {profileSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
