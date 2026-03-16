import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useReviewStore } from '@/store/reviewStore';
import { useRequirementStore } from '@/store/requirementStore';
import { useUIStore } from '@/store/uiStore';
import type { ReviewItem, ReviewDisposition } from '@/types';
import { REQUIREMENT_TYPES } from '@/types';
import { SearchBar } from '@/components/common/SearchBar';

interface CreateReviewDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CreateReviewDialog: React.FC<CreateReviewDialogProps> = ({
  open,
  onClose,
}) => {
  const { createReview } = useReviewStore();
  const { requirements } = useRequirementStore();
  const { activeProjectId, userName } = useUIStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form on open
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setSelectedIds(new Set());
      setSearchFilter('');
      setStatusFilter('');
      setTypeFilter('');
    }
  }, [open]);

  const activeRequirements = useMemo(() => {
    return requirements.filter((r) => !r.deleted);
  }, [requirements]);

  const filteredRequirements = useMemo(() => {
    let result = activeRequirements;

    if (searchFilter) {
      const lc = searchFilter.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(lc) ||
          r.requirementId.toLowerCase().includes(lc),
      );
    }

    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (typeFilter) {
      result = result.filter((r) => r.type === typeFilter);
    }

    return result;
  }, [activeRequirements, searchFilter, statusFilter, typeFilter]);

  const statuses = useMemo(() => {
    const s = new Set(activeRequirements.map((r) => r.status));
    return Array.from(s).sort();
  }, [activeRequirements]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const r of filteredRequirements) {
        next.add(r.id);
      }
      return next;
    });
  }, [filteredRequirements]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || selectedIds.size === 0 || !activeProjectId) return;

    setSubmitting(true);
    try {
      const items: ReviewItem[] = Array.from(selectedIds).map((reqId) => ({
        requirementId: reqId,
        disposition: 'Pending' as ReviewDisposition,
        comment: '',
        reviewedBy: '',
        reviewedAt: null,
      }));

      await createReview({
        projectId: activeProjectId,
        title: name.trim(),
        description: description.trim(),
        status: 'Open',
        reviewers: [],
        items,
        createdBy: userName,
      });

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div
        className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-lg shadow-xl"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text)' }}
          >
            Create Review
          </h2>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text)' }}
            >
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Review name"
              className="w-full px-3 py-2 text-sm rounded-md outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text)' }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-md outline-none resize-y focus:ring-2 focus:ring-[var(--color-accent)]"
              style={{
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          {/* Requirement selector */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-text)' }}
            >
              Select Requirements ({selectedIds.size} selected)
            </label>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <SearchBar
                  value={searchFilter}
                  onChange={setSearchFilter}
                  placeholder="Filter requirements..."
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-2 text-sm rounded-md"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <option value="">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2 py-2 text-sm rounded-md"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <option value="">All Types</option>
                {REQUIREMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk actions */}
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
                onClick={selectAllVisible}
              >
                Select All Visible
              </button>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
                onClick={deselectAll}
              >
                Deselect All
              </button>
            </div>

            {/* Requirement list */}
            <div
              className="max-h-60 overflow-y-auto rounded-md"
              style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg)',
              }}
            >
              {filteredRequirements.length === 0 ? (
                <div
                  className="px-4 py-6 text-center text-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  No requirements match the current filters.
                </div>
              ) : (
                filteredRequirements.map((req) => (
                  <label
                    key={req.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:brightness-110"
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(req.id)}
                      onChange={() => toggleSelection(req.id)}
                      className="accent-[var(--color-accent)] w-4 h-4"
                    />
                    <span
                      className="text-xs font-mono"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {req.requirementId}
                    </span>
                    <span
                      className="text-sm truncate flex-1"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {req.title}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {req.status}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex justify-end gap-3 shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium rounded-md"
            style={{
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-accent)' }}
            disabled={!name.trim() || selectedIds.size === 0 || submitting}
            onClick={handleCreate}
          >
            {submitting ? 'Creating...' : 'Create Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateReviewDialog;
