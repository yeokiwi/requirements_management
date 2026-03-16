import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Module, Requirement } from '@/types';
import { getDB } from '@/db/database';
import { useUIStore } from '@/store/uiStore';
import { useRequirementStore } from '@/store/requirementStore';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityIndicator } from '@/components/common/PriorityIndicator';
import { ModuleTreeNode } from './ModuleTreeNode';
import { ModuleForm } from './ModuleForm';

// ---------------------------------------------------------------------------
// Context menu state
// ---------------------------------------------------------------------------

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  module: Module | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ModuleTreeView: React.FC = () => {
  const projectId = useUIStore((s) => s.activeProjectId);
  const { requirements, loadRequirements } = useRequirementStore();

  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | undefined>(undefined);
  const [formParentId, setFormParentId] = useState<string | null>(null);

  // Rename inline state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    module: null,
  });

  // ---------------------------------------------------------------------------
  // Load modules
  // ---------------------------------------------------------------------------

  const fetchModules = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const db = await getDB();
      const result = await db.getAllFromIndex('modules', 'projectId', projectId);
      setModules(result);
    } catch (err) {
      console.error('Failed to load modules:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    if (projectId) {
      loadRequirements(projectId);
    }
  }, [projectId, loadRequirements]);

  // ---------------------------------------------------------------------------
  // Root modules (no parent)
  // ---------------------------------------------------------------------------

  const rootModules = useMemo(
    () => modules.filter((m) => !m.parentModuleId),
    [modules],
  );

  // ---------------------------------------------------------------------------
  // Requirements for selected module
  // ---------------------------------------------------------------------------

  const moduleRequirements = useMemo(() => {
    if (!selectedModuleId) return [];
    return requirements.filter(
      (r) => r.moduleId === selectedModuleId && !r.deleted,
    );
  }, [requirements, selectedModuleId]);

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const columns: Column<Requirement>[] = useMemo(
    () => [
      {
        key: 'requirementId',
        title: 'Display ID',
        width: 130,
        sortable: true,
      },
      {
        key: 'title',
        title: 'Title',
        sortable: true,
      },
      {
        key: 'status',
        title: 'Status',
        width: 120,
        sortable: true,
        render: (value: string) => <StatusBadge status={value} size="sm" />,
      },
      {
        key: 'priority',
        title: 'Priority',
        width: 120,
        sortable: true,
        render: (value: string) => (
          <PriorityIndicator priority={value as Requirement['priority']} />
        ),
      },
      {
        key: 'type',
        title: 'Type',
        width: 110,
        sortable: true,
      },
    ],
    [],
  );

  // ---------------------------------------------------------------------------
  // Module CRUD
  // ---------------------------------------------------------------------------

  const handleSaveModule = useCallback(
    async (data: Partial<Module>) => {
      if (!projectId) return;
      const now = new Date().toISOString();
      const db = await getDB();

      if (data.id) {
        // Update existing module
        const existing = modules.find((m) => m.id === data.id);
        if (!existing) return;
        const updated: Module = {
          ...existing,
          ...data,
          updatedAt: now,
        };
        await db.put('modules', updated);
      } else {
        // Create new module
        const newModule: Module = {
          id: uuidv4(),
          projectId,
          name: data.name ?? 'Untitled Module',
          description: data.description ?? '',
          parentModuleId: data.parentModuleId ?? null,
          requirementIds: [],
          createdAt: now,
          updatedAt: now,
        };
        await db.put('modules', newModule);
      }

      setShowForm(false);
      setEditingModule(undefined);
      setFormParentId(null);
      await fetchModules();
    },
    [projectId, modules, fetchModules],
  );

  const handleDeleteModule = useCallback(
    async (moduleId: string) => {
      const db = await getDB();

      // Recursively collect descendant IDs
      const collectDescendants = (id: string): string[] => {
        const children = modules.filter((m) => m.parentModuleId === id);
        return children.reduce<string[]>(
          (acc, child) => [...acc, child.id, ...collectDescendants(child.id)],
          [],
        );
      };

      const idsToDelete = [moduleId, ...collectDescendants(moduleId)];

      for (const id of idsToDelete) {
        await db.delete('modules', id);
      }

      if (selectedModuleId && idsToDelete.includes(selectedModuleId)) {
        setSelectedModuleId(null);
      }

      await fetchModules();
    },
    [modules, selectedModuleId, fetchModules],
  );

  const handleRenameSubmit = useCallback(
    async (moduleId: string) => {
      if (!renameValue.trim()) {
        setRenamingId(null);
        return;
      }
      const db = await getDB();
      const existing = modules.find((m) => m.id === moduleId);
      if (!existing) return;

      const updated: Module = {
        ...existing,
        name: renameValue.trim(),
        updatedAt: new Date().toISOString(),
      };
      await db.put('modules', updated);
      setRenamingId(null);
      await fetchModules();
    },
    [renameValue, modules, fetchModules],
  );

  // ---------------------------------------------------------------------------
  // Context menu
  // ---------------------------------------------------------------------------

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, mod: Module) => {
      e.preventDefault();
      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, module: mod });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false, module: null }));
  }, []);

  // Close context menu on any outside click
  useEffect(() => {
    const handler = () => closeContextMenu();
    if (contextMenu.visible) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [contextMenu.visible, closeContextMenu]);

  // Focus rename input when it appears
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // ---------------------------------------------------------------------------
  // Create requirement in selected module
  // ---------------------------------------------------------------------------

  const { createRequirement } = useRequirementStore();

  const handleNewRequirement = useCallback(async () => {
    if (!projectId || !selectedModuleId) return;

    await createRequirement({
      projectId,
      moduleId: selectedModuleId,
      requirementId: `REQ-${Date.now()}`,
      title: 'New Requirement',
      description: '',
      type: 'System',
      priority: 'Medium',
      status: 'Draft',
      rationale: '',
      acceptanceCriteria: [],
      tags: [],
      customAttributes: {},
      createdBy: '',
      updatedBy: '',
    });
  }, [projectId, selectedModuleId, createRequirement]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState title="No project selected" description="Select a project to manage modules." />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* ---- Left panel: Module tree ---- */}
      <div
        className="w-72 shrink-0 flex flex-col overflow-hidden"
        style={{
          borderRight: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        {/* Header / New Module button */}
        <div
          className="flex items-center justify-between px-3 py-2 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <span
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Modules
          </span>
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-white"
            style={{ backgroundColor: 'var(--color-accent)' }}
            onClick={() => {
              setEditingModule(undefined);
              setFormParentId(null);
              setShowForm(true);
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Module
          </button>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto py-1">
          {loading && (
            <div
              className="px-3 py-4 text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Loading modules...
            </div>
          )}

          {!loading && rootModules.length === 0 && (
            <div
              className="px-3 py-4 text-sm text-center"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              No modules yet. Create one to get started.
            </div>
          )}

          {rootModules.map((mod) =>
            renamingId === mod.id ? (
              <div key={mod.id} className="px-2 py-1">
                <input
                  ref={renameInputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameSubmit(mod.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit(mod.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="w-full px-2 py-1 text-sm rounded outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-accent)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
            ) : (
              <ModuleTreeNode
                key={mod.id}
                module={mod}
                modules={modules}
                selectedId={selectedModuleId}
                onSelect={setSelectedModuleId}
                onContextMenu={handleContextMenu}
                level={0}
              />
            ),
          )}
        </div>
      </div>

      {/* ---- Right panel: Requirements table ---- */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
        {selectedModuleId ? (
          <>
            <div className="flex items-center justify-between">
              <h2
                className="text-lg font-semibold"
                style={{ color: 'var(--color-text)' }}
              >
                {modules.find((m) => m.id === selectedModuleId)?.name ?? 'Module'}
              </h2>
            </div>

            <div className="flex-1 overflow-auto">
              <DataTable<Requirement>
                columns={columns}
                data={moduleRequirements}
                rowKey="id"
                emptyMessage="No requirements in this module"
              />
            </div>

            <div className="shrink-0">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-white"
                style={{ backgroundColor: 'var(--color-accent)' }}
                onClick={handleNewRequirement}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Requirement
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              title="Select a module"
              description="Choose a module from the tree on the left to view its requirements."
              icon={
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              }
            />
          </div>
        )}
      </div>

      {/* ---- Context menu ---- */}
      {contextMenu.visible && contextMenu.module && (
        <div
          className="fixed z-50 rounded-md shadow-lg py-1 min-w-[160px]"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <button
            type="button"
            className="w-full text-left px-3 py-1.5 text-sm hover:brightness-110"
            style={{ color: 'var(--color-text)' }}
            onClick={() => {
              if (contextMenu.module) {
                setRenamingId(contextMenu.module.id);
                setRenameValue(contextMenu.module.name);
              }
              closeContextMenu();
            }}
          >
            Rename
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-1.5 text-sm hover:brightness-110"
            style={{ color: 'var(--color-text)' }}
            onClick={() => {
              if (contextMenu.module) {
                setEditingModule(undefined);
                setFormParentId(contextMenu.module.id);
                setShowForm(true);
              }
              closeContextMenu();
            }}
          >
            Add Sub-Module
          </button>
          <div style={{ borderTop: '1px solid var(--color-border)', margin: '2px 0' }} />
          <button
            type="button"
            className="w-full text-left px-3 py-1.5 text-sm"
            style={{ color: '#ef4444' }}
            onClick={() => {
              if (contextMenu.module) {
                handleDeleteModule(contextMenu.module.id);
              }
              closeContextMenu();
            }}
          >
            Delete
          </button>
        </div>
      )}

      {/* ---- Module form modal ---- */}
      {showForm && (
        <ModuleForm
          module={editingModule}
          parentModuleId={formParentId}
          modules={modules}
          onSave={handleSaveModule}
          onCancel={() => {
            setShowForm(false);
            setEditingModule(undefined);
            setFormParentId(null);
          }}
        />
      )}
    </div>
  );
};

export default ModuleTreeView;
