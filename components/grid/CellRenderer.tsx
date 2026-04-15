'use client';

import React from 'react';
import { CellValue, ColumnType } from '@/types/data';
import { formatCellValue } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { GlassBadge } from '../ui/GlassBadge';

export interface CellRendererProps {
  value: CellValue;
  type: ColumnType;
  isHighlighted?: boolean;
}

export const CellRenderer: React.FC<CellRendererProps> = ({ value, type, isHighlighted }) => {
  const isNull = value === null || value === undefined || value === '';
  
  if (isNull) {
    return (
      <div className={cn(
        "w-full h-full flex items-center px-2 py-1 text-xs",
        isHighlighted && "bg-[var(--accent-amber-glow)]"
      )}>
        <span className="text-[var(--text-disabled)]">—</span>
      </div>
    );
  }

  const formattedValue = formatCellValue(value, type);

  // Styling rules based on type
  let justifyClass = "justify-start";
  let additionalClasses = "truncate text-xs";
  let content: React.ReactNode = formattedValue;

  switch (type) {
    case 'number':
    case 'currency':
    case 'percentage':
      justifyClass = "justify-end";
      additionalClasses = "text-[var(--text-primary)] font-mono text-xs";
      break;
    case 'boolean':
      justifyClass = "justify-center";
      content = (
        <GlassBadge variant={formattedValue === 'Yes' ? 'green' : 'red'} size="sm">
          {formattedValue}
        </GlassBadge>
      );
      break;
    case 'date':
      justifyClass = "justify-start";
      additionalClasses = "text-[var(--text-secondary)] text-xs";
      break;
    case 'id':
      additionalClasses = "text-[var(--text-tertiary)] font-mono text-xs";
      break;
    default:
      additionalClasses = "text-[var(--text-secondary)] text-xs truncate";
  }

  return (
    <div 
      className={cn(
        "w-full h-full flex items-center px-3 overflow-hidden",
        justifyClass,
        isHighlighted && "bg-[var(--accent-amber-glow)]"
      )}
      title={String(value)}
    >
      {type === 'boolean' ? (
        content
      ) : (
        <span className={additionalClasses}>{content}</span>
      )}
    </div>
  );
};
