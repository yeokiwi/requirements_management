import React, { useMemo } from 'react';
import { useRequirementStore } from '@/store/requirementStore';
import { useTraceabilityStore } from '@/store/traceabilityStore';

interface MetricProps {
  label: string;
  percentage: number;
  color: string;
}

const CIRCLE_RADIUS = 36;
const CIRCLE_STROKE = 6;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
const CIRCLE_VIEW = (CIRCLE_RADIUS + CIRCLE_STROKE) * 2;
const CIRCLE_CENTER = CIRCLE_VIEW / 2;

const CircularProgress: React.FC<MetricProps> = ({ label, percentage, color }) => {
  const filled = (percentage / 100) * CIRCLE_CIRCUMFERENCE;
  const remaining = CIRCLE_CIRCUMFERENCE - filled;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg
          width={CIRCLE_VIEW}
          height={CIRCLE_VIEW}
          viewBox={`0 0 ${CIRCLE_VIEW} ${CIRCLE_VIEW}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={CIRCLE_CENTER}
            cy={CIRCLE_CENTER}
            r={CIRCLE_RADIUS}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={CIRCLE_STROKE}
          />
          {/* Progress arc */}
          <circle
            cx={CIRCLE_CENTER}
            cy={CIRCLE_CENTER}
            r={CIRCLE_RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={CIRCLE_STROKE}
            strokeDasharray={`${filled} ${remaining}`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {/* Center percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400 text-center leading-tight">
        {label}
      </span>
    </div>
  );
};

// Known final statuses by convention; projects may define their own via workflow
const DEFAULT_FINAL_STATUSES = new Set([
  'Approved',
  'Verified',
  'Obsolete',
  'Implemented',
  'Closed',
  'Done',
  'Completed',
]);

const CoverageMetrics: React.FC = () => {
  const requirements = useRequirementStore((s) => s.requirements);
  const links = useTraceabilityStore((s) => s.links);

  const activeRequirements = useMemo(
    () => requirements.filter((r) => !r.deleted),
    [requirements],
  );

  const total = activeRequirements.length;

  // Metric 1: % with at least one traceability link
  const traceabilityCoverage = useMemo(() => {
    if (total === 0) return 0;
    const linkedIds = new Set<string>();
    for (const link of links) {
      linkedIds.add(link.sourceId);
      linkedIds.add(link.targetId);
    }
    const count = activeRequirements.filter((r) => linkedIds.has(r.id)).length;
    return (count / total) * 100;
  }, [activeRequirements, links, total]);

  // Metric 2: % with acceptance criteria defined
  const acceptanceCoverage = useMemo(() => {
    if (total === 0) return 0;
    const count = activeRequirements.filter(
      (r) => r.acceptanceCriteria && r.acceptanceCriteria.length > 0,
    ).length;
    return (count / total) * 100;
  }, [activeRequirements, total]);

  // Metric 3: % in a final status
  const finalStatusCoverage = useMemo(() => {
    if (total === 0) return 0;
    const count = activeRequirements.filter((r) =>
      DEFAULT_FINAL_STATUSES.has(r.status),
    ).length;
    return (count / total) * 100;
  }, [activeRequirements, total]);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        No requirements to display
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <CircularProgress
        label="Traceability Coverage"
        percentage={traceabilityCoverage}
        color="#3b82f6"
      />
      <CircularProgress
        label="Acceptance Criteria"
        percentage={acceptanceCoverage}
        color="#8b5cf6"
      />
      <CircularProgress
        label="Final Status"
        percentage={finalStatusCoverage}
        color="#22c55e"
      />
    </div>
  );
};

export default CoverageMetrics;
