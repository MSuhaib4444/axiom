'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { ChartPicker } from '@/components/charts/ChartPicker';
import { ChartCanvas } from '@/components/charts/ChartCanvas';
import { useChartExporter } from '@/components/charts/ChartExporter';
import { ChartConfig } from '@/types/charts';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataStore } from '@/store/dataStore';
import { useUIStore } from '@/store/uiStore';
import { useAIStore } from '@/store/aiStore';
import { useGeminiStream } from '@/hooks/useGeminiStream';
import { InsightCard } from '@/components/ai/InsightCard';
import { toast } from 'react-hot-toast';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { DataGrid } from '@/components/grid/DataGrid';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { StatSummaryPanel } from '@/components/analysis/StatSummaryPanel';
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
  RotateCcw,
  Loader2,
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

function AIPanel({ isOpen, width, isMobile, onToggle, onReAnalyze }: AIPanelProps & { onReAnalyze: () => void }) {
  const { insights, isThinking } = useAIStore();

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
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onReAnalyze}
                  disabled={isThinking}
                  className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 transition-colors disabled:opacity-50"
                  title="Re-analyze dataset"
                >
                  <RotateCcw className={cn("w-3.5 h-3.5", isThinking && "animate-spin")} />
                </button>
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Insights Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Thinking Indicator */}
              {isThinking && (
                <div className="flex items-center justify-center gap-1.5 py-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}

              {/* Insights List */}
              <AnimatePresence mode="popLayout">
                {insights.length > 0 ? (
                  <motion.div 
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {insights.map((insight) => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))}
                  </motion.div>
                ) : !isThinking ? (
                  <div className="space-y-4 opacity-50">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 w-full rounded-xl bg-white/5 animate-pulse border border-white/10" />
                    ))}
                    <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest pt-2">
                      Analyzing your data...
                    </p>
                  </div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Panel footer */}
            <div className="px-4 py-3 border-t border-[var(--glass-border)] flex-shrink-0">
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-violet)] animate-pulse" />
                Powered by Gemini 2.0 Flash — AXIOM Phase 2
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
  const { file, getActiveSheetData } = useDataStore();
  const { 
    addInsight, 
    clearInsights, 
    setIsThinking, 
    isThinking 
  } = useAIStore();
  
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

  const analyzedFileId = useRef<string | null>(null);

  const handleAnalysisComplete = useCallback((result: string) => {
    try {
      // Find JSON block if it's wrapped in markdown
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : result;
      const data = JSON.parse(jsonStr);
      
      clearInsights();
      
      // Add summary as a general insight
      if (data.summary) {
        addInsight({
          type: 'summary',
          title: 'Dataset Summary',
          description: data.summary,
          severity: 'info',
        });
      }

      // Add key insights
      data.keyInsights?.forEach((text: string) => {
        addInsight({
          type: 'trend',
          title: 'Key Insight',
          description: text,
          severity: 'info',
        });
      });

      // Add data quality issues
      data.dataQualityIssues?.forEach((issue: { column: string; issue: string; severity?: 'warning' | 'info' | 'critical' }) => {
        addInsight({
          type: 'anomaly',
          title: `Quality Issue: ${issue.column}`,
          description: issue.issue,
          severity: issue.severity || 'warning',
          affectedColumns: [issue.column],
        });
      });

      setIsThinking(false);
      const insightCount = (data.keyInsights?.length || 0) + (data.dataQualityIssues?.length || 0) + (data.summary ? 1 : 0);
      toast.success(`AI analysis complete — ${insightCount} insights found`);
    } catch (e) {
      console.error('Failed to parse AI analysis:', e);
      setIsThinking(false);
      toast.error('Failed to process AI insights');
    }
  }, [clearInsights, addInsight, setIsThinking]);

  const { stream, abort } = useGeminiStream({
    endpoint: '/api/gemini/analyze',
    onComplete: handleAnalysisComplete,
    onError: (err) => {
      setIsThinking(false);
      toast.error(err);
    }
  });

  const triggerAnalysis = useCallback(() => {
    const sheet = getActiveSheetData();
    if (!sheet || isThinking) return;

    setIsThinking(true);
    stream({ sheet });
  }, [getActiveSheetData, isThinking, setIsThinking, stream]);

  // Auto-trigger analysis when file changes
  useEffect(() => {
    if (file && analyzedFileId.current !== file.name) {
      analyzedFileId.current = file.name;
      triggerAnalysis();
    }
    
    return () => abort();
  }, [file, triggerAnalysis, abort]);

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
        width={aiPanelW}
        isMobile={isMobile}
        onToggle={() => togglePanel('aiPanel')}
        onReAnalyze={triggerAnalysis}
      />
    </div>
  );
}
