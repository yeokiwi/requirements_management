import React, { useCallback, useMemo } from 'react';
import { useRequirementStore } from '@/store/requirementStore';
import { useProjectStore } from '@/store/projectStore';
import { useUIStore } from '@/store/uiStore';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PriorityIndicator } from '@/components/common/PriorityIndicator';
import { SearchBar } from '@/components/common/SearchBar';
import { BulkOperationsBar } from '@/components/requirements/BulkOperationsBar';
import { RequirementDetailPanel } from '@/components/requirements/RequirementDetailPanel';
import type { Requirement, PriorityLevel, RequirementType, Module } from '@/types';
import { REQUIREMENT_TYPES, PRIORITY_LEVELS } from '@/types';

// ---------------------------------------------------------------------------
// Priority border color mapping
// ---------------------------------------------------------------------------

const PRIORITY_BORDER_CLASS: Record<PriorityLevel, string> = {
  Critical: 'border-l-4 border-l-red-500',
  High: 'border-l-4 border-l-orange-500',
  Medium: 'border-l-4 border-l-yellow-500',
  Low: 'border-l-4 border-l-green-500',
  Undefined: 'border-l-4 border-l-gray-500',
};

// ---------------------------------------------------------------------------
// Status color lookup (fallback palette)
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  Draft: '#6b7280',
  'In Review': '#3b82f6',
  Approved: '#22c55e',
  Rejected: '#ef4444',
  Implemented: '#8b5cf6',
  Verified: '#14b8a6',
  Deprecated: '#f97316',
};

function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? '#6b7280';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RequirementsTableView: React.FC = () => {
  const {
    filteredRequirements,
    selectedIds,
    sortField,
    sortDirection,
    filters,
    setSort,
    setFilter,
    setSelectedIds,
    toggleSelected,
  } = useRequirementStore();

  const { currentProject } = useProjectStore();
  const {
    selectRequirement,
    selectedRequirementId,
    detailPanelOpen,
    closeDetailPanel,
  } = useUIStore();

  // Build a module map for display names
  // Modules are not in a dedicated store; derive from requirements' moduleId when needed.
  const moduleMap = useMemo<Record<string, string>>(() => {
    // placeholder: we don't have a module store, so show moduleId directly
    return {};
  }, []);

  // ------ Toolbar filter handlers ------

  const handleStatusFilter = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilter('status', e.target.value || undefined);
    },
    [setFilter],
  );

  const handlePriorityFilter = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilter('priority', e.target.value || undefined);
    },
    [setFilter],
  );

  const handleTypeFilter = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilter('type', e.target.value || undefined);
    },
    [setFilter],
  );

  const handleCategoryFilter = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilter('category', e.target.value || undefined);
    },
    [setFilter],
  );

  const handleSearch = useCallback(
    (value: string) => {
      setFilter('search', value || undefined);
    },
    [setFilter],
  );

  // ------ New requirement ------

  const handleNewRequirement = useCallback(() => {
    // Signal the detail panel to open in "create" mode by selecting null first
    selectRequirement('__new__');
  }, [selectRequirement]);

  // ------ Row click ------

  const handleRowClick = useCallback(
    (row: Requirement) => {
      selectRequirement(row.id);
    },
    [selectRequirement],
  );

  // ------ Row class for priority border ------

  const rowClassName = useCallback((row: Requirement): string => {
    return PRIORITY_BORDER_CLASS[row.priority] ?? '';
  }, []);

  // ------ Format date ------

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ------ Table columns ------

  const columns = useMemo<Column<Requirement>[]>(
    () => [
      {
        key: 'requirementId',
        title: 'ID',
        width: 120,
        sortable: true,
        render: (value: string) => (
          <span className="font-mono text-xs">{value}</span>
        ),
      },
      {
        key: 'title',
        title: 'Title',
        sortable: true,
      },
      {
        key: 'type',
        title: 'Type',
        width: 110,
        sortable: true,
      },
      {
        key: 'status',
        title: 'Status',
        width: 130,
        sortable: true,
        render: (value: string) => (
          <StatusBadge status={value} color={statusColor(value)} size="sm" />
        ),
      },
      {
        key: 'priority',
        title: 'Priority',
        width: 130,
        sortable: true,
        render: (value: PriorityLevel) => <PriorityIndicator priority={value} />,
      },
      {
        key: 'tags',
        title: 'Category',
        width: 120,
        render: (value: string[]) => (value && value.length > 0 ? value[0] : ''),
      },
      {
        key: 'updatedBy',
        title: 'Owner',
        width: 110,
        sortable: true,
      },
      {
        key: 'moduleId',
        title: 'Module',
        width: 120,
        render: (value: string | null) =>
          value ? moduleMap[value] ?? value.slice(0, 8) : '',
      },
      {
        key: 'updatedAt',
        title: 'Updated',
        width: 120,
        sortable: true,
        render: (value: string) => (
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {formatDate(value)}
          </span>
        ),
      },
    ],
    [moduleMap],
  );

  // ------ Dropdown style ------

  const selectStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  };

  // ------ Available statuses (from project custom statuses or defaults) ------

  const statuses = useMemo(() => {
    if (currentProject?.settings.customStatuses && currentProject.settings.customStatuses.length > 0) {
      return currentProject.settings.customStatuses;
    }
    return ['Draft', 'In Review', 'Approved', 'Rejected', 'Implemented', 'Verified', 'Deprecated'];
  }, [currentProject]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 shrink-0">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium rounded-md text-white shrink-0"
          style={{ backgroundColor: 'var(--color-accent)' }}
          onClick={handleNewRequirement}
        >
          + New Requirement
        </button>

        {/* Status filter */}
        <select
          className="px-3 py-2 text-sm rounded-md"
          style={selectStyle}
          value={(filters.status as string) ?? ''}
          onChange={handleStatusFilter}
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          className="px-3 py-2 text-sm rounded-md"
          style={selectStyle}
          value={(filters.priority as string) ?? ''}
          onChange={handlePriorityFilter}
        >
          <option value="">All Priorities</option>
          {PRIORITY_LEVELS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Type filter */}
        <select
          className="px-3 py-2 text-sm rounded-md"
          style={selectStyle}
          value={(filters.type as string) ?? ''}
          onChange={handleTypeFilter}
        >
          <option value="">All Types</option>
          {REQUIREMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Category filter */}
        <select
          className="px-3 py-2 text-sm rounded-md"
          style={selectStyle}
          value={(filters.category as string) ?? ''}
          onChange={handleCategoryFilter}
        >
          <option value="">All Categories</option>
          {(currentProject?.tags ?? []).map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="ml-auto w-64">
          <SearchBar
            value={(filters.search as string) ?? ''}
            onChange={handleSearch}
            placeholder="Search requirements..."
          />
        </div>
      </div>

      {/* Bulk operations bar */}
      {selectedIds.length > 0 && (
        <BulkOperationsBar
          selectedCount={selectedIds.length}
          onClear={() => setSelectedIds([])}
        />
      )}

      {/* Data table */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        <DataTable<Requirement>
          columns={columns}
          data={filteredRequirements}
          rowKey="id"
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={handleRowClick}
          onSort={setSort}
          sortField={sortField}
          sortDirection={sortDirection}
          rowClassName={rowClassName}
          emptyMessage="No requirements found. Create one to get started."
        />
      </div>

      {/* Detail panel */}
      {detailPanelOpen && selectedRequirementId && (
        <RequirementDetailPanel
          requirementId={selectedRequirementId}
          onClose={closeDetailPanel}
        />
      )}
    </div>
  );
};

export { RequirementsTableView };
export default RequirementsTableView;
