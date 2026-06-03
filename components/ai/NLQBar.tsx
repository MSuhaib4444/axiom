'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Sparkles, SendHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

export const NLQBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    router.push(`/ask?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20"
    >
      <GlassCard className="p-2 flex items-center shadow-2xl border-white/20 bg-black/40 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-violet)]/20 flex items-center justify-center ml-1">
            <Sparkles className="w-4 h-4 text-[var(--accent-violet)]" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your data..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-[var(--text-tertiary)] text-sm px-2 w-full"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="p-2 flex items-center justify-center rounded-lg bg-[var(--accent-violet)] text-white hover:bg-[#7b74ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SendHorizontal className="w-4 h-4" />
          </button>
        </form>
      </GlassCard>
    </motion.div>
  );
};
