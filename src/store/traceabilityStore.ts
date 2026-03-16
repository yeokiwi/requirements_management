import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { TraceabilityLink } from '@/types';
import { getAll, put, deleteRecord, getAllByIndex } from '@/db/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TraceabilityState {
  links: TraceabilityLink[];
  loading: boolean;

  // Actions
  loadLinks: (projectId: string) => Promise<void>;
  createLink: (
    data: Omit<TraceabilityLink, 'id' | 'createdAt'>
  ) => Promise<TraceabilityLink>;
  deleteLink: (id: string) => Promise<void>;
  getLinksForRequirement: (reqId: string) => TraceabilityLink[];
  getUpstreamLinks: (reqId: string) => TraceabilityLink[];
  getDownstreamLinks: (reqId: string) => TraceabilityLink[];
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTraceabilityStore = create<TraceabilityState>((set, get) => ({
  links: [],
  loading: false,

  loadLinks: async (projectId) => {
    set({ loading: true });
    try {
      const links = (await getAll('traceabilityLinks', projectId)) as TraceabilityLink[];
      set({ links, loading: false });
    } catch (error) {
      console.error('Failed to load traceability links:', error);
      set({ loading: false });
    }
  },

  createLink: async (data) => {
    const link: TraceabilityLink = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    await put('traceabilityLinks', link);

    set((state) => ({
      links: [...state.links, link],
    }));

    return link;
  },

  deleteLink: async (id) => {
    await deleteRecord('traceabilityLinks', id);

    set((state) => ({
      links: state.links.filter((l) => l.id !== id),
    }));
  },

  getLinksForRequirement: (reqId) => {
    const { links } = get();
    return links.filter((l) => l.sourceId === reqId || l.targetId === reqId);
  },

  getUpstreamLinks: (reqId) => {
    const { links } = get();
    // Upstream: links where this requirement is the target (something points to it)
    return links.filter((l) => l.targetId === reqId);
  },

  getDownstreamLinks: (reqId) => {
    const { links } = get();
    // Downstream: links where this requirement is the source (it points to something)
    return links.filter((l) => l.sourceId === reqId);
  },
}));
