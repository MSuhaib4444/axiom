import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface GlassBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'violet' | 'cyan' | 'green' | 'amber' | 'red' | 'gray';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  className,
  variant = 'gray',
  size = 'sm',
  dot = false,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'badge',
        `badge-${variant}`,
        {
          'px-2 py-0.5 text-[10px]': size === 'sm',
          'px-2.5 py-1 text-xs': size === 'md',
        },
        className
      )}
      {...props}
    >
      {dot && (
        <span 
          className={cn('w-1.5 h-1.5 rounded-full mr-1 inline-block', {
            'bg-[#6C63FF]': variant === 'violet',
            'bg-[#00D4FF]': variant === 'cyan',
            'bg-[#39FF14]': variant === 'green',
            'bg-[#FFB627]': variant === 'amber',
            'bg-[#FF4757]': variant === 'red',
            'bg-gray-400': variant === 'gray',
          })}
        />
      )}
      {children}
    </span>
  );
};
