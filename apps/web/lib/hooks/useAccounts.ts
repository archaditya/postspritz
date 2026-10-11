import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export interface SocialAccountItem {
  id: string;
  userId: string;
  platform: 'linkedin' | 'facebook' | 'instagram' | 'threads' | 'x' | 'reddit';
  accountName: string;
  accountUsername?: string;
  profilePicUrl?: string;
  tokenExpiresAt?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export function useAccounts() {
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: ['social-accounts'],
    queryFn: async (): Promise<SocialAccountItem[]> => {
      const res = await apiClient.get('/social-accounts');
      return res.data.data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const res = await apiClient.delete(`/social-accounts/${accountId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    },
  });

  const getOAuthUrlMutation = useMutation({
    mutationFn: async (platform: string) => {
      const res = await apiClient.get(`/social-accounts/connect/${platform}`);
      return res.data.data?.url as string;
    },
  });

  return {
    accounts: accountsQuery.data || [],
    isLoading: accountsQuery.isLoading,
    isError: accountsQuery.isError,
    refetch: accountsQuery.refetch,
    disconnect: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,
    getConnectUrl: getOAuthUrlMutation.mutateAsync,
  };
}
