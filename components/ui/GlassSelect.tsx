import React from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GlassSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface GlassSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option...',
  label,
  error,
  className,
}) => {
  return (
    <div className="flex flex-col w-full space-y-1">
      {label && (
        <label className="text-xs font-medium text-[var(--text-secondary)] ml-1">
          {label}
        </label>
      )}
      
      <Select.Root {...(value !== undefined ? { value } : {})} {...(onValueChange !== undefined ? { onValueChange } : {})}>
        <Select.Trigger
          className={cn(
            'input-glass flex items-center justify-between outline-none data-[placeholder]:text-[var(--text-tertiary)]',
            error && 'border-[var(--accent-red)] focus:border-[var(--accent-red)]',
            className
          )}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Select.Icon>
        </Select.Trigger>
        
        <Select.Portal>
          <Select.Content 
            className="glass-heavy z-50 overflow-hidden rounded-md border border-[var(--glass-border)] shadow-xl animate-in fade-in zoom-in-95 relative"
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled ?? false}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                    'text-[var(--text-primary)] focus:bg-[var(--accent-violet)] focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors'
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Select.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </Select.ItemIndicator>
                  </span>
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      
      {error && (
        <p className="text-xs text-[var(--accent-red)] font-medium ml-1">{error}</p>
      )}
    </div>
  );
};
