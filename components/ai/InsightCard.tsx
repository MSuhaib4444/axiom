'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIInsight } from '@/store/aiStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface InsightCardProps {
  insight: AIInsight;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
  }
};

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldCollapse = insight.description.length > 100;
  
  const getSeverityVariant = (severity: AIInsight['severity']) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'warning': return 'amber';
      case 'info': return 'cyan';
      default: return 'gray';
    }
  };

  const severityVariant = getSeverityVariant(insight.severity);

  return (
    <motion.div
      variants={itemVariants as any}
      initial="hidden"
      animate="visible"
      layout
    >
      <GlassCard 
        padding="md" 
        className={cn(
          "group transition-all duration-300 hover:border-white/20",
          isExpanded && "border-white/20 shadow-lg"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Severity Dot */}
          <div className={cn(
            "w-2 h-2 rounded-full mt-1.5 shrink-0",
            insight.severity === 'critical' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
            insight.severity === 'warning' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
            "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
          )} />

          <div className="flex-1 space-y-2 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GlassBadge variant={severityVariant} size="sm">
                  {insight.type.toUpperCase()}
                </GlassBadge>
                <h4 className="font-medium text-slate-200 text-sm truncate">{insight.title}</h4>
              </div>
              
              {shouldCollapse && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 rounded-md hover:bg-white/5 transition-colors text-slate-500 hover:text-slate-300"
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>

            <p className={cn(
              "text-xs leading-relaxed text-slate-400 transition-all duration-300",
              !isExpanded && shouldCollapse && "line-clamp-2"
            )}>
              {insight.description}
            </p>

            {/* Affected Columns */}
            {insight.affectedColumns && insight.affectedColumns.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {insight.affectedColumns.map((col) => (
                  <span 
                    key={col} 
                    className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-slate-500"
                  >
                    {col}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};
