'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

/**
 * Registers workspace-level keyboard shortcuts.
 * Must be called inside a 'use client' component.
 *
 * Shortcuts:
 *   Ctrl/Cmd + \   — Toggle sidebar collapsed state
 *   Ctrl/Cmd + K   — Toggle command palette
 */
export function useKeyboardShortcuts(): void {
  const { sidebarCollapsed, setSidebarCollapsed, toggleCommandPalette } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const isMod = event.ctrlKey || event.metaKey;

      if (!isMod) return;

      switch (event.key) {
        case '\\':
          event.preventDefault();
          setSidebarCollapsed(!sidebarCollapsed);
          break;

        case 'k':
        case 'K':
          event.preventDefault();
          toggleCommandPalette();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarCollapsed, setSidebarCollapsed, toggleCommandPalette]);
}
