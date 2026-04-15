import React, { ReactNode } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export interface GlassTooltipProps {
  content: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
  className?: string;
}

export const GlassTooltip: React.FC<GlassTooltipProps> = ({
  content,
  side = 'top',
  children,
  className,
}) => {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            sideOffset={5}
            className={cn(
              'glass-heavy z-[60] px-3 py-1.5 text-xs text-[var(--text-primary)] rounded-md shadow-lg max-w-xs',
              'animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 duration-150',
              className
            )}
          >
            {content}
            <Tooltip.Arrow className="fill-[var(--glass-border)]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
