'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { cn } from '@/lib/utils';
import {
  Sparkles,
  BarChart2,
  Activity,
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  Wand2,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';

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

// ─────────────────────────────────────────────
// AI Insights Panel (right side)
// ─────────────────────────────────────────────
interface AIPanelProps {
  isOpen: boolean;
  width: number;
  isMobile: boolean;
  onToggle: () => void;
}

function AIPanel({ isOpen, width, isMobile, onToggle }: AIPanelProps) {
  // Hidden entirely on mobile
  if (isMobile) return null;

  return (
    <>
      {/* Toggle tab — always visible, affixed to right edge */}
      <button
        onClick={onToggle}
        title={isOpen ? 'Close AI panel' : 'Open AI Insights'}
        className={cn(
          'fixed top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-5 h-14 rounded-l-lg transition-all duration-300',
          'bg-[var(--bg-card)] border border-[var(--glass-border)] border-r-0',
          'text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]',
          'shadow-[0_0_20px_rgba(0,212,255,0.1)]',
        )}
        style={{ right: isOpen ? width : 0 }}
      >
        {isOpen ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: width }}
            animate={{ x: 0 }}
            exit={{ x: width }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-14 bottom-7 z-40 glass-heavy border-l border-[var(--glass-border)] flex flex-col overflow-hidden"
            style={{ width }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/25 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  AI Insights
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]">
                  Phase 2
                </span>
              </div>
              <button
                onClick={onToggle}
                className="p-1 rounded-md text-[var(--text-tertiary)] hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Placeholder content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Coming-soon insight cards */}
              {[
                {
                  icon: <Wand2 className="w-4 h-4" />,
                  label: 'Auto-Summary',
                  desc: 'Gemini will summarize your dataset in plain English.',
                  color: 'var(--accent-violet)',
                },
                {
                  icon: <TrendingUp className="w-4 h-4" />,
                  label: 'Trend Detection',
                  desc: 'Automatically detect trends and seasonality in time-series columns.',
                  color: 'var(--accent-cyan)',
                },
                {
                  icon: <AlertTriangle className="w-4 h-4" />,
                  label: 'Anomaly Alerts',
                  desc: 'Highlights statistical outliers and data quality issues.',
                  color: 'var(--accent-amber)',
                },
                {
                  icon: <Lightbulb className="w-4 h-4" />,
                  label: 'Smart Suggestions',
                  desc: 'Recommends the best chart types and analyses for your data.',
                  color: 'var(--accent-green)',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-xl border border-white/8 bg-white/[0.03] space-y-1.5 opacity-60"
                >
                  <div className="flex items-center gap-2" style={{ color: item.color }}>
                    {item.icon}
                    <span className="text-xs font-semibold">{item.label}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Panel footer */}
            <div className="px-4 py-3 border-t border-[var(--glass-border)] flex-shrink-0">
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-violet)] animate-pulse" />
                Powered by Gemini 2.0 Flash — Phase 2
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
    openPanels,
    togglePanel,
    rightPanelWidth,
  } = useUIStore();

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

  const isAIPanelOpen = openPanels.has('aiPanel');

  // Layout measurements matching the fixed components
  const TOPBAR_H = 56; // h-14 = 3.5rem = 56px
  const STATUSBAR_H = 28; // h-7 = 1.75rem = 28px
  const sidebarW = isMobile ? 0 : sidebarCollapsed ? 48 : 240;
  const aiPanelW = isMobile || !isAIPanelOpen ? 0 : rightPanelWidth;

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
          right: aiPanelW,
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
              </motion.div>
            )}

            {/* CHARTS VIEW */}
            {activeView === 'charts' && (
              <PlaceholderView
                key="charts"
                icon={<BarChart2 className="w-12 h-12" />}
                title="Chart Studio"
                badge="Phase 2"
                description="Drag columns onto axes and choose from 15+ chart types — bar, line, scatter, heatmap, treemap, Sankey, candlestick and more."
                accentColor="var(--accent-cyan)"
                features={[
                  'Bar, Line, Area, Pie',
                  'Scatter, Heatmap, Radar',
                  'Treemap & Sankey',
                  'Candlestick & Box Plot',
                  'Export PNG / SVG / PDF',
                  'AI-recommended charts',
                ]}
              />
            )}

            {/* ANALYSIS VIEW */}
            {activeView === 'analysis' && (
              <PlaceholderView
                key="analysis"
                icon={<Activity className="w-12 h-12" />}
                title="Statistical Analysis"
                badge="Phase 2"
                description="Professional-grade statistical analysis across every column — distributions, correlations, regression, clustering, and anomaly detection."
                accentColor="var(--accent-green)"
                features={[
                  'Column Profiler',
                  'Correlation Matrix',
                  'Distribution Explorer',
                  'Anomaly Detection',
                  'K-Means Clustering',
                  'Linear Regression',
                  'Time-Series Decomposition',
                  'Multi-Sheet Join',
                ]}
              />
            )}

            {/* ASK AI VIEW */}
            {activeView === 'ai' && (
              <PlaceholderView
                key="ai"
                icon={<MessageSquare className="w-12 h-12" />}
                title="Ask AI"
                badge="Phase 3"
                description="Ask any question about your data in plain English. Gemini 2.0 Flash reads your dataset and returns answers with supporting calculations and charts."
                accentColor="var(--accent-violet)"
                features={[
                  'Natural language queries',
                  'Streaming AI responses',
                  'Auto-generated charts',
                  'Follow-up questions',
                  'Query history',
                  'Export conversation',
                ]}
              />
            )}

            {/* REPORT VIEW */}
            {activeView === 'report' && (
              <PlaceholderView
                key="report"
                icon={<FileText className="w-12 h-12" />}
                title="AI Data Story"
                badge="Phase 3"
                description="Generate a beautiful, shareable narrative report. Gemini reads your data, writes the story, and bundles it with charts — ready to export as PDF."
                accentColor="var(--accent-amber)"
                features={[
                  'AI-written narrative',
                  'Embedded chart snapshots',
                  'Executive summary',
                  'Key findings section',
                  'Export as PDF',
                  'Share via link',
                ]}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── AI Insights Panel (right, slides in/out) ── */}
      <AIPanel
        isOpen={isAIPanelOpen}
        width={rightPanelWidth}
        isMobile={isMobile}
        onToggle={() => togglePanel('aiPanel')}
      />
    </div>
  );
}
