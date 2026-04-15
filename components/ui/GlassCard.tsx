import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'heavy' | 'subtle';
  glow?: 'none' | 'violet' | 'cyan' | 'green';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', glow = 'none', padding = 'lg', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          {
            'glass-card': variant === 'default',
            'glass-heavy': variant === 'heavy',
            'glass': variant === 'subtle',
          },
          {
            'glow-violet': glow === 'violet',
            'glow-cyan': glow === 'cyan',
            'glow-green': glow === 'green',
          },
          {
            'p-0': padding === 'none',
            'p-2': padding === 'sm',
            'p-4': padding === 'md',
            'p-6': padding === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

GlassCard.displayName = 'GlassCard';
