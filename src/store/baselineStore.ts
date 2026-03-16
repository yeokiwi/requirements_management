import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Baseline, Requirement, RequirementSnapshot } from '@/types';
import { getAll, put, deleteRecord } from '@/db/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BaselineDiff {
  added: RequirementSnapshot[];
  removed: RequirementSnapshot[];
  modified: {
    requirementId: string;
    before: RequirementSnapshot;
    after: RequirementSnapshot;
    changedFields: string[];
  }[];
  unchanged: RequirementSnapshot[];
}

export interface BaselineState {
  baselines: Baseline[];
  loading: boolean;

  // Actions
  loadBaselines: (projectId: string) => Promise<void>;
  createBaseline: (name: string, description: string) => Promise<Baseline | null>;
  deleteBaseline: (id: string) => Promise<void>;
  compareBaselines: (id1: string, id2: string) => BaselineDiff | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function snapshotRequirement(req: Requirement): RequirementSnapshot {
  return {
    requirementId: req.id,
    requirementIdHuman: req.requirementId,
    title: req.title,
    description: req.description,
    type: req.type,
    priority: req.priority,
    status: req.status,
    version: req.version,
    customAttributes: { ...req.customAttributes },
  };
}

function getChangedFields(a: RequirementSnapshot, b: RequirementSnapshot): string[] {
  const fields: string[] = [];
  const keys: (keyof RequirementSnapshot)[] = [
    'requirementIdHuman',
    'title',
    'description',
    'type',
    'priority',
    'status',
    'version',
  ];

  for (const key of keys) {
    if (a[key] !== b[key]) {
      fields.push(key);
    }
  }

  // Compare custom attributes
  const aAttrs = a.customAttributes;
  const bAttrs = b.customAttributes;
  const allAttrKeys = new Set([...Object.keys(aAttrs), ...Object.keys(bAttrs)]);
  for (const key of allAttrKeys) {
    if (aAttrs[key] !== bAttrs[key]) {
      fields.push(`customAttributes.${key}`);
    }
  }

  return fields;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBaselineStore = create<BaselineState>((set, get) => ({
  baselines: [],
  loading: false,

  loadBaselines: async (projectId) => {
    set({ loading: true });
    try {
      const baselines = (await getAll('baselines', projectId)) as Baseline[];
      set({ baselines, loading: false });
    } catch (error) {
      console.error('Failed to load baselines:', error);
      set({ loading: false });
    }
  },

  createBaseline: async (name, description) => {
    // Snapshot all current requirements for the active project
    // We need to import requirements from the requirement store at call time
    // to avoid circular dependencies, we read directly from IndexedDB
    const { baselines } = get();

    // Determine project ID from existing baselines or return null
    // The caller should ensure there is a current project context
    // We'll grab all requirements and filter by project from the first baseline
    // or we can accept that the caller passes the right context.

    // Read all requirements from DB — we need a projectId.
    // We'll get it from the requirement store state if available.
    let projectId: string | null = null;
    try {
      // Dynamic import to avoid circular dependency
      const { useRequirementStore } = await import('./requirementStore');
      const reqState = useRequirementStore.getState();
      const requirements = reqState.requirements.filter((r) => !r.deleted);
      if (requirements.length === 0 && baselines.length === 0) {
        console.warn('No requirements to snapshot');
        return null;
      }
      projectId = requirements[0]?.projectId ?? baselines[0]?.projectId ?? null;
      if (!projectId) return null;

      const snapshots: RequirementSnapshot[] = requirements
        .filter((r) => r.projectId === projectId)
        .map(snapshotRequirement);

      const now = new Date().toISOString();
      const baseline: Baseline = {
        id: uuidv4(),
        projectId,
        name,
        description,
        createdAt: now,
        createdBy: '',
        snapshots,
        tags: [],
      };

      await put('baselines', baseline);

      set((state) => ({
        baselines: [...state.baselines, baseline],
      }));

      return baseline;
    } catch (error) {
      console.error('Failed to create baseline:', error);
      return null;
    }
  },

  deleteBaseline: async (id) => {
    await deleteRecord('baselines', id);

    set((state) => ({
      baselines: state.baselines.filter((b) => b.id !== id),
    }));
  },

  compareBaselines: (id1, id2) => {
    const { baselines } = get();
    const baseline1 = baselines.find((b) => b.id === id1);
    const baseline2 = baselines.find((b) => b.id === id2);

    if (!baseline1 || !baseline2) return null;

    const map1 = new Map(baseline1.snapshots.map((s) => [s.requirementId, s]));
    const map2 = new Map(baseline2.snapshots.map((s) => [s.requirementId, s]));

    const added: RequirementSnapshot[] = [];
    const removed: RequirementSnapshot[] = [];
    const modified: BaselineDiff['modified'] = [];
    const unchanged: RequirementSnapshot[] = [];

    // Find added and modified in baseline2 relative to baseline1
    for (const [reqId, snap2] of map2) {
      const snap1 = map1.get(reqId);
      if (!snap1) {
        added.push(snap2);
      } else {
        const changedFields = getChangedFields(snap1, snap2);
        if (changedFields.length > 0) {
          modified.push({
            requirementId: reqId,
            before: snap1,
            after: snap2,
            changedFields,
          });
        } else {
          unchanged.push(snap2);
        }
      }
    }

    // Find removed (in baseline1 but not in baseline2)
    for (const [reqId, snap1] of map1) {
      if (!map2.has(reqId)) {
        removed.push(snap1);
      }
    }

    return { added, removed, modified, unchanged };
  },
}));
