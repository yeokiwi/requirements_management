import React, { useState } from 'react';
import { useRequirementStore } from '@/store/requirementStore';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PRIORITY_LEVELS } from '@/types';
import type { PriorityLevel } from '@/types';

interface BulkOperationsBarProps {
  selectedCount: number;
  onClear: () => void;
}

export const BulkOperationsBar: React.FC<BulkOperationsBarProps> = ({
  selectedCount,
  onClear,
}) => {
  const {
    selectedIds,
    bulkUpdateStatus,
    bulkUpdatePriority,
    bulkUpdateOwner,
    bulkDelete,
    bulkAddTag,
  } = useRequirementStore();

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showModuleDropdown, setShowModuleDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ownerValue, setOwnerValue] = useState('');
  const [tagValue, setTagValue] = useState('');

  const statuses = ['Draft', 'In Review', 'Approved', 'Active', 'Deprecated', 'Rejected'];

  const handleStatusChange = async (status: string) => {
    await bulkUpdateStatus(selectedIds, status);
    setShowStatusDropdown(false);
  };

  const handlePriorityChange = async (priority: PriorityLevel) => {
    await bulkUpdatePriority(selectedIds, priority);
    setShowPriorityDropdown(false);
  };

  const handleOwnerSubmit = async () => {
    if (ownerValue.trim()) {
      await bulkUpdateOwner(selectedIds, ownerValue.trim());
      setOwnerValue('');
      setShowOwnerDialog(false);
    }
  };

  const handleTagSubmit = async () => {
    if (tagValue.trim()) {
      await bulkAddTag(selectedIds, tagValue.trim());
      setTagValue('');
      setShowTagDialog(false);
    }
  };

  const handleDelete = async () => {
    await bulkDelete(selectedIds);
    setShowDeleteConfirm(false);
    onClear();
  };

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-2 rounded-lg"
        style={{
          backgroundColor: 'var(--color-accent)',
          color: '#fff',
        }}
      >
        <span className="text-sm font-medium">{selectedCount} selected</span>

        <div className="h-4 w-px bg-white/30" />

        {/* Change Status */}
        <div className="relative">
          <button
            type="button"
            className="px-3 py-1 text-xs font-medium rounded bg-white/20 hover:bg-white/30 transition-colors"
            onClick={() => {
              setShowStatusDropdown(!showStatusDropdown);
              setShowPriorityDropdown(false);
              setShowModuleDropdown(false);
            }}
          >
            Change Status
          </button>
          {showStatusDropdown && (
            <div
              className="absolute top-full left-0 mt-1 z-50 rounded-md shadow-lg py-1 min-w-[140px]"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              {statuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="block w-full text-left px-3 py-1.5 text-sm hover:brightness-110"
                  style={{ color: 'var(--color-text)' }}
                  onClick={() => handleStatusChange(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Change Priority */}
        <div className="relative">
          <button
            type="button"
            className="px-3 py-1 text-xs font-medium rounded bg-white/20 hover:bg-white/30 transition-colors"
            onClick={() => {
              setShowPriorityDropdown(!showPriorityDropdown);
              setShowStatusDropdown(false);
              setShowModuleDropdown(false);
            }}
          >
            Change Priority
          </button>
          {showPriorityDropdown && (
            <div
              className="absolute top-full left-0 mt-1 z-50 rounded-md shadow-lg py-1 min-w-[140px]"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              {PRIORITY_LEVELS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="block w-full text-left px-3 py-1.5 text-sm hover:brightness-110"
                  style={{ color: 'var(--color-text)' }}
                  onClick={() => handlePriorityChange(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Change Owner */}
        <button
          type="button"
          className="px-3 py-1 text-xs font-medium rounded bg-white/20 hover:bg-white/30 transition-colors"
          onClick={() => setShowOwnerDialog(true)}
        >
          Change Owner
        </button>

        {/* Assign Module */}
        <div className="relative">
          <button
            type="button"
            className="px-3 py-1 text-xs font-medium rounded bg-white/20 hover:bg-white/30 transition-colors"
            onClick={() => {
              setShowModuleDropdown(!showModuleDropdown);
              setShowStatusDropdown(false);
              setShowPriorityDropdown(false);
            }}
          >
            Assign Module
          </button>
          {showModuleDropdown && (
            <div
              className="absolute top-full left-0 mt-1 z-50 rounded-md shadow-lg py-1 min-w-[140px]"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <p
                className="px-3 py-2 text-xs"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                No modules available
              </p>
            </div>
          )}
        </div>

        {/* Add Tag */}
        <button
          type="button"
          className="px-3 py-1 text-xs font-medium rounded bg-white/20 hover:bg-white/30 transition-colors"
          onClick={() => setShowTagDialog(true)}
        >
          Add Tag
        </button>

        {/* Delete */}
        <button
          type="button"
          className="px-3 py-1 text-xs font-medium rounded bg-red-500/80 hover:bg-red-500 transition-colors"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete
        </button>

        <div className="flex-1" />

        <button
          type="button"
          className="px-3 py-1 text-xs font-medium rounded bg-white/20 hover:bg-white/30 transition-colors"
          onClick={onClear}
        >
          Clear Selection
        </button>
      </div>

      {/* Owner Dialog */}
      {showOwnerDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowOwnerDialog(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative z-10 w-full max-w-sm rounded-lg p-6 shadow-xl"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Change Owner
            </h3>
            <input
              type="text"
              value={ownerValue}
              onChange={(e) => setOwnerValue(e.target.value)}
              placeholder="Enter owner name..."
              className="w-full px-3 py-2 text-sm rounded-md outline-none mb-4"
              style={{
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleOwnerSubmit()}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
                onClick={() => setShowOwnerDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium rounded-md text-white"
                style={{ backgroundColor: 'var(--color-accent)' }}
                onClick={handleOwnerSubmit}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Dialog */}
      {showTagDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowTagDialog(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative z-10 w-full max-w-sm rounded-lg p-6 shadow-xl"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Add Tag
            </h3>
            <input
              type="text"
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
              placeholder="Enter tag..."
              className="w-full px-3 py-2 text-sm rounded-md outline-none mb-4"
              style={{
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleTagSubmit()}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
                onClick={() => setShowTagDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium rounded-md text-white"
                style={{ backgroundColor: 'var(--color-accent)' }}
                onClick={handleTagSubmit}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Requirements"
        message={`Are you sure you want to delete ${selectedCount} selected requirement(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </>
  );
};

export default BulkOperationsBar;
