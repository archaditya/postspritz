import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { useAuthStore, UserProfile } from '../stores/useAuthStore';
import {
  requestNotificationPermissionAndRegisterToken,
  unregisterFcmTokenOnLogout,
  signInWithGooglePopup,
} from '../firebase';

function normalizeUser(data: any): UserProfile {
  if (!data) return data;
  return {
    ...data,
    fullName: data.fullName || data.name || 'User',
    name: data.name || data.fullName || 'User',
    profileImageUrl: data.profileImageUrl || data.avatar_url,
    avatar_url: data.avatar_url || data.profileImageUrl,
    walletBalancePaise: data.walletBalancePaise ?? data.wallet_balance_paise ?? 0,
    wallet_balance_paise: data.wallet_balance_paise ?? data.walletBalancePaise ?? 0,
  };
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { user, setUser, setToken, logout: storeLogout, isAuthenticated } = useAuthStore();

  const profileQuery = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async (): Promise<UserProfile> => {
      const res = await apiClient.get('/users/me');
      const data = normalizeUser(res.data.data);
      setUser(data);
      return data;
    },
    enabled:
      typeof window !== 'undefined' &&
      !!(
        localStorage.getItem('postspritz_access_token') ||
        localStorage.getItem('sharepostsync_access_token') ||
        localStorage.getItem('pushpost_access_token')
      ),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await apiClient.post('/auth/login', credentials);
      return res.data.data;
    },
    onSuccess: (data) => {
      setToken(data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('postspritz_refresh_token', data.refreshToken || '');
      }
      setUser(normalizeUser(data.user));
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      // Automatically register FCM token for push notifications on login
      setTimeout(() => {
        requestNotificationPermissionAndRegisterToken().catch(console.warn);
      }, 500);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: { fullName: string; email: string; password: string }) => {
      const res = await apiClient.post('/auth/register', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      setToken(data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('postspritz_refresh_token', data.refreshToken || '');
      }
      setUser(normalizeUser(data.user));
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      // Automatically register FCM token for push notifications on register
      setTimeout(() => {
        requestNotificationPermissionAndRegisterToken().catch(console.warn);
      }, 500);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: Partial<UserProfile>) => {
      const res = await apiClient.patch('/users/me', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      setUser(normalizeUser(data));
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      const idToken = await signInWithGooglePopup();
      const fcmToken = typeof window !== 'undefined' ? localStorage.getItem('postspritz_fcm_token') || undefined : undefined;
      const res = await apiClient.post('/auth/google', { idToken, fcmToken, deviceType: 'web' });
      return res.data.data;
    },
    onSuccess: (data) => {
      setToken(data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('postspritz_refresh_token', data.refreshToken || '');
      }
      setUser(normalizeUser(data.user));
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      setTimeout(() => {
        requestNotificationPermissionAndRegisterToken().catch(console.warn);
      }, 500);
    },
  });

  const handleLogout = async () => {
    try {
      await unregisterFcmTokenOnLogout();
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API cleanup notice:', err);
    } finally {
      storeLogout();
      queryClient.clear();
    }
  };

  return {
    user: user || profileQuery.data,
    isLoading: profileQuery.isLoading,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    loginWithGoogle: googleLoginMutation.mutateAsync,
    isLoggingInWithGoogle: googleLoginMutation.isPending,
    googleLoginError: googleLoginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    updateProfile: updateProfileMutation.mutateAsync,
    logout: handleLogout,
  };
}
