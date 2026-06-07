'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, toggleTheme } = useUIStore();
  const isDark = theme === 'dark';

  return (
    <button
      id="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={cn(
        // track
        'relative inline-flex items-center gap-0 rounded-full p-[3px] border transition-all duration-300 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-violet)] focus-visible:ring-offset-2',
        isDark
          ? 'bg-white/5 border-white/10 hover:border-white/20 w-[52px] h-7'
          : 'bg-[var(--accent-violet)]/10 border-[var(--accent-violet)]/30 hover:border-[var(--accent-violet)]/60 w-[52px] h-7',
        className,
      )}
    >
      {/* Sliding pill */}
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={cn(
          'absolute top-[3px] w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-colors duration-300',
          isDark
            ? 'left-[3px] bg-white/10'
            : 'left-[27px] bg-[var(--accent-violet)]',
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ opacity: 0, rotate: -30, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 30, scale: 0.6 }}
              transition={{ duration: 0.18 }}
            >
              <Moon className="w-3 h-3 text-[var(--text-secondary)]" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, rotate: 30, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -30, scale: 0.6 }}
              transition={{ duration: 0.18 }}
            >
              <Sun className="w-3 h-3 text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    </button>
  );
};
