import React from 'react';

export interface FormatBadgeProps {
  format: string;
}

export const FormatBadge: React.FC<FormatBadgeProps> = ({ format }) => {
  return (
    <span className="badge badge-gray font-mono">
      {format.toUpperCase()}
    </span>
  );
};
