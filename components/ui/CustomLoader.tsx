'use client';

import React from 'react';
import { useDataStore } from '@/store/dataStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const CustomLoader: React.FC = () => {
  const { uploadStage, uploadProgress, uploadFileName } = useDataStore();

  const isVisible = ['reading', 'parsing', 'analyzing', 'done'].includes(uploadStage);

  if (!isVisible) return null;

  const getStageMessage = () => {
    switch (uploadStage) {
      case 'reading':
        return 'Reading raw file content...';
      case 'parsing':
        return 'Parsing spreadsheet rows and tables...';
      case 'analyzing':
        return 'Performing statistical inference & indexing...';
      case 'done':
        return 'Building workspace interface...';
      default:
        return 'Loading...';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/75 backdrop-blur-2xl"
      >
        {/* Animated Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-[var(--accent-violet)]/10 blur-[100px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-[var(--accent-cyan)]/10 blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

        {/* Loader Container Card */}
        <div className="relative glass-heavy border border-white/10 p-10 max-w-md w-full mx-4 flex flex-col items-center text-center shadow-2xl">
          {/* Orbital Spinner Animation */}
          <div className="relative w-28 h-28 flex items-center justify-center mb-8">
            {/* Outer Orbit (Violet Glow) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-[var(--accent-violet)]/40 shadow-[0_0_15px_var(--accent-violet-glow)]"
            />
            {/* Inner Orbit (Cyan Glow) */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="absolute inset-2 rounded-full border border-dotted border-[var(--accent-cyan)]/60 shadow-[0_0_10px_var(--accent-cyan-glow)]"
            />
            {/* Core Logo Pulse */}
            <motion.div
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-full bg-white/5 border border-white/15 flex items-center justify-center shadow-inner"
            >
              <span className="font-display font-black text-xs text-[var(--accent-cyan)] tracking-wider">AXIOM</span>
            </motion.div>
          </div>

          {/* Title / App Name */}
          <h2 className="text-2xl font-display font-bold text-white tracking-wide mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            AXIOM Data Engine
          </h2>

          {/* File Name */}
          {uploadFileName && (
            <p className="text-xs text-[var(--text-secondary)] font-mono bg-white/5 border border-white/5 px-2.5 py-1 rounded-md max-w-xs truncate mb-6">
              {uploadFileName}
            </p>
          )}

          {/* Stage Status Text */}
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] min-h-[24px] mb-6">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-cyan)]" />
            <span>{getStageMessage()}</span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--text-tertiary)] mb-2">
              <span>PROGRESS</span>
              <span className="text-[var(--accent-cyan)] font-bold">{uploadProgress}%</span>
            </div>
            {/* Track */}
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
              {/* Neon Progress Fill */}
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-cyan)] shadow-[0_0_10px_var(--accent-cyan-glow)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest mt-6">
          Initializing Analytics Shell
        </p>
      </motion.div>
    </AnimatePresence>
  );
};
