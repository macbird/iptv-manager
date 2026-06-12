import React from 'react';

interface ListEntityStatusBadgeProps {
  label: string;
  badgeClassName: string;
}

/** Compact status pill used in paginated list rows (matches customer list style). */
export const ListEntityStatusBadge: React.FC<ListEntityStatusBadgeProps> = ({
  label,
  badgeClassName,
}) => (
  <span
    className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${badgeClassName}`}
  >
    {label}
  </span>
);
