import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export type ActiveView =
  | 'dashboard'
  | 'modules'
  | 'requirements'
  | 'traceability-matrix'
  | 'traceability-graph'
  | 'reviews'
  | 'baselines'
  | 'reports'
  | 'import-export'
  | 'settings';

export interface UIState {
  // State
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  activeView: ActiveView;
  activeProjectId: string | null;
  selectedRequirementId: string | null;
  detailPanelOpen: boolean;
  searchQuery: string;
  dateFormat: 'iso' | 'us' | 'eu';
  tableDensity: 'compact' | 'comfortable';
  pageSize: number;
  userName: string;
  toasts: Toast[];

  // Actions
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setActiveView: (view: ActiveView) => void;
  setActiveProject: (projectId: string | null) => void;
  selectRequirement: (requirementId: string | null) => void;
  openDetailPanel: () => void;
  closeDetailPanel: () => void;
  setSearchQuery: (query: string) => void;
  setDateFormat: (format: 'iso' | 'us' | 'eu') => void;
  setTableDensity: (density: 'compact' | 'comfortable') => void;
  setPageSize: (size: number) => void;
  setUserName: (name: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let toastCounter = 0;

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  sidebarCollapsed: false,
  theme: 'dark',
  activeView: 'dashboard',
  activeProjectId: null,
  selectedRequirementId: null,
  detailPanelOpen: false,
  searchQuery: '',
  dateFormat: 'iso',
  tableDensity: 'comfortable',
  pageSize: 50,
  userName: 'User',
  toasts: [],

  // Actions
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setTheme: (theme) => set({ theme }),

  setActiveView: (activeView) => set({ activeView }),

  setActiveProject: (activeProjectId) =>
    set({
      activeProjectId,
      selectedRequirementId: null,
      detailPanelOpen: false,
    }),

  selectRequirement: (selectedRequirementId) =>
    set({
      selectedRequirementId,
      detailPanelOpen: selectedRequirementId !== null,
    }),

  openDetailPanel: () => set({ detailPanelOpen: true }),

  closeDetailPanel: () =>
    set({ detailPanelOpen: false, selectedRequirementId: null }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setDateFormat: (dateFormat) => set({ dateFormat }),

  setTableDensity: (tableDensity) => set({ tableDensity }),

  setPageSize: (pageSize) => set({ pageSize }),

  setUserName: (userName) => set({ userName }),

  addToast: (toast) => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    const newToast: Toast = { ...toast, id };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto-remove after duration (default 5000ms)
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
