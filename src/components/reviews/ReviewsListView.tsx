import React, { useState, useMemo } from 'react';
import { useReviewStore } from '@/store/reviewStore';
import { useRequirementStore } from '@/store/requirementStore';
import type { Review } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { CreateReviewDialog } from './CreateReviewDialog';
import { ReviewWorkspace } from './ReviewWorkspace';

const STATUS_COLORS: Record<string, string> = {
  Open: '#3b82f6',
  'In Progress': '#f59e0b',
  Closed: '#6b7280',
};

export const ReviewsListView: React.FC = () => {
  const { reviews } = useReviewStore();
  const { requirements } = useRequirementStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  const reviewRows = useMemo(() => {
    return reviews.map((review) => {
      const total = review.items.length;
      const reviewed = review.items.filter((i) => i.disposition !== 'Pending').length;
      const completionPct = total > 0 ? Math.round((reviewed / total) * 100) : 0;
      return { review, total, reviewed, completionPct };
    });
  }, [reviews]);

  if (activeReviewId) {
    return (
      <ReviewWorkspace
        reviewId={activeReviewId}
        onBack={() => setActiveReviewId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-semibold"
          style={{ color: 'var(--color-text)' }}
        >
          Reviews
        </h2>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium rounded-md text-white"
          style={{ backgroundColor: 'var(--color-accent)' }}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Review
        </button>
      </div>

      {/* Table */}
      {reviewRows.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Create a review to start evaluating requirements."
          action={{ label: 'Create Review', onClick: () => setCreateDialogOpen(true) }}
        />
      ) : (
        <div
          className="rounded-lg overflow-hidden"
          style={{
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <th
                  className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Name
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Status
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Created
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Items
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Completion
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {reviewRows.map(({ review, total, completionPct }, idx) => (
                <tr
                  key={review.id}
                  className="cursor-pointer transition-colors hover:brightness-110"
                  style={{
                    backgroundColor:
                      idx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                  onClick={() => setActiveReviewId(review.id)}
                >
                  <td
                    className="px-4 py-3 font-medium"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {review.title}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={review.status}
                      color={STATUS_COLORS[review.status] ?? '#6b7280'}
                      size="sm"
                    />
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {total}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--color-bg)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${completionPct}%`,
                            backgroundColor:
                              completionPct === 100 ? '#10b981' : 'var(--color-accent)',
                          }}
                        />
                      </div>
                      <span
                        className="text-xs w-10 text-right"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {completionPct}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: 'var(--color-bg)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveReviewId(review.id);
                      }}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateReviewDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  );
};

export default ReviewsListView;
