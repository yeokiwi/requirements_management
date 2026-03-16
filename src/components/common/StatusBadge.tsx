import React from 'react';

interface StatusBadgeProps {
  status: string;
  color?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  color = '#6b7280',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full whitespace-nowrap ${sizeClasses}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
