import React, { useState } from 'react';
import type { Module } from '@/types';

interface ModuleFormProps {
  module?: Module;
  parentModuleId?: string | null;
  modules?: Module[];
  onSave: (data: Partial<Module>) => void;
  onCancel: () => void;
}

export const ModuleForm: React.FC<ModuleFormProps> = ({
  module,
  parentModuleId = null,
  modules = [],
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(module?.name ?? '');
  const [description, setDescription] = useState(module?.description ?? '');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(
    module?.parentModuleId ?? parentModuleId,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...(module ? { id: module.id } : {}),
      name: name.trim(),
      description: description.trim(),
      parentModuleId: selectedParentId,
    });
  };

  // Filter out the module itself (and its descendants) from parent options to prevent cycles
  const getDescendantIds = (id: string): string[] => {
    const children = modules.filter((m) => m.parentModuleId === id);
    return children.reduce<string[]>(
      (acc, child) => [...acc, child.id, ...getDescendantIds(child.id)],
      [],
    );
  };

  const excludeIds = module
    ? new Set([module.id, ...getDescendantIds(module.id)])
    : new Set<string>();

  const parentOptions = modules.filter((m) => !excludeIds.has(m.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onCancel}
    >
      <div
        className="rounded-lg shadow-xl w-full max-w-md p-6"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--color-text)' }}
        >
          {module ? 'Edit Module' : 'New Module'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
              placeholder="Module name"
            />
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md text-sm outline-none resize-vertical"
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
              placeholder="Optional description"
            />
          </div>

          {/* Parent Module */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Parent Module
            </label>
            <select
              value={selectedParentId ?? ''}
              onChange={(e) =>
                setSelectedParentId(e.target.value || null)
              }
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <option value="">None (top-level)</option>
              {parentOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium rounded-md"
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModuleForm;
