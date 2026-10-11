import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export interface PostItem {
  id: string;
  userId: string;
  content: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'partially_failed';
  scheduledAt?: string;
  publishedAt?: string;
  hasUrl: boolean;
  xPassThroughFeeUsd?: number;
  xPassThroughFeePaid?: boolean;
  mediaUrls?: string[];
  targets?: {
    id: string;
    platform: string;
    status: string;
    platformPostId?: string;
    errorMessage?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export function usePosts(params?: { status?: string; page?: number; limit?: number }) {
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ['posts', params],
    queryFn: async (): Promise<{ posts: PostItem[]; total: number }> => {
      const res = await apiClient.get('/posts', { params });
      return {
        posts: res.data.data || [],
        total: res.data.meta?.total || (res.data.data || []).length,
      };
    },
    staleTime: 1000 * 30,
  });

  const createPostMutation = useMutation({
    mutationFn: async (payload: {
      content: string;
      platformAccountIds: string[];
      scheduledAt?: string | null;
      mediaIds?: string[];
      xPassThroughAcknowledged?: boolean;
    }) => {
      const res = await apiClient.post('/posts', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const publishNowMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiClient.post(`/posts/${postId}/publish`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const retryTargetMutation = useMutation({
    mutationFn: async (targetId: string) => {
      const res = await apiClient.post(`/posts/targets/${targetId}/retry`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiClient.delete(`/posts/${postId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  return {
    posts: postsQuery.data?.posts || [],
    total: postsQuery.data?.total || 0,
    isLoading: postsQuery.isLoading,
    isError: postsQuery.isError,
    refetch: postsQuery.refetch,
    createPost: createPostMutation.mutateAsync,
    isCreating: createPostMutation.isPending,
    publishNow: publishNowMutation.mutateAsync,
    isPublishing: publishNowMutation.isPending,
    retryTarget: retryTargetMutation.mutateAsync,
    isRetrying: retryTargetMutation.isPending,
    deletePost: deletePostMutation.mutateAsync,
    isDeleting: deletePostMutation.isPending,
  };
}
