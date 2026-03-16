import React, { useMemo } from 'react';
import { useRequirementStore } from '@/store/requirementStore';
import type { PriorityLevel } from '@/types';

const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
  Undefined: '#6b7280',
};

const PRIORITY_ORDER: PriorityLevel[] = ['Critical', 'High', 'Medium', 'Low', 'Undefined'];

interface PriorityGroup {
  priority: PriorityLevel;
  count: number;
  color: string;
}

const RADIUS = 60;
const STROKE_WIDTH = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const VIEW_SIZE = (RADIUS + STROKE_WIDTH) * 2;
const CENTER = VIEW_SIZE / 2;

const PriorityChart: React.FC = () => {
  const requirements = useRequirementStore((s) => s.requirements);

  const activeRequirements = useMemo(
    () => requirements.filter((r) => !r.deleted),
    [requirements],
  );

  const groups: PriorityGroup[] = useMemo(() => {
    const counts = new Map<PriorityLevel, number>();
    for (const req of activeRequirements) {
      const p = req.priority as PriorityLevel;
      counts.set(p, (counts.get(p) ?? 0) + 1);
    }

    return PRIORITY_ORDER
      .filter((p) => (counts.get(p) ?? 0) > 0)
      .map((priority) => ({
        priority,
        count: counts.get(priority)!,
        color: PRIORITY_COLORS[priority],
      }));
  }, [activeRequirements]);

  const total = activeRequirements.length;

  // Calculate stroke-dasharray segments
  const segments = useMemo(() => {
    let cumulativeOffset = 0;
    return groups.map((group) => {
      const segmentLength = total > 0 ? (group.count / total) * CIRCUMFERENCE : 0;
      const gap = 2; // small gap between segments
      const dashLength = Math.max(segmentLength - gap, 0);
      const offset = cumulativeOffset;
      cumulativeOffset += segmentLength;
      return {
        ...group,
        dashArray: `${dashLength} ${CIRCUMFERENCE - dashLength}`,
        dashOffset: -offset,
      };
    });
  }, [groups, total]);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        No requirements to display
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Donut chart */}
      <div className="relative">
        <svg
          width={VIEW_SIZE}
          height={VIEW_SIZE}
          viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={STROKE_WIDTH}
          />
          {/* Segments */}
          {segments.map((seg) => (
            <circle
              key={seg.priority}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
              className="transition-all duration-300"
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {total}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {groups.map((group) => (
          <div key={group.priority} className="flex items-center gap-1.5 text-sm">
            <span
              className="inline-block w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: group.color }}
            />
            <span className="text-gray-700 dark:text-gray-300">
              {group.priority}
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

export default PriorityChart;
