'use client';

import React from 'react';
import { useDataStore } from '@/store/dataStore';
import { formatBytes } from '@/lib/utils';

export const StatusBar: React.FC = () => {
  const { file, getActiveSheetData, selectedColumns } = useDataStore();
  
  const activeData = getActiveSheetData();

  if (!file) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 h-7 glass-heavy border-t border-[var(--glass-border)] z-40 flex items-center px-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]" />
          <span className="text-[10px] uppercase font-medium tracking-wider text-[var(--text-secondary)]">
            Ready — Upload a file to begin
          </span>
        </div>
      </footer>
    );
  }

  const rowCount = activeData?.rowCount ?? 0;
  const colCount = activeData?.columnCount ?? 0;
  const selectedCount = selectedColumns.length;

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-7 glass-heavy border-t border-[var(--glass-border)] z-40 flex items-center justify-between px-4 text-[11px] font-mono text-[var(--text-secondary)] select-none">
      
      {/* Left Section: Data Metrics */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center gap-1.5" title="Total Rows">
          <span>R:</span>
          <span className="text-[var(--text-primary)]">{rowCount.toLocaleString()}</span>
        </div>
        
        <div className="w-px h-3 bg-white/10" />
        
        <div className="flex items-center gap-1.5" title="Total Columns">
          <span>C:</span>
          <span className="text-[var(--text-primary)]">{colCount.toLocaleString()}</span>
        </div>

        {selectedCount > 0 && (
          <>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5 text-[var(--accent-violet)]" title="Selected Columns">
              <span>Sel:</span>
              <span className="font-semibold">{selectedCount}</span>
            </div>
          </>
        )}

        {file.size > 0 && (
          <>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5 opacity-60" title="File Size">
              <span>{formatBytes(file.size)}</span>
            </div>
          </>
        )}
      </div>
    </footer>
  );
};
