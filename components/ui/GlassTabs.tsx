import React, { ReactNode } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import { GlassBadge } from './GlassBadge';

export interface GlassTabOption {
  value: string;
  label: string;
  icon?: ReactNode;
  badge?: string;
}

export interface GlassTabsProps {
  tabs: GlassTabOption[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
  className?: string;
  listClassName?: string;
}

export const GlassTabs: React.FC<GlassTabsProps> = ({
  tabs,
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  listClassName,
}) => {
  const effectiveDefaultValue = defaultValue || tabs[0]?.value;

  return (
    <Tabs.Root 
      {...(effectiveDefaultValue !== undefined ? { defaultValue: effectiveDefaultValue } : {})} 
      {...(value !== undefined ? { value } : {})} 
      {...(onValueChange !== undefined ? { onValueChange } : {})}
      className={cn('flex flex-col w-full', className)}
    >
      <Tabs.List 
        className={cn(
          'flex items-center space-x-1 border-b border-white/10 overflow-x-auto no-scrollbar',
          listClassName
        )}
      >
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all select-none',
              'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-t-lg',
              'data-[state=active]:text-[var(--accent-violet)] data-[state=active]:bg-white/10 data-[state=active]:shadow-[0_2px_0_0_var(--accent-violet)]'
            )}
          >
            {tab.icon && <span className="w-4 h-4 flex items-center justify-center">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && (
              <GlassBadge variant="violet" size="sm">{tab.badge}</GlassBadge>
            )}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      
      {children}
    </Tabs.Root>
  );
};

export const GlassTabContent = React.forwardRef<HTMLDivElement, Tabs.TabsContentProps>(
  ({ className, ...props }, ref) => (
    <Tabs.Content
      ref={ref}
      className={cn(
        'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-violet)] rounded-md',
        className
      )}
      {...props}
    />
  )
);

GlassTabContent.displayName = 'GlassTabContent';
