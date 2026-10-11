import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export interface GeneratePostRequest {
  topic: string;
  tone: 'professional' | 'casual' | 'storytelling' | 'bold' | 'educational';
  targetPlatforms: string[];
  includeHashtags?: boolean;
  userPromptCustomization?: string;
}

export interface GenerateImageIdeasRequest {
  topic: string;
  context: string;
  platform: 'instagram' | 'x' | 'linkedin' | 'threads' | 'facebook';
  userVisionDescription?: string;
  imageCount: number; // Max 5 enforced!
}

export interface GeneratedPostResponse {
  variations: {
    platform: string;
    content: string;
    hashtags: string[];
    suggestedAspectRatios: string[];
    characterCount: number;
    guardrailScore: number;
  }[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  };
}

export interface GeneratedImageResponse {
  prompts: {
    title: string;
    expandedVisualPrompt: string;
    negativePrompt: string;
    recommendedAspectRatio: '1:1' | '16:9' | '4:5' | '9:16';
    styleReference: string;
    previewPlaceholderUrl: string;
  }[];
  totalRequested: number;
  usage: {
    estimatedTokens: number;
    estimatedCostUsd: number;
  };
}

export function useAI() {
  const generateTextMutation = useMutation({
    mutationFn: async (payload: GeneratePostRequest): Promise<GeneratedPostResponse> => {
      const res = await apiClient.post('/ai/generate-post', payload);
      return res.data.data;
    },
  });

  const generateImagesMutation = useMutation({
    mutationFn: async (payload: GenerateImageIdeasRequest): Promise<GeneratedImageResponse> => {
      // Hard clamp client-side as well
      const clampedCount = Math.min(Math.max(1, payload.imageCount), 5);
      const res = await apiClient.post('/ai/expand-image-prompts', {
        ...payload,
        imageCount: clampedCount,
      });
      return res.data.data;
    },
  });

  return {
    generatePost: generateTextMutation.mutateAsync,
    isGeneratingPost: generateTextMutation.isPending,
    generateError: generateTextMutation.error,
    generateImages: generateImagesMutation.mutateAsync,
    isGeneratingImages: generateImagesMutation.isPending,
    imageError: generateImagesMutation.error,
  };
}
