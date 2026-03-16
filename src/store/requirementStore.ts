import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Requirement, ChangeRecord } from '@/types';
import { getAll, put, deleteRecord, getById } from '@/db/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RequirementState {
  requirements: Requirement[];
  filteredRequirements: Requirement[];
  selectedIds: string[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  filters: Record<string, any>;
  loading: boolean;

  // Actions
  loadRequirements: (projectId: string) => Promise<void>;
  createRequirement: (
    data: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deleted' | 'attachments' | 'comments'>
  ) => Promise<Requirement>;
  updateRequirement: (id: string, updates: Partial<Requirement>) => Promise<void>;
  deleteRequirement: (id: string) => Promise<void>;
  duplicateRequirement: (id: string) => Promise<Requirement | null>;
  bulkUpdateStatus: (ids: string[], status: string) => Promise<void>;
  bulkUpdatePriority: (ids: string[], priority: Requirement['priority']) => Promise<void>;
  bulkUpdateOwner: (ids: string[], owner: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkAddTag: (ids: string[], tag: string) => Promise<void>;
  setSort: (field: string, direction: 'asc' | 'desc') => void;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelected: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyFiltersAndSort(
  requirements: Requirement[],
  filters: Record<string, any>,
  sortField: string,
  sortDirection: 'asc' | 'desc',
): Requirement[] {
  let result = requirements.filter((r) => !r.deleted);

  // Apply filters
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    if (key === 'search' && typeof value === 'string') {
      const lc = value.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(lc) ||
          r.description.toLowerCase().includes(lc) ||
          r.requirementId.toLowerCase().includes(lc),
      );
    } else if (key === 'status') {
      result = result.filter((r) => r.status === value);
    } else if (key === 'priority') {
      result = result.filter((r) => r.priority === value);
    } else if (key === 'type') {
      result = result.filter((r) => r.type === value);
    } else if (key === 'moduleId') {
      result = result.filter((r) => r.moduleId === value);
    } else if (key === 'tags' && Array.isArray(value) && value.length > 0) {
      result = result.filter((r) => value.some((t: string) => r.tags.includes(t)));
    }
  }

  // Apply sort
  result.sort((a, b) => {
    const aVal = (a as any)[sortField];
    const bVal = (b as any)[sortField];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  return result;
}

async function recordChange(
  projectId: string,
  requirementId: string,
  changeType: ChangeRecord['changeType'],
  changedBy: string,
  previousValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null,
  description: string,
): Promise<void> {
  const record: ChangeRecord = {
    id: uuidv4(),
    projectId,
    requirementId,
    changeType,
    changedBy,
    changedAt: new Date().toISOString(),
    previousValue,
    newValue,
    description,
  };
  await put('changeHistory', record);
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useRequirementStore = create<RequirementState>((set, get) => ({
  requirements: [],
  filteredRequirements: [],
  selectedIds: [],
  sortField: 'updatedAt',
  sortDirection: 'desc',
  filters: {},
  loading: false,

  loadRequirements: async (projectId) => {
    set({ loading: true });
    try {
      const requirements = (await getAll('requirements', projectId)) as Requirement[];
      const state = get();
      const filteredRequirements = applyFiltersAndSort(
        requirements,
        state.filters,
        state.sortField,
        state.sortDirection,
      );
      set({ requirements, filteredRequirements, loading: false, selectedIds: [] });
    } catch (error) {
      console.error('Failed to load requirements:', error);
      set({ loading: false });
    }
  },

  createRequirement: async (data) => {
    const now = new Date().toISOString();
    const requirement: Requirement = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      version: 1,
      deleted: false,
      attachments: [],
      comments: [],
    };

    await put('requirements', requirement);
    await recordChange(
      requirement.projectId,
      requirement.id,
      'created',
      requirement.createdBy,
      null,
      requirement as unknown as Record<string, unknown>,
      `Created requirement "${requirement.title}"`,
    );

    set((state) => {
      const requirements = [...state.requirements, requirement];
      return {
        requirements,
        filteredRequirements: applyFiltersAndSort(
          requirements,
          state.filters,
          state.sortField,
          state.sortDirection,
        ),
      };
    });

    return requirement;
  },

  updateRequirement: async (id, updates) => {
    const state = get();
    const existing = state.requirements.find((r) => r.id === id);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated: Requirement = {
      ...existing,
      ...updates,
      id,
      updatedAt: now,
      version: existing.version + 1,
    };

    await put('requirements', updated);
    await recordChange(
      existing.projectId,
      id,
      'updated',
      updated.updatedBy || existing.updatedBy,
      existing as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>,
      `Updated requirement "${updated.title}"`,
    );

    set((s) => {
      const requirements = s.requirements.map((r) => (r.id === id ? updated : r));
      return {
        requirements,
        filteredRequirements: applyFiltersAndSort(
          requirements,
          s.filters,
          s.sortField,
          s.sortDirection,
        ),
      };
    });
  },

  deleteRequirement: async (id) => {
    const state = get();
    const existing = state.requirements.find((r) => r.id === id);
    if (!existing) return;

    // Soft delete
    const updated: Requirement = {
      ...existing,
      deleted: true,
      updatedAt: new Date().toISOString(),
      version: existing.version + 1,
    };

    await put('requirements', updated);
    await recordChange(
      existing.projectId,
      id,
      'deleted',
      existing.updatedBy,
      existing as unknown as Record<string, unknown>,
      null,
      `Deleted requirement "${existing.title}"`,
    );

    set((s) => {
      const requirements = s.requirements.map((r) => (r.id === id ? updated : r));
      return {
        requirements,
        filteredRequirements: applyFiltersAndSort(
          requirements,
          s.filters,
          s.sortField,
          s.sortDirection,
        ),
        selectedIds: s.selectedIds.filter((sid) => sid !== id),
      };
    });
  },

  duplicateRequirement: async (id) => {
    const state = get();
    const existing = state.requirements.find((r) => r.id === id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const duplicate: Requirement = {
      ...existing,
      id: uuidv4(),
      requirementId: `${existing.requirementId}-copy`,
      title: `${existing.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
      version: 1,
      deleted: false,
      comments: [],
    };

    await put('requirements', duplicate);
    await recordChange(
      duplicate.projectId,
      duplicate.id,
      'created',
      duplicate.createdBy,
      null,
      duplicate as unknown as Record<string, unknown>,
      `Duplicated requirement from "${existing.title}"`,
    );

    set((s) => {
      const requirements = [...s.requirements, duplicate];
      return {
        requirements,
        filteredRequirements: applyFiltersAndSort(
          requirements,
          s.filters,
          s.sortField,
          s.sortDirection,
        ),
      };
    });

    return duplicate;
  },

  bulkUpdateStatus: async (ids, status) => {
    const state = get();
    const now = new Date().toISOString();
    const updatedReqs: Requirement[] = [];

    for (const id of ids) {
      const existing = state.requirements.find((r) => r.id === id);
      if (!existing) continue;

      const updated: Requirement = {
        ...existing,
        status,
        updatedAt: now,
        version: existing.version + 1,
      };
      await put('requirements', updated);
      await recordChange(
        existing.projectId,
        id,
        'status_changed',
        existing.updatedBy,
        { status: existing.status },
        { status },
        `Bulk status change to "${status}"`,
      );
      updatedReqs.push(updated);
    }

    set((s) => {
      const idSet = new Set(ids);
      const updatedMap = new Map(updatedReqs.map((r) => [r.id, r]));
      const requirements = s.requirements.map((r) =>
        idSet.has(r.id) ? (updatedMap.get(r.id) ?? r) : r,
      );
      return {
        requirements,
        filteredRequirements: applyFiltersAndSort(
          requirements,
          s.filters,
          s.sortField,
          s.sortDirection,
        ),
      };
    });
  },

  bulkUpdatePriority: async (ids, priority) => {
    const state = get();
    const now = new Date().toISOString();
    const updatedReqs: Requirement[] = [];

    for (const id of ids) {
      const existing = state.requirements.find((r) => r.id === id);
      if (!existing) continue;

      const updated: Requirement = {
        ...existing,
        priority,
        updatedAt: now,
        version: existing.version + 1,
      };
      await put('requirements', updated);
      await recordChange(
        existing.projectId,
        id,
        'updated',
        existing.updatedBy,
        { priority: existing.priority },
        { priority },
        `Bulk priority change to "${priority}"`,
      );
      updatedReqs.push(updated);
    }

    set((s) => {
      const idSet = new Set(ids);
      const updatedMap = new Map(updatedReqs.map((r) => [r.id, r]));
      const requirements = s.requirements.map((r) =>
        idSet.has(r.id) ? (updatedMap.get(r.id) ?? r) : r,
      );
      return {
        requirements,
        filteredRequirements: applyFiltersAndSort(
          requirements,
          s.filters,
          s.sortField,
          s.sortDirection,
        ),
      };
    });
  },

  bulkUpdateOwner: async (ids, owner) => {
    const state = get();
    const now = new Date().toISOString();
    const updatedReqs: Requirement[] = [];

    for (const id of ids) {
      const existing = state.requirements.find((r) => r.id === id);
      if (!existing) continue;

      const updated: Requirement = {
        ...existing,
        updatedBy: owner,
        updatedAt: now,
        version: existing.version + 1,
      };
      await put('requirements', updated);
      await recordChange(
        existing.projectId,
        id,
        'updated',
        owner,
        { updatedBy: existing.updatedBy },
        { updatedBy: owner },
        `Bulk owner change`,
      );
      updatedReqs.push(updated);
    }

    set((s) => {
      const idSet = new Set(ids);
      const updatedMap = new Map(updatedReqs.map((r) => [r.id, r]));
      const requirements = s.requirements.map((r) =>
        idSet.has(r.id) ? (updatedMap.get(r.id) ?? r) : r,
      );
      return {
        requirements,
        filteredRequirements: applyFiltersAndSort(
          requirements,
          s.filters,
          s.sortField,
          s.sortDirection,
        ),
      };
    });
  },

  bulkDelete: async (ids) => {
    const state = get();
    const now = new Date().toISOString();
    const updatedReqs: Requirement[] = [];

    for (const id of ids) {
      const existing = state.requirements.find((r) => r.id === id);
      if (!existing) continue;

      const updated: Requirement = {
        ...existing,
        deleted: true,
        updatedAt: now,
        version: existing.version + 1,
      };
      await put('requirements', updated);
      await recordChange(
        existing.projectId,
        id,
        'deleted',
        existing.updatedBy,
        existing as unknown as Record<string, unknown>,
        null,
        `Bulk deleted requirement "${existing.title}"`,
      );
      updatedReqs.push(updated);
    }

    set((s) => {
      const idSet = new Set(ids);
      const updatedMap = new Map(updatedReqs.map((r) => [r.id, r]));
      const requirements = s.requirements.map((r) =>
        idSet.has(r.id) ? (updatedMap.get(r.id) ?? r) : r,
      );
      return {
        requirements,
        filteredRequirements: applyFiltersAndSort(
          requirements,
          s.filters,
          s.sortField,
          s.sortDirection,
        ),
        selectedIds: s.selectedIds.filter((sid) => !idSet.has(sid)),
      };
    });
  },

  bulkAddTag: async (ids, tag) => {
    const state = get();
    const now = new Date().toISOString();
    const updatedReqs: Requirement[] = [];

    for (const id of ids) {
      const existing = state.requirements.find((r) => r.id === id);
      if (!existing) continue;

      const tags = existing.tags.includes(tag) ? existing.tags : [...existing.tags, tag];
      const updated: Requirement = {
        ...existing,
        tags,
        updatedAt: now,
        version: existing.version + 1,
      };
      await put('requirements', updated);
      await recordChange(
        existing.projectId,
        id,
        'updated',
        existing.updatedBy,
        { tags: existing.tags },
        { tags },
        `Added tag "${tag}"`,
      );
      updatedReqs.push(updated);
    }

    set((s) => {
      const idSet = new Set(ids);
      const updatedMap = new Map(updatedReqs.map((r) => [r.id, r]));
      const requirements = s.requirements.map((r) =>
        idSet.has(r.id) ? (updatedMap.get(r.id) ?? r) : r,
      );
      return {
        requirements,
        filteredRequirements: applyFiltersAndSort(
          requirements,
          s.filters,
          s.sortField,
          s.sortDirection,
        ),
      };
    });
  },

  setSort: (field, direction) => {
    set((s) => ({
      sortField: field,
      sortDirection: direction,
      filteredRequirements: applyFiltersAndSort(s.requirements, s.filters, field, direction),
    }));
  },

  setFilter: (key, value) => {
    set((s) => {
      const filters = { ...s.filters, [key]: value };
      return {
        filters,
        filteredRequirements: applyFiltersAndSort(
          s.requirements,
          filters,
          s.sortField,
          s.sortDirection,
        ),
      };
    });
  },

  clearFilters: () => {
    set((s) => ({
      filters: {},
      filteredRequirements: applyFiltersAndSort(
        s.requirements,
        {},
        s.sortField,
        s.sortDirection,
      ),
    }));
  },

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  toggleSelected: (id) => {
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((sid) => sid !== id)
        : [...s.selectedIds, id],
    }));
  },
}));
