'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { ChartPicker } from '@/components/charts/ChartPicker';
import { ChartCanvas } from '@/components/charts/ChartCanvas';
import { ChartConfig } from '@/types/charts';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataStore } from '@/store/dataStore';
import { useUIStore } from '@/store/uiStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { DataGrid } from '@/components/grid/DataGrid';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { NLQBar } from '@/components/ai/NLQBar';
import { AIChatPanel } from '@/components/ai/AIChatPanel';
import {
  BarChart2,
  Activity,
  MessageSquare,
  FileText,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Placeholder view for Phase 2 / Phase 3 views
// ─────────────────────────────────────────────
interface PlaceholderViewProps {
  icon: React.ReactNode;
  title: string;
  badge: string;
  description: string;
  accentColor: string;
  features?: string[];
}

function PlaceholderView({
  icon,
  title,
  badge,
  description,
  accentColor,
  features = [],
}: PlaceholderViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 flex items-center justify-center p-8"
    >
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Glowing icon */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-2"
          style={{
            background: `radial-gradient(circle at center, ${accentColor}22 0%, transparent 70%)`,
            border: `1px solid ${accentColor}33`,
            color: accentColor,
            boxShadow: `0 0 40px ${accentColor}22`,
          }}
        >
          {icon}
        </div>

        {/* Badge */}
        <div>
          <span
            className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest"
            style={{
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}30`,
              color: accentColor,
            }}
          >
            {badge}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-display font-bold text-[var(--text-primary)]">
          {title}
        </h2>

        {/* Description */}
        <p className="text-[var(--text-secondary)] text-base leading-relaxed">
          {description}
        </p>

        {/* Feature teasers */}
        {features.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left mt-4">
            {features.map((feat) => (
              <li
                key={feat}
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] px-3 py-2 rounded-lg bg-white/5 border border-white/8"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: accentColor }}
                />
                {feat}
              </li>
            ))}
          </ul>
        )}

        {/* Coming soon pill */}
        <div className="pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-xs text-[var(--text-tertiary)]">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: accentColor }}
            />
            In active development — stay tuned
          </div>
        </div>
      </div>
    </motion.div>
  );
}



function MiniReportView() {
  const router = useRouter();
  const [tone, setTone] = useState<'executive' | 'technical' | 'casual'>('executive');
  
  const tones = [
    { id: 'executive', label: 'Executive', description: 'High-level summary' },
    { id: 'technical', label: 'Technical', description: 'Deep tech stats' },
    { id: 'casual', label: 'Casual', description: 'Conversational narrative' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 flex items-center justify-center p-8 bg-black/40"
    >
      <div className="max-w-md w-full">
        <GlassCard className="text-center py-8 flex flex-col items-center border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-amber)]/15 flex items-center justify-center border border-[var(--accent-amber)]/30 mb-6 shadow-[0_0_30px_rgba(255,182,39,0.15)]">
            <FileText className="w-8 h-8 text-[var(--accent-amber)]" />
          </div>
          
          <h2 className="text-2xl font-display font-bold text-white mb-2">
            AI Data Story Report
          </h2>
          <p className="text-slate-400 text-sm mb-6 max-w-sm leading-relaxed px-4">
            Select a tone for your data story. AXIOM will generate a comprehensive report with insights and metrics.
          </p>

          {/* Tone Selector */}
          <div className="grid grid-cols-3 gap-2.5 w-full mb-6 px-4">
            {tones.map((t) => {
              const isSelected = tone === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id as any)}
                  className={cn(
                    "text-left p-3 rounded-xl border transition-all cursor-pointer",
                    isSelected 
                      ? "border-[var(--accent-violet)] bg-[var(--accent-violet)]/10 text-white shadow-[0_0_12px_var(--accent-violet-glow)]" 
                      : "border-white/5 bg-white/[0.02] text-[var(--text-secondary)] hover:border-white/10"
                  )}
                >
                  <div className="font-semibold text-xs mb-1">{t.label}</div>
                  <div className="text-[10px] text-[var(--text-tertiary)] line-clamp-1">{t.description}</div>
                </button>
              );
            })}
          </div>

          <div className="w-full px-4">
            <GlassButton 
              variant="primary" 
              onClick={() => router.push(`/report?tone=${tone}`)}
              className="w-full shadow-[0_0_20px_var(--accent-violet-glow)]"
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Generate Full Report
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Main Workspace Page
// ─────────────────────────────────────────────
export default function WorkspacePage() {
  const router = useRouter();
  const { file } = useDataStore();
  
  const {
    activeView,
    sidebarCollapsed,
    isMobile,
    setIsMobile,
    setSidebarCollapsed,
  } = useUIStore();

  const [currentChartConfig, setCurrentChartConfig] = useState<ChartConfig | null>(null);

  // Register workspace keyboard shortcuts
  useKeyboardShortcuts();

  // Guard: redirect to landing if no file is loaded
  useEffect(() => {
    if (!file) {
      router.replace('/');
    }
  }, [file, router]);

  // Responsive: detect mobile breakpoint
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    mediaQuery.addEventListener('change', (e) => setIsMobile(e.matches));
    return () => mediaQuery.removeEventListener('change', (e) => setIsMobile(e.matches));
  }, [setIsMobile]);

  // Layout measurements matching the fixed components
  const TOPBAR_H = 56; // h-14 = 3.5rem = 56px
  const STATUSBAR_H = 28; // h-7 = 1.75rem = 28px
  const sidebarW = isMobile ? 0 : sidebarCollapsed ? 48 : 240;

  // Don't render anything while redirecting
  if (!file) return null;

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg-space)] relative">
      {/* ── Fixed chrome ─────────────────────────────── */}
      <Topbar />
      <Sidebar />
      <StatusBar />
      <CommandPalette />

      {/* ── Mobile sidebar backdrop ───────────────────── */}
      <AnimatePresence>
        {isMobile && !sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}
      </AnimatePresence>

      {/* ── Main layout shell ────────────────────────── */}
      {/*
        Offsets:
          top    → Topbar (56px)
          bottom → StatusBar (28px)
          left   → Sidebar (varies: 0 mobile, 48 collapsed, 240 expanded)
          right  → AI panel (varies: 0 closed, rightPanelWidth open)
        All transitions mirror the fixed panel transition-all duration-300.
      */}
      <div
        className="absolute inset-0 overflow-hidden flex flex-col transition-all duration-300"
        style={{
          top: TOPBAR_H,
          bottom: STATUSBAR_H,
          left: sidebarW,
          right: 0,
        }}
      >
        {/* ── View area ───────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {/* GRID VIEW */}
            {activeView === 'grid' && (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="absolute inset-0"
              >
                {/* DataGrid includes SheetTabs + GridToolbar internally */}
                <DataGrid />
                <NLQBar />
              </motion.div>
            )}

            {/* CHARTS VIEW */}
            {activeView === 'charts' && (
              <motion.div
                key="charts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="absolute inset-0"
              >
                <PanelGroup orientation="horizontal" className="h-full">
                  {/* Left: Picker Panel (Increase default size for visibility) */}
                  <Panel 
                    defaultSize="30%" 
                    minSize="25%" 
                    maxSize="45%"
                    className="h-full border-r border-[var(--glass-border)] bg-black/10 overflow-y-auto custom-scrollbar"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent-violet)]/15 flex items-center justify-center">
                          <BarChart2 className="w-4 h-4 text-[var(--accent-violet)]" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">Chart Config</h3>
                      </div>
                      <ChartPicker onConfigChange={setCurrentChartConfig} />
                    </div>
                  </Panel>

                  <PanelResizeHandle className="w-1.5 bg-transparent hover:bg-[var(--accent-cyan)]/30 active:bg-[var(--accent-cyan)]/50 transition-colors relative z-10 group">
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-[var(--glass-border)] group-hover:bg-[var(--accent-cyan)]/50" />
                  </PanelResizeHandle>

                  {/* Right: Canvas Panel (flex-1) */}
                  <Panel className="h-full overflow-y-auto bg-black/5">
                    <div className="p-8 pb-24">
                      {currentChartConfig ? (
                        <div className="max-w-4xl mx-auto space-y-8">
                          <ChartCanvas 
                            config={currentChartConfig} 
                            height={500}
                          />
                          
                          <div className="flex justify-center">
                            <GlassButton
                              variant="ghost"
                              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-cyan)]"
                              onClick={() => router.push('/visualize')}
                            >
                              Open in Full Studio
                            </GlassButton>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                            <BarChart2 className="w-8 h-8 text-white" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-lg font-medium text-white">Configure a chart</h4>
                            <p className="text-sm text-slate-400 max-w-xs">
                              Select columns and chart type on the left to visualize your data.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Panel>
                </PanelGroup>
              </motion.div>
            )}

            {/* ANALYSIS VIEW */}
            {activeView === 'analysis' && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="absolute inset-0 flex items-center justify-center p-8 bg-black/40"
              >
                <div className="max-w-md w-full">
                  <GlassCard className="text-center py-12 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--accent-cyan)]/15 flex items-center justify-center border border-[var(--accent-cyan)]/30 mb-6 shadow-[0_0_30px_rgba(0,212,255,0.2)]">
                      <Activity className="w-8 h-8 text-[var(--accent-cyan)]" />
                    </div>
                    
                    <h2 className="text-2xl font-display font-bold text-white mb-3">
                      Deep Data Analysis
                    </h2>
                    
                    <p className="text-slate-400 text-sm mb-8 px-4 leading-relaxed">
                      Explore descriptive statistics, run column profiling, discover feature correlations, and detect anomalies using robust statistical methods and AI.
                    </p>
                    
                    <GlassButton 
                      variant="primary" 
                      onClick={() => router.push('/analyze')}
                      className="px-8 shadow-[0_0_20px_var(--accent-violet-glow)]"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Open Full Analysis Workspace
                    </GlassButton>
                  </GlassCard>
                </div>
              </motion.div>
            )}

            {/* ASK AI VIEW */}
            {activeView === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="absolute inset-0 bg-black/20 overflow-hidden"
              >
                <AIChatPanel compact={true} />
              </motion.div>
            )}

            {/* REPORT VIEW */}
            {activeView === 'report' && (
              <MiniReportView key="report" />
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
