'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDataStore } from '@/store/dataStore';
import { useAIStore } from '@/store/aiStore';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { AIChatPanel } from '@/components/ai/AIChatPanel';
import { useUIStore } from '@/store/uiStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Loader2 } from 'lucide-react';

function AskPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { file, isRestoring } = useDataStore();
  const { isChatThinking } = useAIStore();
  const { sidebarCollapsed, isMobile, setActiveView } = useUIStore();
  const [initialized, setInitialized] = useState(false);

  // Register keyboard shortcuts (sidebar toggle, command palette)
  useKeyboardShortcuts();

  // Sync active view to Topbar
  useEffect(() => {
    setActiveView('ai');
  }, [setActiveView]);

  useEffect(() => {
    if (!isRestoring && !file) {
      router.replace('/');
      return;
    }

    const initialQuery = searchParams.get('q');
    if (initialQuery && !initialized && !isChatThinking) {
      setInitialized(true);
    }
  }, [file, isRestoring, router, searchParams, initialized, isChatThinking]);

  if (isRestoring || !file) {
    return (
      <div className="h-screen bg-[var(--bg-space)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)]" />
        <span className="text-sm text-[var(--text-secondary)] font-medium">Restoring session...</span>
      </div>
    );
  }

  const sidebarW = isMobile ? 0 : sidebarCollapsed ? 48 : 240;

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg-space)] relative flex flex-col">
      <Topbar />
      <Sidebar />
      <CommandPalette />

      <div 
        className="absolute inset-0 bottom-0 overflow-hidden flex flex-col transition-all duration-300"
        style={{
          top: 56, // TOPBAR_H
          left: sidebarW,
        }}
      >
        <div className="w-full max-w-5xl mx-auto flex flex-col h-full p-4 md:p-6">
          {/* Main Chat Panel */}
          <div className="flex-1 overflow-hidden">
            <AIChatPanel compact={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AskPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-[var(--bg-space)] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="text-sm text-[var(--text-secondary)]">Loading Chat Studio...</span>
        </div>
      }
    >
      <AskPageContent />
    </Suspense>
  );
}