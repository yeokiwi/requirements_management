import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '@/types';
import {
  getAllProjects,
  putProject,
  deleteProject as dbDeleteProject,
  getAppSetting,
  putAppSetting,
} from '@/db/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  nextSequence: number;
  loading: boolean;

  // Actions
  loadProjects: () => Promise<void>;
  createProject: (
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'modules' | 'tags'>
  ) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (projectId: string | null) => Promise<void>;
  getNextSequence: () => Promise<number>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sequenceKey(projectId: string): string {
  return `sequence_${projectId}`;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  nextSequence: 1,
  loading: false,

  loadProjects: async () => {
    set({ loading: true });
    try {
      const projects = await getAllProjects();
      set({ projects, loading: false });
    } catch (error) {
      console.error('Failed to load projects:', error);
      set({ loading: false });
    }
  },

  createProject: async (data) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      createdBy: '',
      modules: [],
      tags: [],
    };

    await putProject(project);
    // Initialise sequence counter for the new project
    await putAppSetting({ key: sequenceKey(project.id), value: 1 });

    set((state) => ({
      projects: [...state.projects, project],
    }));

    return project;
  },

  updateProject: async (id, updates) => {
    const state = get();
    const existing = state.projects.find((p) => p.id === id);
    if (!existing) return;

    const updated: Project = {
      ...existing,
      ...updates,
      id, // ensure id cannot be overwritten
      updatedAt: new Date().toISOString(),
    };

    await putProject(updated);

    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
      currentProject:
        state.currentProject?.id === id ? updated : state.currentProject,
    }));
  },

  deleteProject: async (id) => {
    await dbDeleteProject(id);

    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject:
        state.currentProject?.id === id ? null : state.currentProject,
    }));
  },

  setCurrentProject: async (projectId) => {
    if (projectId === null) {
      set({ currentProject: null, nextSequence: 1 });
      return;
    }

    const state = get();
    const project = state.projects.find((p) => p.id === projectId) ?? null;

    // Load the current sequence counter for this project
    let seq = 1;
    try {
      const setting = await getAppSetting(sequenceKey(projectId));
      if (setting?.value != null) {
        seq = setting.value as number;
      }
    } catch {
      // first use – default 1
    }

    set({ currentProject: project, nextSequence: seq });
  },

  getNextSequence: async () => {
    const state = get();
    const projectId = state.currentProject?.id;
    if (!projectId) return 1;

    const current = state.nextSequence;
    const next = current + 1;

    // Persist incremented value
    await putAppSetting({ key: sequenceKey(projectId), value: next });

    set({ nextSequence: next });
    return current;
  },
}));
