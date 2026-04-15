'use client';

import React from 'react';
import { ParsedFile } from '@/types/data';
import { formatBytes } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';
import { useRouter } from 'next/navigation';
import { useDataStore } from '@/store/dataStore';
import { FileSpreadsheet, FileText, Calendar, Database, Layers, ArrowRight, X } from 'lucide-react';
import { GlassButton } from '../ui/GlassButton';

export interface FileCardProps {
  file: ParsedFile;
}

export const FileCard: React.FC<FileCardProps> = ({ file }) => {
  const router = useRouter();
  const { clearFile } = useDataStore();

  const isCsv = file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.tsv');
  const Icon = isCsv ? FileText : FileSpreadsheet;

  const totalRows = file.sheets.reduce((acc, sheet) => acc + sheet.rowCount, 0);
  const maxCols = Math.max(...file.sheets.map(s => s.columnCount), 0);

  return (
    <div className="glass-card glow-violet w-full max-w-md mx-auto relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 scale-[3] transform-gpu translate-x-4 -translate-y-4 pointer-events-none group-hover:opacity-20 transition-opacity">
        <Icon className="w-32 h-32 text-[var(--accent-violet)]" />
      </div>

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-violet-glow)] border border-[var(--accent-violet)]/30 flex items-center justify-center">
            <Icon className="w-6 h-6 text-[var(--accent-violet)]" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white truncate max-w-[200px]" title={file.name}>
              {file.name}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {formatBytes(file.size)} • {isCsv ? 'CSV Document' : 'Excel Workbook'}
            </p>
          </div>
        </div>
        <span className="badge badge-violet">
          {file.sheets.length} {file.sheets.length === 1 ? 'SHEET' : 'SHEETS'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        <div className="glass p-3 rounded-lg flex items-center gap-3">
          <Database className="w-4 h-4 text-[var(--accent-cyan)]" />
          <div>
            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Rows</p>
            <p className="text-sm font-mono text-[var(--text-primary)]">{totalRows.toLocaleString()}</p>
          </div>
        </div>
        <div className="glass p-3 rounded-lg flex items-center gap-3">
          <Layers className="w-4 h-4 text-[var(--accent-amber)]" />
          <div>
            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Columns</p>
            <p className="text-sm font-mono text-[var(--text-primary)]">{maxCols.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-6 relative z-10">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Parsed {formatDate(file.parsedAt, 'short')} at {new Date(file.parsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="flex flex-col gap-2 relative z-10">
        <GlassButton 
          variant="primary" 
          className="w-full justify-between group-hover:shadow-[0_8px_32px_var(--accent-violet-glow)]"
          onClick={() => router.push('/workspace')}
        >
          <span>Open in Workspace</span>
          <ArrowRight className="w-4 h-4 mr-1 group-hover:translate-x-1 transition-transform" />
        </GlassButton>
        <GlassButton 
          variant="ghost" 
          className="w-full text-[var(--text-secondary)] hover:text-white"
          onClick={() => clearFile()}
        >
          <X className="w-3 h-3 mr-1" />
          <span>Upload Different File</span>
        </GlassButton>
      </div>
    </div>
  );
};
