'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

/**
 * ThemeProvider — mounts once inside the layout and keeps
 * `html[data-theme]` in sync with the Zustand theme state.
 * All visual theming is done via CSS variables scoped to
 * `html[data-theme="light"]` in globals.css.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    // Smooth colour transition on the root
    html.style.colorScheme = theme;
  }, [theme]);

  return <>{children}</>;
}
