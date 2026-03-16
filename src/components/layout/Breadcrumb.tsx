import React from 'react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <nav
      className="flex items-center gap-1.5 px-4 py-2 text-sm border-b"
      style={{ borderColor: 'var(--color-border)' }}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
            {item.onClick && !isLast ? (
              <button
                className="hover:underline transition-colors"
                style={{ color: 'var(--color-accent)' }}
                onClick={item.onClick}
              >
                {item.label}
              </button>
            ) : (
              <span
                style={{
                  color: isLast
                    ? 'var(--color-text)'
                    : 'var(--color-text-secondary)',
                  fontWeight: isLast ? 500 : 400,
                }}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
