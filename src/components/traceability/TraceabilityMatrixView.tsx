import React, { useMemo, useState, useCallback } from 'react';
import { useRequirementStore } from '@/store/requirementStore';
import { useTraceabilityStore } from '@/store/traceabilityStore';
import type { Requirement, TraceabilityLink, LinkType, RequirementType } from '@/types';
import { REQUIREMENT_TYPES, LINK_TYPES } from '@/types';

// ---------------------------------------------------------------------------
// Link-type colour mapping
// ---------------------------------------------------------------------------

const LINK_TYPE_COLORS: Record<LinkType, string> = {
  derives_from: '#8b5cf6',
  satisfies: '#3b82f6',
  verified_by: '#22c55e',
  refines: '#f97316',
  conflicts_with: '#ef4444',
  related_to: '#6b7280',
  implements: '#06b6d4',
};

const LINK_TYPE_LABELS: Record<LinkType, string> = {
  derives_from: 'Derives From',
  satisfies: 'Satisfies',
  verified_by: 'Verified By',
  refines: 'Refines',
  conflicts_with: 'Conflicts With',
  related_to: 'Related To',
  implements: 'Implements',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TraceabilityMatrixView: React.FC = () => {
  const requirements = useRequirementStore((s) => s.requirements);
  const links = useTraceabilityStore((s) => s.links);
  const createLink = useTraceabilityStore((s) => s.createLink);
  const deleteLink = useTraceabilityStore((s) => s.deleteLink);

  // Filter state
  const [sourceType, setSourceType] = useState<RequirementType | ''>('');
  const [targetType, setTargetType] = useState<RequirementType | ''>('');
  const [linkTypeFilter, setLinkTypeFilter] = useState<LinkType | ''>('');
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);

  // Active (non-deleted) requirements only
  const activeRequirements = useMemo(
    () => requirements.filter((r) => !r.deleted),
    [requirements],
  );

  // Filtered source / target requirements
  const sourceRequirements = useMemo(
    () =>
      sourceType
        ? activeRequirements.filter((r) => r.type === sourceType)
        : activeRequirements,
    [activeRequirements, sourceType],
  );

  const targetRequirements = useMemo(
    () =>
      targetType
        ? activeRequirements.filter((r) => r.type === targetType)
        : activeRequirements,
    [activeRequirements, targetType],
  );

  // Build a lookup: "sourceId-targetId" -> TraceabilityLink[]
  const linkLookup = useMemo(() => {
    const map = new Map<string, TraceabilityLink[]>();
    const filtered = linkTypeFilter
      ? links.filter((l) => l.linkType === linkTypeFilter)
      : links;
    for (const link of filtered) {
      const key = `${link.sourceId}-${link.targetId}`;
      const existing = map.get(key) || [];
      existing.push(link);
      map.set(key, existing);
    }
    return map;
  }, [links, linkTypeFilter]);

  // Sets of requirement ids that have at least one link
  const linkedSourceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const link of links) {
      ids.add(link.sourceId);
    }
    return ids;
  }, [links]);

  const linkedTargetIds = useMemo(() => {
    const ids = new Set<string>();
    for (const link of links) {
      ids.add(link.targetId);
    }
    return ids;
  }, [links]);

  // Toggle link handler
  const handleCellClick = useCallback(
    async (source: Requirement, target: Requirement) => {
      if (source.id === target.id) return;
      const key = `${source.id}-${target.id}`;
      const existing = linkLookup.get(key);

      if (existing && existing.length > 0) {
        // Remove the first link
        await deleteLink(existing[0].id);
      } else {
        // Create a new link
        await createLink({
          projectId: source.projectId,
          sourceId: source.id,
          targetId: target.id,
          linkType: linkTypeFilter || 'related_to',
          description: '',
          createdBy: '',
        });
      }
    },
    [linkLookup, createLink, deleteLink, linkTypeFilter],
  );

  // Cell hover
  const handleCellHover = useCallback(
    (
      e: React.MouseEvent,
      source: Requirement,
      target: Requirement,
    ) => {
      const key = `${source.id}-${target.id}`;
      const existing = linkLookup.get(key);
      if (existing && existing.length > 0) {
        const details = existing
          .map(
            (l) =>
              `${LINK_TYPE_LABELS[l.linkType]} (${source.requirementId} -> ${target.requirementId})`,
          )
          .join('\n');
        setTooltip({ x: e.clientX, y: e.clientY, content: details });
      } else {
        setTooltip({
          x: e.clientX,
          y: e.clientY,
          content: `No link: ${source.requirementId} -> ${target.requirementId}\nClick to create`,
        });
      }
    },
    [linkLookup],
  );

  // CSV export
  const handleExport = useCallback(() => {
    const header = ['', ...targetRequirements.map((t) => t.requirementId)];
    const rows = sourceRequirements.map((src) => {
      const cells = targetRequirements.map((tgt) => {
        const key = `${src.id}-${tgt.id}`;
        const existing = linkLookup.get(key);
        return existing && existing.length > 0
          ? existing.map((l) => l.linkType).join(';')
          : '';
      });
      return [src.requirementId, ...cells];
    });

    const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'traceability_matrix.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [sourceRequirements, targetRequirements, linkLookup]);

  return (
    <div className="flex flex-col h-full">
      {/* ------- Filter Controls ------- */}
      <div
        className="flex flex-wrap items-center gap-4 p-4 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Source type */}
        <div className="flex items-center gap-2">
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Source Type
          </label>
          <select
            className="rounded-md px-3 py-1.5 text-sm"
            style={{
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as RequirementType | '')}
          >
            <option value="">All Types</option>
            {REQUIREMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Target type */}
        <div className="flex items-center gap-2">
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Target Type
          </label>
          <select
            className="rounded-md px-3 py-1.5 text-sm"
            style={{
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as RequirementType | '')}
          >
            <option value="">All Types</option>
            {REQUIREMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Link type filter */}
        <div className="flex items-center gap-2">
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Link Type
          </label>
          <select
            className="rounded-md px-3 py-1.5 text-sm"
            style={{
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
            value={linkTypeFilter}
            onChange={(e) => setLinkTypeFilter(e.target.value as LinkType | '')}
          >
            <option value="">All Link Types</option>
            {LINK_TYPES.map((lt) => (
              <option key={lt} value={lt}>
                {LINK_TYPE_LABELS[lt]}
              </option>
            ))}
          </select>
        </div>

        {/* Export */}
        <button
          type="button"
          className="ml-auto px-4 py-1.5 text-sm font-medium rounded-md text-white"
          style={{ backgroundColor: 'var(--color-accent)' }}
          onClick={handleExport}
        >
          Export CSV
        </button>
      </div>

      {/* ------- Legend ------- */}
      <div
        className="flex flex-wrap items-center gap-4 px-4 py-2 border-b text-xs"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span className="font-medium">Link types:</span>
        {LINK_TYPES.map((lt) => (
          <span key={lt} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: LINK_TYPE_COLORS[lt] }}
            />
            {LINK_TYPE_LABELS[lt]}
          </span>
        ))}
      </div>

      {/* ------- Matrix Grid ------- */}
      <div className="flex-1 overflow-auto p-4">
        {sourceRequirements.length === 0 || targetRequirements.length === 0 ? (
          <div
            className="flex items-center justify-center h-full text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            No requirements match the current filters.
          </div>
        ) : (
          <div className="inline-block">
            <table className="border-collapse">
              {/* Column headers (rotated) */}
              <thead>
                <tr>
                  {/* Empty corner cell */}
                  <th
                    className="sticky left-0 top-0 z-20 min-w-[120px]"
                    style={{ backgroundColor: 'var(--color-surface)' }}
                  />
                  {targetRequirements.map((tgt) => {
                    const hasLinks = linkedTargetIds.has(tgt.id);
                    return (
                      <th
                        key={tgt.id}
                        className="sticky top-0 z-10 h-[100px] w-10 p-0"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                      >
                        <div
                          className="flex items-end justify-start h-full w-full overflow-hidden"
                          style={{ paddingBottom: '4px' }}
                        >
                          <span
                            className="text-xs font-medium whitespace-nowrap origin-bottom-left"
                            style={{
                              transform: 'rotate(-45deg)',
                              display: 'inline-block',
                              color: hasLinks
                                ? 'var(--color-text)'
                                : '#ef4444',
                              fontWeight: hasLinks ? 500 : 700,
                            }}
                            title={`${tgt.requirementId}: ${tgt.title}`}
                          >
                            {tgt.requirementId}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {sourceRequirements.map((src) => {
                  const hasLinks = linkedSourceIds.has(src.id);
                  return (
                    <tr key={src.id}>
                      {/* Row header */}
                      <td
                        className="sticky left-0 z-10 px-2 py-1 text-xs font-medium whitespace-nowrap border-r"
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          borderColor: 'var(--color-border)',
                          color: hasLinks
                            ? 'var(--color-text)'
                            : '#ef4444',
                          fontWeight: hasLinks ? 500 : 700,
                        }}
                        title={`${src.requirementId}: ${src.title}`}
                      >
                        {src.requirementId}
                      </td>

                      {/* Cells */}
                      {targetRequirements.map((tgt) => {
                        const key = `${src.id}-${tgt.id}`;
                        const cellLinks = linkLookup.get(key);
                        const hasLink = cellLinks && cellLinks.length > 0;
                        const dotColor = hasLink
                          ? LINK_TYPE_COLORS[cellLinks[0].linkType]
                          : undefined;
                        const isSelf = src.id === tgt.id;

                        return (
                          <td
                            key={tgt.id}
                            className="w-10 h-8 text-center border cursor-pointer hover:opacity-80"
                            style={{
                              borderColor: 'var(--color-border)',
                              backgroundColor: isSelf
                                ? 'var(--color-border)'
                                : 'transparent',
                            }}
                            onClick={() => handleCellClick(src, tgt)}
                            onMouseEnter={(e) =>
                              !isSelf && handleCellHover(e, src, tgt)
                            }
                            onMouseLeave={() => setTooltip(null)}
                          >
                            {hasLink && (
                              <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: dotColor }}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------- Tooltip ------- */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 rounded-md shadow-lg text-xs whitespace-pre-line pointer-events-none"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default TraceabilityMatrixView;
