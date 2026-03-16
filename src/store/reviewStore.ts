import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Review, ReviewItem } from '@/types';
import { getAll, put } from '@/db/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReviewState {
  reviews: Review[];
  loading: boolean;

  // Actions
  loadReviews: (projectId: string) => Promise<void>;
  createReview: (
    data: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'closedAt'>
  ) => Promise<Review>;
  updateReview: (id: string, updates: Partial<Review>) => Promise<void>;
  closeReview: (id: string) => Promise<void>;
  updateReviewItem: (
    reviewId: string,
    requirementId: string,
    updates: Partial<ReviewItem>,
  ) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],
  loading: false,

  loadReviews: async (projectId) => {
    set({ loading: true });
    try {
      const reviews = (await getAll('reviews', projectId)) as Review[];
      set({ reviews, loading: false });
    } catch (error) {
      console.error('Failed to load reviews:', error);
      set({ loading: false });
    }
  },

  createReview: async (data) => {
    const now = new Date().toISOString();
    const review: Review = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    };

    await put('reviews', review);

    set((state) => ({
      reviews: [...state.reviews, review],
    }));

    return review;
  },

  updateReview: async (id, updates) => {
    const state = get();
    const existing = state.reviews.find((r) => r.id === id);
    if (!existing) return;

    const updated: Review = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    await put('reviews', updated);

    set((s) => ({
      reviews: s.reviews.map((r) => (r.id === id ? updated : r)),
    }));
  },

  closeReview: async (id) => {
    const state = get();
    const existing = state.reviews.find((r) => r.id === id);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated: Review = {
      ...existing,
      status: 'Closed',
      closedAt: now,
      updatedAt: now,
    };

    await put('reviews', updated);

    set((s) => ({
      reviews: s.reviews.map((r) => (r.id === id ? updated : r)),
    }));
  },

  updateReviewItem: async (reviewId, requirementId, updates) => {
    const state = get();
    const existing = state.reviews.find((r) => r.id === reviewId);
    if (!existing) return;

    const now = new Date().toISOString();
    const updatedItems = existing.items.map((item) =>
      item.requirementId === requirementId
        ? { ...item, ...updates }
        : item,
    );

    const updated: Review = {
      ...existing,
      items: updatedItems,
      updatedAt: now,
    };

    await put('reviews', updated);

    set((s) => ({
      reviews: s.reviews.map((r) => (r.id === reviewId ? updated : r)),
    }));
  },
}));
