import React from 'react';
import type { PriorityLevel } from '@/types/enums';

const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
  Undefined: '#6b7280',
};

interface PriorityIndicatorProps {
  priority: PriorityLevel;
}

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({ priority }) => {
  const color = PRIORITY_COLORS[priority];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        title={priority}
      />
      <span className="text-sm" style={{ color }}>
        {priority}
      </span>
    </span>
  );
};

export { PRIORITY_COLORS };
export default PriorityIndicator;
