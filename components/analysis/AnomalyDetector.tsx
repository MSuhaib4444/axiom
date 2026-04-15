'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDataStore } from '@/store/dataStore';
import { detectOutliers } from '@/lib/stats';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { formatNumber } from '@/lib/utils';
import { OutlierResult } from '@/types/analysis';

export const AnomalyDetector: React.FC = () => {
    const { getActiveSheetData, highlightRows, clearHighlights, highlightedRows } = useDataStore();
    const sheet = getActiveSheetData();

    const [method, setMethod] = useState<'iqr' | 'zscore'>('iqr');
    
    const outliers = useMemo(() => {
        if (!sheet) return [];
        const numericColumns = sheet.columns.filter(col => col.type === 'number');
        const results: (OutlierResult & { columnKey: string, columnName: string })[] = [];
        
        numericColumns.forEach(col => {
            const values = sheet.rows.map(row => row[col.key]);
            const colOutliers = detectOutliers(values.filter((v): v is NonNullable<typeof v> => v !== undefined), method);
            
            colOutliers.forEach(outlier => {
                results.push({
                    ...outlier,
                    columnKey: col.key,
                    columnName: col.name
                });
            });
        });
        
        return results.sort((a,b) => Math.abs(b.zScore) - Math.abs(a.zScore));
    }, [sheet, method]);

    useEffect(() => {
        if (outliers.length > 0) {
            toast(`Found ${outliers.length} potential outliers`, { icon: '⚠️', id: 'outliers-toast' });
        }
    }, [outliers.length]);

    if (!sheet) return null;

    if (outliers.length === 0) {
        return (
             <GlassCard className="border-green-500/30 bg-green-500/5 glow-green">
                 <div className="flex flex-col items-center justify-center h-40 text-green-400">
                     <span className="text-xl mb-2">🎉 No outliers detected</span>
                     <span className="text-sm opacity-80">Your data looks clean based on the {method.toUpperCase()} method.</span>
                 </div>
                 <div className="flex justify-center mt-4">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setMethod('iqr')}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${method === 'iqr' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                            IQR Method
                        </button>
                        <button 
                            onClick={() => setMethod('zscore')}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${method === 'zscore' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                            Z-Score Method
                        </button>
                    </div>
                 </div>
             </GlassCard>
        );
    }

    const uniqueColumns = new Set(outliers.map(o => o.columnKey)).size;

    const handleHighlight = () => {
        const rowIndices = Array.from(new Set(outliers.map(o => o.rowIndex)));
        highlightRows(rowIndices);
    };

    const hasHighlights = highlightedRows.length > 0;

    return (
        <GlassCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                   <h3 className="text-lg font-semibold text-white">Anomaly Report</h3>
                   <p className="text-sm text-slate-400">
                       Found {outliers.length} potential outlier{outliers.length !== 1 ? 's' : ''} across {uniqueColumns} column{uniqueColumns !== 1 ? 's' : ''}.
                   </p>
                </div>
                
                <div className="flex gap-2 bg-black/20 p-1 rounded-full border border-white/10">
                    <button 
                        onClick={() => setMethod('iqr')}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${method === 'iqr' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                        IQR
                    </button>
                    <button 
                         onClick={() => setMethod('zscore')}
                         className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${method === 'zscore' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                        Z-Score
                    </button>
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                <GlassButton variant="primary" onClick={handleHighlight} className="text-xs">
                    Highlight in Grid
                </GlassButton>
                {hasHighlights && (
                    <GlassButton variant="ghost" onClick={clearHighlights} className="text-xs">
                        Clear Highlights
                    </GlassButton>
                )}
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-xl bg-black/20">
                <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                            <th className="p-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Row</th>
                            <th className="p-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Column</th>
                            <th className="p-3 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Value</th>
                            <th className="p-3 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Z-Score</th>
                            <th className="p-3 text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">Severity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {outliers.map((outlier, idx) => (
                            <tr key={`${outlier.rowIndex}-${outlier.columnKey}-${idx}`} className="hover:bg-white/5">
                                <td className="p-3 text-sm text-slate-300">{(outlier.rowIndex + 1).toString()}</td>
                                <td className="p-3 text-sm text-slate-300">{outlier.columnName}</td>
                                <td className="p-3 text-sm text-right text-slate-300 tabular-nums">{formatNumber(Number(outlier.value))}</td>
                                <td className="p-3 text-sm text-right text-slate-300 tabular-nums">{formatNumber(outlier.zScore, 2)}</td>
                                <td className="p-3 text-center">
                                    <GlassBadge variant={outlier.severity === 'high' ? 'red' : outlier.severity === 'medium' ? 'amber' : 'gray'}>
                                        {outlier.severity.toUpperCase()}
                                    </GlassBadge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    )
}
