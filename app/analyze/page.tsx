'use client';

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
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useGeminiStream } from '@/hooks/useGeminiStream';
import { toast } from 'react-hot-toast';
import { Wand2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AnalyzePage() {
    const router = useRouter();
    const { file, getActiveSheetData } = useDataStore();
    const sheet = getActiveSheetData();

    useEffect(() => {
        if (!file) {
            router.replace('/');
        }
    }, [file, router]);

    const [activeSection, setActiveSection] = useState('statistics');
    const [selectedColumn, setSelectedColumn] = useState('');
    const [aiResult, setAiResult] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const { stream } = useGeminiStream({
        endpoint: '/api/gemini/analyze',
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

    if (!file) return null;

    const navItems = [
        { id: 'statistics', label: 'Statistics' },
        { id: 'profiler', label: 'Column Profiler' },
        { id: 'correlation', label: 'Correlation' },
        { id: 'anomalies', label: 'Anomalies' }
    ];

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-space)] overflow-hidden relative">
            <Topbar />
            <Sidebar />
            <CommandPalette />
            
            <main className="absolute inset-0 flex flex-col transition-all duration-300" style={{ top: 56, left: 240, bottom: 0 }}>
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
                        
                    </div>
                </div>
            </main>
        </div>
    );
}
