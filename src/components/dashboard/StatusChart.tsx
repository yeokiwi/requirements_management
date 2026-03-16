import React, { useMemo } from 'react';
import { useRequirementStore } from '@/store/requirementStore';
import { useProjectStore } from '@/store/projectStore';

interface StatusGroup {
  status: string;
  count: number;
  color: string;
}

const DEFAULT_STATUS_COLORS: Record<string, string> = {
  Draft: '#94a3b8',
  'In Review': '#3b82f6',
  Approved: '#22c55e',
  Rejected: '#ef4444',
  Implemented: '#8b5cf6',
  Verified: '#14b8a6',
  Obsolete: '#6b7280',
};

function getStatusColor(statusName: string, projectStatuses?: { name: string; color: string }[]): string {
  if (projectStatuses) {
    const match = projectStatuses.find((s) => s.name === statusName);
    if (match?.color) return match.color;
  }
  return DEFAULT_STATUS_COLORS[statusName] ?? '#94a3b8';
}

const StatusChart: React.FC = () => {
  const requirements = useRequirementStore((s) => s.requirements);
  const currentProject = useProjectStore((s) => s.currentProject);

  const activeRequirements = useMemo(
    () => requirements.filter((r) => !r.deleted),
    [requirements],
  );

  const groups: StatusGroup[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const req of activeRequirements) {
      counts.set(req.status, (counts.get(req.status) ?? 0) + 1);
    }

    // Try to pull workflow statuses from project customStatuses for color lookup
    const projectStatuses = currentProject?.settings?.customStatuses?.map((name) => ({
      name,
      color: DEFAULT_STATUS_COLORS[name] ?? '#94a3b8',
    }));

    return Array.from(counts.entries()).map(([status, count]) => ({
      status,
      count,
      color: getStatusColor(status, projectStatuses),
    }));
  }, [activeRequirements, currentProject]);

  const total = activeRequirements.length;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        No requirements to display
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stacked horizontal bar */}
      <div className="flex h-8 w-full rounded-md overflow-hidden">
        {groups.map((group) => {
          const widthPercent = (group.count / total) * 100;
          return (
            <div
              key={group.status}
              className="h-full transition-all duration-300 relative group"
              style={{
                width: `${widthPercent}%`,
                backgroundColor: group.color,
                minWidth: widthPercent > 0 ? '4px' : '0',
              }}
              title={`${group.status}: ${group.count}`}
            >
              {widthPercent > 10 && (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white drop-shadow-sm">
                  {group.count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {groups.map((group) => (
          <div key={group.status} className="flex items-center gap-1.5 text-sm">
            <span
              className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: group.color }}
            />
            <span className="text-gray-700 dark:text-gray-300">
              {group.status}
            </span>
            <span className="text-gray-400 dark:text-gray-500 font-medium">
              {group.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusChart;
