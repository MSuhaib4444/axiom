import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, title, collapsible = false, defaultCollapsed = false, onCollapse, children, ...props }, ref) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    const toggleCollapse = () => {
      if (!collapsible) return;
      const next = !isCollapsed;
      setIsCollapsed(next);
      if (onCollapse) onCollapse(next);
    };

    return (
      <div ref={ref} className={cn('glass-heavy flex flex-col rounded-xl overflow-hidden shadow-sm', className)} {...props}>
        {title && (
          <div 
            className={cn('flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 select-none', collapsible && 'cursor-pointer hover:bg-white/10 transition-colors')}
            onClick={toggleCollapse}
          >
            <h3 className="text-sm font-medium text-[var(--text-primary)]">{title}</h3>
            {collapsible && (
              <span className="text-[var(--text-secondary)]">
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </span>
            )}
          </div>
        )}
        
        <div 
          className={cn(
            'transition-all duration-300 ease-in-out origin-top overflow-hidden',
            isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
          )}
        >
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';
