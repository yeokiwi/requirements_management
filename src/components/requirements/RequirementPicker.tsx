import React, { useState, useMemo } from 'react';
import { useRequirementStore } from '@/store/requirementStore';
import { LINK_TYPES } from '@/types';
import type { LinkType } from '@/types';

interface RequirementPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (reqId: string, linkType: LinkType) => void;
  excludeIds?: string[];
}

export const RequirementPicker: React.FC<RequirementPickerProps> = ({
  open,
  onClose,
  onSelect,
  excludeIds = [],
}) => {
  const { requirements } = useRequirementStore();
  const [search, setSearch] = useState('');
  const [linkType, setLinkType] = useState<LinkType>('related_to');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  const filteredRequirements = useMemo(() => {
    const lc = search.toLowerCase();
    return requirements
      .filter((r) => !r.deleted && !excludeSet.has(r.id))
      .filter(
        (r) =>
          !lc ||
          r.title.toLowerCase().includes(lc) ||
          r.requirementId.toLowerCase().includes(lc),
      );
  }, [requirements, search, excludeSet]);

  const handleLink = () => {
    if (selectedReqId) {
      onSelect(selectedReqId, linkType);
      setSearch('');
      setSelectedReqId(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSearch('');
    setSelectedReqId(null);
    onClose();
  };

  if (!open) return null;

  const linkTypeLabels: Record<LinkType, string> = {
    derives_from: 'Derives From',
    satisfies: 'Satisfies',
    verified_by: 'Verified By',
    refines: 'Refines',
    conflicts_with: 'Conflicts With',
    related_to: 'Related To',
    implements: 'Implements',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative z-10 w-full max-w-lg rounded-lg shadow-xl flex flex-col"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          maxHeight: '80vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
            Link Requirement
          </h2>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requirements..."
            className="w-full px-3 py-2 text-sm rounded-md outline-none focus:ring-2 focus:ring-[var(--color-accent)] mb-3"
            style={{
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
            autoFocus
          />

          {/* Link Type */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Link Type:
            </label>
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as LinkType)}
              className="flex-1 px-3 py-1.5 text-sm rounded-md outline-none"
              style={{
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            >
              {LINK_TYPES.map((lt) => (
                <option key={lt} value={lt}>
                  {linkTypeLabels[lt]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Requirements List */}
        <div className="flex-1 overflow-auto p-2" style={{ minHeight: 200, maxHeight: 400 }}>
          {filteredRequirements.length === 0 ? (
            <p
              className="text-sm text-center py-8"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              No matching requirements found
            </p>
          ) : (
            filteredRequirements.map((req) => (
              <button
                key={req.id}
                type="button"
                className="w-full text-left px-3 py-2 rounded-md mb-1 transition-colors"
                style={{
                  backgroundColor:
                    selectedReqId === req.id
                      ? 'var(--color-accent)'
                      : 'transparent',
                  color:
                    selectedReqId === req.id ? '#fff' : 'var(--color-text)',
                }}
                onClick={() => setSelectedReqId(req.id)}
                onDoubleClick={() => {
                  setSelectedReqId(req.id);
                  handleLink();
                }}
              >
                <span className="font-mono text-xs opacity-70 mr-2">
                  {req.requirementId}
                </span>
                <span className="text-sm">{req.title}</span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 p-4 border-t"
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
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-accent)' }}
            disabled={!selectedReqId}
            onClick={handleLink}
          >
            Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequirementPicker;
