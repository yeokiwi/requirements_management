import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UndoEntry {
  type: string;
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  requirementId: string;
  description: string;
}

export interface HistoryState {
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];

  // Actions
  pushUndo: (entry: UndoEntry) => void;
  undo: () => UndoEntry | null;
  redo: () => UndoEntry | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_UNDO_ENTRIES = 20;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],

  pushUndo: (entry) => {
    set((state) => {
      const newStack = [...state.undoStack, entry];
      // Keep only the last MAX_UNDO_ENTRIES entries
      if (newStack.length > MAX_UNDO_ENTRIES) {
        newStack.splice(0, newStack.length - MAX_UNDO_ENTRIES);
      }
      return {
        undoStack: newStack,
        // Clear redo stack when a new action is performed
        redoStack: [],
      };
    });
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return null;

    const entry = state.undoStack[state.undoStack.length - 1];

    set((s) => ({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, entry],
    }));

    return entry;
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return null;

    const entry = state.redoStack[state.redoStack.length - 1];

    set((s) => ({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, entry],
    }));

    return entry;
  },
}));
