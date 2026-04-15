import React, { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GlassModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  className,
}) => {
  return (
    <Dialog.Root {...(open !== undefined ? { open } : {})} {...(onOpenChange !== undefined ? { onOpenChange } : {})}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200" />
        <Dialog.Content
          className={cn(
            'glass-heavy fixed left-[50%] top-[50%] z-50 flex flex-col',
            'translate-x-[-50%] translate-y-[-50%] p-6 shadow-xl',
            'animate-in fade-in slide-in-from-bottom-[20px] duration-300',
            {
              'w-[90vw] max-w-sm': size === 'sm',
              'w-[90vw] max-w-lg': size === 'md',
              'w-[90vw] max-w-2xl': size === 'lg',
              'w-[90vw] max-w-4xl': size === 'xl',
              'w-[95vw] max-w-[95vw] h-[95vh]': size === 'full',
            },
            className
          )}
        >
          <div className="flex flex-col space-y-1.5 mb-4 pr-8">
            <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="text-sm text-[var(--text-secondary)]">
                {description}
              </Dialog.Description>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--text-tertiary)] hover:bg-white/10 hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-violet)] transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
