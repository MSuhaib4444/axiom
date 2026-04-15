'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore, ViewType } from '@/store/uiStore';
import { useDataStore } from '@/store/dataStore';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  LayoutGrid,
  BarChart2,
  Activity,
  MessageSquare,
  FileText,
  Upload,
  X,
  Search,
  Keyboard,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  group: string;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
}

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const {
    commandPaletteOpen,
    toggleCommandPalette,
    setActiveView,
    openModal,
    setSidebarCollapsed,
    sidebarCollapsed,
  } = useUIStore();
  const { clearFile, file } = useDataStore();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && commandPaletteOpen) {
        toggleCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, toggleCommandPalette]);

  const switchView = useCallback(
    (view: ViewType) => {
      setActiveView(view);
      toggleCommandPalette();
    },
    [setActiveView, toggleCommandPalette],
  );

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'view-grid',
      label: 'Switch to Grid view',
      description: 'Browse your data in a spreadsheet-like grid',
      icon: <LayoutGrid className="w-4 h-4" />,
      group: 'Navigation',
      action: () => switchView('grid'),
      disabled: !file,
    },
    {
      id: 'view-charts',
      label: 'Switch to Chart Studio',
      description: 'Visualize data with 15+ chart types',
      icon: <BarChart2 className="w-4 h-4" />,
      group: 'Navigation',
      action: () => switchView('charts'),
      disabled: !file,
    },
    {
      id: 'view-analysis',
      label: 'Switch to Statistical Analysis',
      description: 'Deep statistical analysis and profiling',
      icon: <Activity className="w-4 h-4" />,
      group: 'Navigation',
      action: () => switchView('analysis'),
      disabled: !file,
    },
    {
      id: 'view-ai',
      label: 'Switch to Ask AI',
      description: 'Ask questions about your data in plain English',
      icon: <MessageSquare className="w-4 h-4" />,
      group: 'Navigation',
      action: () => switchView('ai'),
      disabled: !file,
    },
    {
      id: 'view-report',
      label: 'Switch to AI Report',
      description: 'Generate a narrative data story',
      icon: <FileText className="w-4 h-4" />,
      group: 'Navigation',
      action: () => switchView('report'),
      disabled: !file,
    },

    // Actions
    {
      id: 'upload-file',
      label: 'Upload new file',
      description: 'Load a new Excel or CSV file',
      icon: <Upload className="w-4 h-4" />,
      group: 'Actions',
      action: () => {
        openModal('upload');
        toggleCommandPalette();
      },
    },
    {
      id: 'toggle-sidebar',
      label: sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar',
      description: 'Show or hide the left panel',
      icon: <LayoutGrid className="w-4 h-4" />,
      group: 'Actions',
      shortcut: '⌘ \\',
      action: () => {
        setSidebarCollapsed(!sidebarCollapsed);
        toggleCommandPalette();
      },
    },
    {
      id: 'go-home',
      label: 'Go to home page',
      description: 'Return to the landing page',
      icon: <LogOut className="w-4 h-4" />,
      group: 'Actions',
      action: () => {
        clearFile();
        router.replace('/');
        toggleCommandPalette();
      },
    },

    // Help
    {
      id: 'show-shortcuts',
      label: 'View keyboard shortcuts',
      description: 'See all available keyboard shortcuts',
      icon: <Keyboard className="w-4 h-4" />,
      group: 'Help',
      shortcut: '⌘ K',
      action: () => {
        openModal('shortcuts');
        toggleCommandPalette();
      },
    },
  ];

  const groupedCommands = commands.reduce<Record<string, CommandItem[]>>(
    (acc, cmd) => {
      if (!acc[cmd.group]) acc[cmd.group] = [];
      acc[cmd.group]!.push(cmd);
      return acc;
    },
    {},
  );

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="palette-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={toggleCommandPalette}
          />

          {/* Panel */}
          <motion.div
            key="palette-panel"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-[61] w-full max-w-xl"
          >
            <div
              className={cn(
                'glass-heavy rounded-2xl overflow-hidden',
                'border border-[var(--glass-border-strong)]',
                'shadow-[0_32px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(108,99,255,0.15)]',
              )}
            >
              <Command
                className="bg-transparent"
                loop
                shouldFilter
              >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--glass-border)]">
                  <Search className="w-4 h-4 flex-shrink-0 text-[var(--text-tertiary)]" />
                  <Command.Input
                    placeholder="Search commands…"
                    className={cn(
                      'flex-1 bg-transparent outline-none',
                      'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                      'text-sm font-medium',
                    )}
                    autoFocus
                  />
                  <button
                    onClick={toggleCommandPalette}
                    className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-white hover:bg-white/10 transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Results list */}
                <Command.List className="max-h-80 overflow-y-auto py-2 px-2 space-y-1">
                  <Command.Empty className="py-10 text-center text-sm text-[var(--text-tertiary)]">
                    No commands found.
                  </Command.Empty>

                  {Object.entries(groupedCommands).map(([group, items]) => (
                    <Command.Group
                      key={group}
                      heading={group}
                      className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[var(--text-tertiary)]"
                    >
                      {items.map((cmd) => (
                        <Command.Item
                          key={cmd.id}
                          value={`${cmd.label} ${cmd.description ?? ''}`}
                          disabled={cmd.disabled}
                          onSelect={cmd.disabled ? undefined : cmd.action}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer',
                            'text-[var(--text-secondary)] transition-all duration-100',
                            'data-[selected=true]:bg-[var(--accent-violet)]/15 data-[selected=true]:text-white data-[selected=true]:border data-[selected=true]:border-[var(--accent-violet)]/30',
                            'aria-disabled:opacity-30 aria-disabled:cursor-not-allowed',
                          )}
                        >
                          {/* Icon */}
                          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-[var(--text-tertiary)] data-[selected=true]:text-[var(--accent-violet)]">
                            {cmd.icon}
                          </span>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium leading-none mb-0.5">
                              {cmd.label}
                            </div>
                            {cmd.description && (
                              <div className="text-[11px] text-[var(--text-tertiary)] truncate">
                                {cmd.description}
                              </div>
                            )}
                          </div>

                          {/* Shortcut */}
                          {cmd.shortcut && (
                            <span className="flex-shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/15 text-[var(--text-tertiary)] bg-white/5">
                              {cmd.shortcut}
                            </span>
                          )}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  ))}
                </Command.List>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--glass-border)] text-[10px] text-[var(--text-tertiary)]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded border border-white/15 font-mono bg-white/5">↑↓</kbd>
                      navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded border border-white/15 font-mono bg-white/5">↵</kbd>
                      select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded border border-white/15 font-mono bg-white/5">Esc</kbd>
                      close
                    </span>
                  </div>
                  <span className="opacity-60">AXIOM Command Palette</span>
                </div>
              </Command>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
