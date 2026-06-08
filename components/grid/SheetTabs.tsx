'use client';

import React from 'react';
import { useDataStore } from '@/store/dataStore';
import { cn } from '@/lib/utils';
import { TableProperties } from 'lucide-react';

export const SheetTabs: React.FC = () => {
  const { file, activeSheet, setActiveSheet } = useDataStore();

  if (!file || file.sheets.length === 0) return null;

  return (
    <div className="w-full h-10 border-b border-[var(--glass-border)] flex items-end px-2 overflow-x-auto no-scrollbar glass-heavy bg-[var(--bg-panel)]">
      <div className="flex space-x-1 shrink-0">
        {file.sheets.map((sheet) => {
          const isActive = activeSheet === sheet.name;
          return (
            <button
              key={sheet.name}
              onClick={() => setActiveSheet(sheet.name)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-t-lg transition-all border-t border-x border-transparent relative select-none",
                isActive
                  ? "text-[var(--accent-violet)] bg-white/5 border-t-[var(--glass-border)] border-x-[var(--glass-border)]"
                  : "text-[var(--text-secondary)] hover:text-white hover:bg-white/5"
              )}
            >
              <TableProperties className="w-3.5 h-3.5 opacity-60" />
              <span>{sheet.name}</span>
              <span className="px-1.5 py-0.5 rounded pl-2 text-[10px] opacity-60 bg-black/20">
                {sheet.rowCount.toLocaleString()}
              </span>
              
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent-violet)] shadow-[0_-2px_10px_var(--accent-violet-glow)] translate-y-px" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
