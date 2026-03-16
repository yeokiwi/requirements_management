import React, { useMemo, useCallback } from 'react';
import { useReviewStore } from '@/store/reviewStore';
import { useRequirementStore } from '@/store/requirementStore';
import { useUIStore } from '@/store/uiStore';
import type { ReviewDisposition } from '@/types';
import { REVIEW_DISPOSITIONS } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ReviewItemCard } from './ReviewItemCard';

interface ReviewWorkspaceProps {
  reviewId: string;
  onBack: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  Open: '#3b82f6',
  'In Progress': '#f59e0b',
  Closed: '#6b7280',
};

export const ReviewWorkspace: React.FC<ReviewWorkspaceProps> = ({
  reviewId,
  onBack,
}) => {
  const { reviews, updateReviewItem, closeReview } = useReviewStore();
  const { requirements } = useRequirementStore();
  const { userName } = useUIStore();

  const review = useMemo(
    () => reviews.find((r) => r.id === reviewId),
    [reviews, reviewId],
  );

  const reqMap = useMemo(() => {
    const map = new Map<string, (typeof requirements)[0]>();
    for (const r of requirements) {
      map.set(r.id, r);
    }
    return map;
  }, [requirements]);

  const dispositionTally = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const d of REVIEW_DISPOSITIONS) {
      tally[d] = 0;
    }
    if (review) {
      for (const item of review.items) {
        tally[item.disposition] = (tally[item.disposition] ?? 0) + 1;
      }
    }
    return tally;
  }, [review]);

  const completionPct = useMemo(() => {
    if (!review || review.items.length === 0) return 0;
    const reviewed = review.items.filter((i) => i.disposition !== 'Pending').length;
    return Math.round((reviewed / review.items.length) * 100);
  }, [review]);

  const handleItemUpdate = useCallback(
    async (requirementId: string, disposition: ReviewDisposition, comment: string) => {
      await updateReviewItem(reviewId, requirementId, {
        disposition,
        comment,
        reviewedBy: userName,
        reviewedAt: new Date().toISOString(),
      });
    },
    [reviewId, updateReviewItem, userName],
  );

  const handleCloseReview = useCallback(async () => {
    await closeReview(reviewId);
  }, [closeReview, reviewId]);

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p style={{ color: 'var(--color-text-secondary)' }}>Review not found.</p>
        <button
          type="button"
          className="mt-4 text-sm underline"
          style={{ color: 'var(--color-accent)' }}
          onClick={onBack}
        >
          Go back
        </button>
      </div>
    );
  }

  const DISPOSITION_COLORS: Record<string, string> = {
    Accepted: '#10b981',
    Rejected: '#ef4444',
    'Needs Revision': '#f59e0b',
    Deferred: '#6b7280',
    Pending: '#9ca3af',
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="text-sm px-2 py-1 rounded"
          style={{
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
          onClick={onBack}
        >
          Back
        </button>
        <h2
          className="text-xl font-semibold flex-1"
          style={{ color: 'var(--color-text)' }}
        >
          {review.title}
        </h2>
        <StatusBadge
          status={review.status}
          color={STATUS_COLORS[review.status] ?? '#6b7280'}
        />
        {review.status !== 'Closed' && (
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium rounded-md text-white"
            style={{ backgroundColor: '#6b7280' }}
            onClick={handleCloseReview}
          >
            Close Review
          </button>
        )}
      </div>

      {/* Completion bar */}
      <div className="flex items-center gap-3">
        <div
          className="flex-1 h-3 rounded-full overflow-hidden"
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
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {completionPct}% complete
        </span>
      </div>

      {/* Review items */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3">
        {review.items.map((item) => {
          const req = reqMap.get(item.requirementId);
          if (!req) return null;
          return (
            <ReviewItemCard
              key={item.requirementId}
              item={item}
              requirement={req}
              onUpdate={(disposition, comment) =>
                handleItemUpdate(item.requirementId, disposition, comment)
              }
            />
          );
        })}
      </div>

      {/* Summary */}
      <div
        className="rounded-lg p-4 shrink-0"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--color-text)' }}
        >
          Disposition Summary
        </h3>
        <div className="flex items-center gap-4 flex-wrap">
          {REVIEW_DISPOSITIONS.map((d) => (
            <div key={d} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: DISPOSITION_COLORS[d] ?? '#6b7280' }}
              />
              <span
                className="text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {d}: <strong style={{ color: 'var(--color-text)' }}>{dispositionTally[d]}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewWorkspace;
