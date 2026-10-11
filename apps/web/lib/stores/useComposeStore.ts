import { create } from 'zustand';

export interface ComposeMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video';
  aspectRatio?: '1:1' | '16:9' | '4:5' | '9:16';
}

interface ComposeState {
  content: string;
  selectedPlatforms: string[];
  media: ComposeMedia[];
  scheduledAt: string | null;
  hasUrl: boolean;
  xEstimatedCostUsd: number;
  xPassThroughAcknowledged: boolean;
  setContent: (content: string) => void;
  togglePlatform: (platformId: string) => void;
  setSelectedPlatforms: (platforms: string[]) => void;
  addMedia: (media: ComposeMedia) => boolean; // returns false if max 5 exceeded
  removeMedia: (mediaId: string) => void;
  clearMedia: () => void;
  setScheduledAt: (date: string | null) => void;
  setXAcknowledged: (acknowledged: boolean) => void;
  reset: () => void;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

export const useComposeStore = create<ComposeState>((set, get) => ({
  content: '',
  selectedPlatforms: ['linkedin', 'x'],
  media: [],
  scheduledAt: null,
  hasUrl: false,
  xEstimatedCostUsd: 0.015,
  xPassThroughAcknowledged: false,

  setContent: (content: string) => {
    const hasUrl = URL_REGEX.test(content);
    const xCost = hasUrl ? 0.20 : 0.015;
    set({ content, hasUrl, xEstimatedCostUsd: xCost });
  },

  togglePlatform: (platformId: string) => {
    const current = get().selectedPlatforms;
    const exists = current.includes(platformId);
    const updated = exists ? current.filter((p) => p !== platformId) : [...current, platformId];
    set({ selectedPlatforms: updated });
  },

  setSelectedPlatforms: (platforms: string[]) => set({ selectedPlatforms: platforms }),

  addMedia: (item: ComposeMedia) => {
    const current = get().media;
    // HARD ENFORCE MAX 5 IMAGES / MEDIA
    if (current.length >= 5) {
      return false;
    }
    set({ media: [...current, item] });
    return true;
  },

  removeMedia: (mediaId: string) => {
    set({ media: get().media.filter((m) => m.id !== mediaId) });
  },

  clearMedia: () => set({ media: [] }),

  setScheduledAt: (scheduledAt: string | null) => set({ scheduledAt }),

  setXAcknowledged: (xPassThroughAcknowledged: boolean) => set({ xPassThroughAcknowledged }),

  reset: () =>
    set({
      content: '',
      selectedPlatforms: ['linkedin', 'x'],
      media: [],
      scheduledAt: null,
      hasUrl: false,
      xEstimatedCostUsd: 0.015,
      xPassThroughAcknowledged: false,
    }),
}));
