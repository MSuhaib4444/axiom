'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { File, CheckCircle, Database, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UploadStage = 'idle' | 'reading' | 'parsing' | 'analyzing' | 'done';

export interface UploadProgressProps {
  stage: UploadStage;
  progress: number;
  fileName?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ stage, progress, fileName }) => {
  if (stage === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 z-10 glass-heavy flex flex-col items-center justify-center p-6 rounded-[var(--glass-radius)] text-center font-body"
      >
        <div className="mb-6 relative">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative z-10 overflow-hidden">
            {stage === 'reading' && <File className="w-8 h-8 text-[var(--accent-cyan)] animate-pulse" />}
            {stage === 'parsing' && <Database className="w-8 h-8 text-[var(--accent-violet)] animate-bounce" />}
            {stage === 'analyzing' && <Search className="w-8 h-8 text-[var(--accent-amber)] animate-spin-slow" />}
            {stage === 'done' && <CheckCircle className="w-8 h-8 text-[var(--accent-green)]" />}
          </div>
          {stage !== 'done' && (
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent-violet)]"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            />
          )}
        </div>

        <h3 className="text-lg font-medium text-white mb-2">
          {stage === 'reading' && 'Reading file...'}
          {stage === 'parsing' && 'Parsing data...'}
          {stage === 'analyzing' && 'Detecting columns...'}
          {stage === 'done' && 'Ready!'}
        </h3>
        
        {fileName && (
          <p className="text-sm text-[var(--text-secondary)] mb-6 truncate max-w-[200px]" title={fileName}>
            {fileName}
          </p>
        )}

        <div className="w-full max-w-xs space-y-2">
          <div className="glass h-2 w-full rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 bottom-0 bg-[var(--accent-violet)] transition-all duration-300 ease-out box-shadow-[0_0_10px_var(--accent-violet-glow)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[var(--text-tertiary)] font-mono">
            <span>{progress}%</span>
            <span>Processing</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
