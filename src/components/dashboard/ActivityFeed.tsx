import React, { useEffect, useState, useMemo } from 'react';
import { getDB } from '@/db/database';
import { useProjectStore } from '@/store/projectStore';
import { useRequirementStore } from '@/store/requirementStore';
import { formatRelative } from '@/utils/dateFormat';
import type { ChangeRecord, ChangeType } from '@/types';

const ACCENT_COLORS: Record<ChangeType, string> = {
  created: '#22c55e',
  updated: '#3b82f6',
  status_changed: '#eab308',
  deleted: '#ef4444',
  link_added: '#8b5cf6',
  link_removed: '#f97316',
  restored: '#14b8a6',
};

const MAX_ITEMS = 20;

const ActivityFeed: React.FC = () => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const requirements = useRequirementStore((s) => s.requirements);
  const [history, setHistory] = useState<ChangeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Build a lookup from requirement id to displayId
  const reqDisplayMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of requirements) {
      map.set(r.id, r.requirementId);
    }
    return map;
  }, [requirements]);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      if (!currentProject) {
        setHistory([]);
        setLoading(false);
        return;
      }

      try {
        const db = await getDB();
        const allHistory = await db.getAll('changeHistory');
        const filtered = allHistory
          .filter((h) => h.projectId === currentProject.id)
          .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
          .slice(0, MAX_ITEMS);

        if (!cancelled) {
          setHistory(filtered);
        }
      } catch (error) {
        console.error('Failed to load change history:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [currentProject]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Loading activity...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        No recent activity
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-72 space-y-2 pr-1">
      {history.map((record) => {
        const accentColor = ACCENT_COLORS[record.changeType] ?? '#94a3b8';
        const displayId = reqDisplayMap.get(record.requirementId) ?? record.requirementId.slice(0, 8);

        return (
          <div
            key={record.id}
            className="flex rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
          >
            {/* Left accent bar */}
            <div
              className="w-1 flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            />

            <div className="flex-1 px-3 py-2 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                  {displayId}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {formatRelative(record.changedAt)}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 truncate mt-0.5">
                {record.description}
              </p>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                by {record.changedBy.slice(0, 8) || 'system'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
