import React, { useMemo } from 'react';
import { useRequirementStore } from '@/store/requirementStore';
import { useReviewStore } from '@/store/reviewStore';
import { formatRelative } from '@/utils/dateFormat';
import StatusChart from './StatusChart';
import PriorityChart from './PriorityChart';
import CoverageMetrics from './CoverageMetrics';
import ActivityFeed from './ActivityFeed';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STALE_THRESHOLD_DAYS = 30;

function isStale(updatedAt: string): boolean {
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  return diffMs > STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Card wrapper
// ---------------------------------------------------------------------------

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => (
  <div
    className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 ${className}`}
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
      {title}
    </h3>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// DashboardView
// ---------------------------------------------------------------------------

const DashboardView: React.FC = () => {
  const requirements = useRequirementStore((s) => s.requirements);
  const reviews = useReviewStore((s) => s.reviews);

  const activeRequirements = useMemo(
    () => requirements.filter((r) => !r.deleted),
    [requirements],
  );

  // Stale requirements: not updated in the last 30 days and not in a final status
  const staleRequirements = useMemo(() => {
    const finalStatuses = new Set([
      'Approved',
      'Verified',
      'Obsolete',
      'Implemented',
      'Closed',
      'Done',
      'Completed',
    ]);
    return activeRequirements
      .filter((r) => !finalStatuses.has(r.status) && isStale(r.updatedAt))
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
  }, [activeRequirements]);

  // Open reviews
  const openReviews = useMemo(
    () => reviews.filter((r) => r.status !== 'Closed'),
    [reviews],
  );

  return (
    <div className="space-y-6">
      {/* 2x2 grid: desktop 2 columns, mobile 1 column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top-left: Status breakdown */}
        <Card title="Status Breakdown">
          <StatusChart />
        </Card>

        {/* Top-right: Priority breakdown */}
        <Card title="Priority Breakdown">
          <PriorityChart />
        </Card>

        {/* Bottom-left: Coverage metrics */}
        <Card title="Coverage Metrics">
          <CoverageMetrics />
        </Card>

        {/* Bottom-right: Activity feed */}
        <Card title="Recent Activity">
          <ActivityFeed />
        </Card>
      </div>

      {/* Stale requirements alert */}
      {staleRequirements.length > 0 && (
        <Card title={`Stale Requirements (${staleRequirements.length})`}>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Requirements not updated in the last {STALE_THRESHOLD_DAYS} days and not in a final status.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 pr-4 font-medium">ID</th>
                  <th className="pb-2 pr-4 font-medium">Title</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {staleRequirements.slice(0, 10).map((req) => (
                  <tr key={req.id} className="text-gray-700 dark:text-gray-300">
                    <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap">
                      {req.requirementId}
                    </td>
                    <td className="py-2 pr-4 truncate max-w-[200px]">
                      {req.title}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        {req.status}
                      </span>
                    </td>
                    <td className="py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {formatRelative(req.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {staleRequirements.length > 10 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                ...and {staleRequirements.length - 10} more
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Open reviews summary */}
      {openReviews.length > 0 && (
        <Card title={`Open Reviews (${openReviews.length})`}>
          <div className="space-y-2">
            {openReviews.map((review) => {
              const totalItems = review.items.length;
              const reviewedItems = review.items.filter(
                (item) => item.disposition !== 'Pending',
              ).length;

              return (
                <div
                  key={review.id}
                  className="flex items-center justify-between rounded-md border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {review.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {review.reviewers.length} reviewer{review.reviewers.length !== 1 ? 's' : ''}{' '}
                      &middot; Created {formatRelative(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        review.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {review.status}
                    </span>
                    {totalItems > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {reviewedItems}/{totalItems} reviewed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardView;
