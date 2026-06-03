'use client';

import React from 'react';
import { useAIStore } from '@/store/aiStore';
import { GlassButton } from '@/components/ui/GlassButton';
import { Sparkles } from 'lucide-react';
import { useDataStore } from '@/store/dataStore';

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

const DEFAULT_PROMPTS = [
  "What are the key trends in this dataset?",
  "Which columns have the most missing values?",
  "What's the correlation between [first numeric col] and [second numeric col]?",
  "Are there any outliers I should know about?",
  "Give me a summary of this data in 3 bullet points"
];

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onSelect }) => {
  const { suggestedPrompts } = useAIStore();
  const { getActiveSheetData } = useDataStore();
  const data = getActiveSheetData();

  // dynamic substitution for defaults if data is present
  const prompts = suggestedPrompts.length > 0 ? suggestedPrompts : DEFAULT_PROMPTS.map(p => {
    if (p.includes('[first numeric col]') && data) {
      const numCols = data.columns.filter(c => c.type === 'number');
      const col1 = numCols[0];
      const col2 = numCols[1];
      if (col1 && col2) {
         return `What's the correlation between ${col1.name} and ${col2.name}?`;
      }
    }
    return p;
  });

  return (
    <div className="flex flex-col gap-2 w-full">
      <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider pl-2 mb-1">
        Suggested Questions
      </h4>
      <div className="flex flex-col gap-1.5">
        {prompts.map((prompt, idx) => (
          <GlassButton
            key={idx}
            variant="ghost"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--accent-cyan)] flex-shrink-0" />}
            className="justify-start text-left h-auto py-2.5 px-3 w-full group hover:bg-white/5 border border-transparent hover:border-white/10"
            onClick={() => onSelect(prompt)}
          >
            <span className="truncate text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors inline-block w-full text-left max-w-[calc(100%-20px)] whitespace-nowrap overflow-hidden text-ellipsis">
              {prompt}
            </span>
          </GlassButton>
        ))}
      </div>
    </div>
  );
};
