import React, { forwardRef } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

export interface GlassSliderProps {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
}

export const GlassSlider = forwardRef<HTMLSpanElement, GlassSliderProps>(
  ({
    label,
    min,
    max,
    step = 1,
    value,
    defaultValue,
    onValueChange,
    showValue = true,
    formatValue = (v) => v.toString(),
    className,
  }, ref) => {
    
    const displayValue = value ? value[0] : (defaultValue ? defaultValue[0] : min);

    return (
      <div className={cn("flex flex-col w-full space-y-3", className)}>
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && (
              <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>
            )}
            {showValue && displayValue !== undefined && (
              <span className="text-xs font-medium text-[var(--accent-violet)]">
                {formatValue(displayValue)}
              </span>
            )}
          </div>
        )}
        
        <Slider.Root
          ref={ref}
          className="relative flex items-center select-none touch-none w-full h-5"
          {...(value !== undefined ? { value } : {})}
          {...(defaultValue !== undefined ? { defaultValue } : {})}
          {...(onValueChange !== undefined ? { onValueChange } : {})}
          max={max}
          min={min}
          step={step}
        >
          <Slider.Track className="relative grow rounded-full h-1.5 bg-white/10 overflow-hidden border border-white/5">
            <Slider.Range className="absolute h-full bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-cyan)] opacity-80" />
          </Slider.Track>
          <Slider.Thumb 
            className="block w-4 h-4 bg-white rounded-full shadow-lg hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--accent-violet-glow)] transition-transform z-10" 
            aria-label={label || "Slider"}
          />
        </Slider.Root>
      </div>
    );
  }
);

GlassSlider.displayName = 'GlassSlider';
