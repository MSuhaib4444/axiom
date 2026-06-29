'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDataStore } from '@/store/dataStore';
import { StatSummaryPanel } from '@/components/analysis/StatSummaryPanel';
import { ColumnProfiler } from '@/components/analysis/ColumnProfiler';
import { CorrelationMatrix } from '@/components/analysis/CorrelationMatrix';
import { AnomalyDetector } from '@/components/analysis/AnomalyDetector';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { useUIStore } from '@/store/uiStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useOpenRouterStream } from '@/hooks/useOpenRouterStream';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { toast } from 'react-hot-toast';
import { 
  Wand2, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  BarChart2, 
  LineChart, 
  AreaChart as AreaChartIcon, 
  PieChart as PieChartIcon, 
  ScatterChart as ScatterChartIcon, 
  LayoutGrid, 
  Grid3X3, 
  GitMerge, 
  Radar, 
  BoxSelect, 
  Activity 
} from 'lucide-react';
import { OpenRouterAnalysis } from '@/types/openrouter';
import { motion } from 'framer-motion';

const ClusteringView = dynamic(
  () => import('@/components/analysis/ClusteringView').then((m) => m.ClusteringView),
  { loading: () => <div className="skeleton h-96 w-full rounded-2xl" />, ssr: false }
);

const RegressionView = dynamic(
  () => import('@/components/analysis/RegressionView').then((m) => m.RegressionView),
  { loading: () => <div className="skeleton h-96 w-full rounded-2xl" />, ssr: false }
);
const CHART_ICON_MAP: Record<string, React.ReactNode> = {
  bar: <BarChart2 size={16} />,
  line: <LineChart size={16} />,
  area: <AreaChartIcon size={16} />,
  pie: <PieChartIcon size={16} />,
  scatter: <ScatterChartIcon size={16} />,
  heatmap: <Grid3X3 size={16} />,
  treemap: <LayoutGrid size={16} />,
  sankey: <GitMerge size={16} />,
  radar: <Radar size={16} />,
  boxplot: <BoxSelect size={16} />,
  waterfall: <Activity size={16} />,
};

export default function AnalyzePage() {
    const router = useRouter();
    const { file, getActiveSheetData, isRestoring } = useDataStore();
    const sheet = getActiveSheetData();
    const { sidebarCollapsed, isMobile, setIsMobile, setActiveView } = useUIStore();

    const [activeSection, setActiveSection] = useState('statistics');
    const [selectedColumn, setSelectedColumn] = useState('');
    const [aiResult, setAiResult] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const parsedAnalysis = React.useMemo(() => {
        if (!aiResult) return null;
        try {
            const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as OpenRouterAnalysis;
            }
            return JSON.parse(aiResult) as OpenRouterAnalysis;
        } catch (e) {
            console.error('Failed to parse AI Analysis JSON:', e);
            return null;
        }
    }, [aiResult]);

    useEffect(() => {
        setActiveView('analysis');
    }, [setActiveView]);

    // Responsive: detect mobile breakpoint
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        const mediaQuery = window.matchMedia('(max-width: 767px)');
        mediaQuery.addEventListener('change', (e) => setIsMobile(e.matches));
        return () => mediaQuery.removeEventListener('change', (e) => setIsMobile(e.matches));
    }, [setIsMobile]);

    useEffect(() => {
        if (!isRestoring && !file) {
            router.replace('/');
        }
    }, [file, isRestoring, router]);

    // Register keyboard shortcuts
    useKeyboardShortcuts();

    // Scroll-Spy Implementation
    useEffect(() => {
        const container = document.getElementById('analyze-container');
        if (!container) return;

        const observerOptions = {
            root: container,
            rootMargin: '-10% 0px -80% 0px', // Triggers when section enters top 10%-20% of viewport
            threshold: 0,
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        
        const sections = ['statistics', 'profiler', 'correlation', 'anomalies', 'clustering', 'regression'];
        sections.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [sheet]); // Re-observe if sheet changes/data renders

    const { stream } = useOpenRouterStream({
        endpoint: '/api/openrouter/analyze',
        onComplete: (res: string) => {
            setIsAiLoading(false);
            setAiResult(res);
            toast.success('AI analysis complete');
        },
        onError: (err: string) => {
            setIsAiLoading(false);
            toast.error(err);
        }
    });

    const handleRunAI = () => {
        if (!sheet) return;
        setIsAiLoading(true);
        setAiResult(null);
        stream({ sheet });
    };

    if (isRestoring || !file) {
        return (
            <div className="h-screen bg-[var(--bg-space)] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)]" />
                <span className="text-sm text-[var(--text-secondary)] font-medium">Restoring session...</span>
            </div>
        );
    }

    const navItems = [
        { id: 'statistics', label: 'Statistics' },
        { id: 'profiler', label: 'Column Profiler' },
        { id: 'correlation', label: 'Correlation' },
        { id: 'anomalies', label: 'Anomalies' },
        { id: 'clustering', label: 'Clustering' },
        { id: 'regression', label: 'Regression' },
    ];

    const sidebarW = isMobile ? 0 : sidebarCollapsed ? 48 : 240;

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-space)] overflow-hidden relative">
            <Topbar />
            <Sidebar />
            <CommandPalette />
            
            <main className="absolute inset-0 flex flex-col transition-all duration-300" style={{ top: 56, left: sidebarW, bottom: 0 }}>
                <div className="flex-1 overflow-y-auto scroll-smooth p-8 pb-32" id="analyze-container">
                    <div className="max-w-6xl mx-auto space-y-16">
                        {/* Section Navigation Tabs */}
                        <div className="sticky top-0 z-50 glass px-2 py-2 rounded-2xl flex items-center gap-1 border border-[var(--glass-border)] mx-auto max-w-fit mb-8 shadow-2xl backdrop-blur-xl bg-black/40">
                             {navItems.map(item => (
                                 <a
                                    key={item.id}
                                    href={`#${item.id}`}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        activeSection === item.id 
                                        ? 'bg-[var(--accent-violet)] text-white shadow-lg shadow-violet-500/25' 
                                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                                    }`}
                                 >
                                    {item.label}
                                 </a>
                             ))}
                        </div>

                        {/* Section 1: Descriptive Statistics */}
                        <section id="statistics" className="scroll-mt-32 space-y-8">
                            <div className="flex items-center justify-between">
                                <h1 className="text-3xl font-display font-bold text-white tracking-tight">Descriptive Statistics</h1>
                                <GlassButton 
                                    onClick={handleRunAI} 
                                    disabled={isAiLoading}
                                    variant="primary"
                                >
                                    {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                                    Run AI Analysis
                                </GlassButton>
                            </div>
                            
                            {/* AI Result Card */}
                            {(isAiLoading || aiResult) && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                    <GlassCard className="border-[var(--accent-violet)]/30 glow-violet">
                                        <h3 className="text-lg font-semibold text-[var(--accent-violet)] mb-4 flex items-center gap-2">
                                            <Wand2 className="w-5 h-5" /> AI Data Analysis
                                        </h3>
                                        {isAiLoading ? (
                                            <div className="flex items-center gap-3 text-slate-300">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                                                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                                                    <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                                                </div>
                                                <span className="text-sm">Analyzing numerical distributions and detecting patterns...</span>
                                            </div>
                                        ) : parsedAnalysis ? (
                                            <div className="space-y-6 mt-4">
                                                {/* Top Row: Score & Summary */}
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                    <div className="md:col-span-1 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.03] border border-white/5 text-center shadow-inner">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quality Score</span>
                                                        <div className={`text-4xl md:text-5xl font-display font-extrabold tracking-tight drop-shadow-lg ${
                                                            parsedAnalysis.overallQualityScore >= 80 
                                                                ? 'text-emerald-400' 
                                                                : parsedAnalysis.overallQualityScore >= 50 
                                                                    ? 'text-amber-400' 
                                                                    : 'text-rose-400'
                                                        }`}>
                                                            {parsedAnalysis.overallQualityScore}/100
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-3 space-y-2 flex flex-col justify-center text-left">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Executive Summary</span>
                                                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                                            {parsedAnalysis.summary}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="divider" />

                                                {/* Key Insights & Next Steps */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-3 text-left">
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-violet)]" /> Key Insights
                                                        </h4>
                                                        <ul className="space-y-2.5">
                                                            {parsedAnalysis.keyInsights?.map((insight, idx) => (
                                                                <li key={idx} className="flex gap-2.5 items-start text-sm text-slate-300">
                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                                                    <span className="leading-relaxed">{insight}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="space-y-3 text-left">
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Wand2 className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> Suggested Next Steps
                                                        </h4>
                                                        <ul className="space-y-2.5">
                                                            {parsedAnalysis.suggestedNextSteps?.map((step, idx) => (
                                                                <li key={idx} className="flex gap-2.5 items-start text-sm text-slate-300">
                                                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--accent-cyan)]/15 border border-[var(--accent-cyan)]/25 text-[var(--accent-cyan)] flex items-center justify-center text-[10px] font-mono font-bold mt-0.5">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <span className="leading-relaxed">{step}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>

                                                <div className="divider" />

                                                {/* Data Quality Issues */}
                                                <div className="space-y-3 text-left">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Data Quality Assessment
                                                    </h4>
                                                    {!parsedAnalysis.dataQualityIssues || parsedAnalysis.dataQualityIssues.length === 0 ? (
                                                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2">
                                                            <CheckCircle2 className="w-4 h-4" /> All columns processed successfully! No critical data quality issues found.
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {parsedAnalysis.dataQualityIssues.map((issue, idx) => {
                                                                const isHigh = issue.severity === 'high';
                                                                const isMedium = issue.severity === 'medium';
                                                                return (
                                                                    <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-xs font-mono font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white truncate max-w-[150px]">
                                                                                {issue.column}
                                                                            </span>
                                                                            <span className={`badge text-[9px] px-2 py-0.5 ${
                                                                                isHigh 
                                                                                    ? 'badge-red' 
                                                                                    : isMedium 
                                                                                        ? 'badge-amber' 
                                                                                        : 'badge-gray'
                                                                            }`}>
                                                                                {issue.severity}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-slate-300 leading-normal">{issue.issue}</p>
                                                                        <div className="text-[11px] text-slate-400 leading-normal border-t border-white/5 pt-2 flex items-start gap-1">
                                                                            <span className="font-semibold text-[var(--accent-cyan)] flex-shrink-0">Recommendation:</span>
                                                                            <span>{issue.suggestion}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="divider" />

                                                {/* Suggested Charts */}
                                                <div className="space-y-4 text-left">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <BarChart2 className="w-3.5 h-3.5 text-[var(--accent-cyan)]" /> Recommended Visualizations
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {parsedAnalysis.suggestedCharts?.map((chart, idx) => {
                                                            const icon = CHART_ICON_MAP[chart.type] ?? <BarChart2 size={16} />;
                                                            return (
                                                                <div key={idx} className="p-4 rounded-2xl bg-white/[0.015] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all flex flex-col justify-between gap-4">
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-8 h-8 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] flex items-center justify-center flex-shrink-0 border border-[var(--accent-cyan)]/20">
                                                                                {icon}
                                                                            </div>
                                                                            <span className="text-sm font-semibold text-white truncate">{chart.title}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                                                                            <span>{chart.xColumn}</span>
                                                                            <span>→</span>
                                                                            <span>{chart.yColumn}</span>
                                                                        </div>
                                                                        <p className="text-xs text-slate-400 leading-normal">{chart.reason}</p>
                                                                    </div>
                                                                    <GlassButton 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        className="w-full text-xs font-medium py-2 hover:bg-[var(--accent-cyan)]/10 hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/25"
                                                                        onClick={() => router.push(`/visualize?type=${chart.type}&x=${chart.xColumn}&y=${chart.yColumn}&title=${encodeURIComponent(chart.title)}`)}
                                                                    >
                                                                        Open in Studio <ArrowUpRight className="w-3.5 h-3.5 ml-1 inline" />
                                                                    </GlassButton>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                            </div>
                                        ) : (
                                            <div className="prose prose-invert prose-sm max-w-none text-slate-300 mt-2">
                                                {aiResult ? (
                                                    <pre className="whitespace-pre-wrap font-sans bg-black/30 p-5 rounded-xl border border-white/10 text-sm leading-relaxed">
                                                        {aiResult}
                                                    </pre>
                                                ) : null}
                                            </div>
                                        )}
                                    </GlassCard>
                                </motion.div>
                            )}

                            <StatSummaryPanel />
                        </section>

                        {/* Section 2: Column Profiler */}
                        <section id="profiler" className="scroll-mt-32 space-y-6 pt-12 border-t border-white/10">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-white mb-2">Column Profiler</h2>
                                <p className="text-slate-400 text-sm mb-6">Select a column to view detailed distribution metrics, histograms, and frequency analysis.</p>
                            </div>
                            <div className="w-72 mb-6">
                                <div className="relative">
                                    <select 
                                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl p-3 pl-4 pr-10 focus:ring-2 focus:ring-[var(--accent-violet)] focus:border-[var(--accent-violet)] outline-none transition-colors appearance-none cursor-pointer hover:bg-black/60"
                                    value={selectedColumn}
                                    onChange={(e) => setSelectedColumn(e.target.value)}
                                    >
                                        <option value="" disabled className="bg-[var(--bg-card)]">Select a column to profile...</option>
                                        {sheet?.columns.map(col => (
                                            <option key={col.key} value={col.key} className="bg-[var(--bg-card)] text-white p-2">
                                                {col.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </div>
                            {selectedColumn ? (
                                <ColumnProfiler columnKey={selectedColumn} />
                            ) : (
                                <GlassCard className="flex items-center justify-center h-48 border-dashed text-slate-500 bg-white/[0.02]">
                                    <div className="text-center">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                        </div>
                                        <p>Please select a column to view detailed profiling.</p>
                                    </div>
                                </GlassCard>
                            )}
                        </section>

                        {/* Section 3: Correlation Matrix */}
                        <section id="correlation" className="scroll-mt-32 space-y-6 pt-12 border-t border-white/10">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-white mb-2">Correlation Analysis</h2>
                                <p className="text-slate-400 text-sm mb-6">Discover linear relationships between numerical variables. Click any cell to view the scatter plot.</p>
                            </div>
                            <CorrelationMatrix />
                        </section>

                        {/* Section 4: Anomalies */}
                        <section id="anomalies" className="scroll-mt-32 space-y-6 pt-12 border-t border-white/10">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-white mb-2">Anomaly Detection</h2>
                                <p className="text-slate-400 text-sm mb-6">Identify data points that deviate significantly from standard distributions using statistical methods.</p>
                            </div>
                            <AnomalyDetector />
                        </section>

                        {/* Section 5: K-Means Clustering */}
                        <section id="clustering" className="scroll-mt-32 space-y-6 pt-12 border-t border-white/10">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-white mb-2">K-Means Clustering</h2>
                                <p className="text-slate-400 text-sm mb-6">
                                    Group similar data points into clusters. Use the elbow chart to pick an optimal k, then explore cluster assignments on a scatter plot.
                                </p>
                            </div>
                            <ClusteringView />
                        </section>

                        {/* Section 6: Regression Analysis */}
                        <section id="regression" className="scroll-mt-32 space-y-6 pt-12 border-t border-white/10">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-white mb-2">Regression Analysis</h2>
                                <p className="text-slate-400 text-sm mb-6">
                                    Fit linear or polynomial models to uncover relationships between variables, inspect residuals, and forecast future values.
                                </p>
                            </div>
                            <RegressionView />
                        </section>
                        
                    </div>
                </div>
            </main>
        </div>
    );
}
