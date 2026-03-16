import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 rounded-lg"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {icon && (
        <div
          className="mb-4 text-4xl"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {icon}
        </div>
      )}
      <h3
        className="text-lg font-semibold mb-1"
        style={{ color: 'var(--color-text)' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-sm mb-4 text-center max-w-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium rounded-md text-white"
          style={{ backgroundColor: 'var(--color-accent)' }}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
