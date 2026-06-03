'use client';

import React from 'react';
import { useDataStore } from '@/store/dataStore';
import { Download, Search, FileSpreadsheet } from 'lucide-react';
import { GlassButton } from '../ui/GlassButton';
import { useExport } from '@/hooks/useExport';

export interface GridToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
}

export const GridToolbar: React.FC<GridToolbarProps> = ({ 
  searchTerm, 
  onSearchChange,
  filteredCount 
}) => {
  const { getActiveSheetData } = useDataStore();
  const activeData = getActiveSheetData();
  const { exportCSV, exportXLSX } = useExport();

  const handleExportCSV = () => {
    if (!activeData) return;
    exportCSV(activeData, `${activeData.name}_export.csv`);
  };

  const handleExportExcel = () => {
    if (!activeData) return;
    exportXLSX(activeData, `${activeData.name}_export.xlsx`);
  };

  const totalCount = activeData?.rowCount || 0;

  return (
    <div className="w-full h-12 border-b border-[var(--glass-border)] flex items-center justify-between px-3 glass bg-[rgba(20,20,48,0.4)]">
      {/* Left: Filter */}
      <div className="flex items-center w-64 relative">
        <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter rows..."
          className="input-glass !pl-9 !py-1.5 h-8 text-xs bg-black/20 focus:bg-black/40 border-transparent hover:border-white/10 w-full"
        />
      </div>

      {/* Center: Row counts */}
      <div className="flex items-center text-xs font-mono text-[var(--text-tertiary)]">
        {searchTerm ? (
          <span>Showing {filteredCount} of {totalCount} rows</span>
        ) : (
          <span>{totalCount} rows</span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <GlassButton 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs px-3 py-0 animate-fade-in"
          onClick={handleExportCSV}
          disabled={!activeData || filteredCount === 0}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export CSV</span>
        </GlassButton>
        <GlassButton 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs px-3 py-0 animate-fade-in"
          onClick={handleExportExcel}
          disabled={!activeData || filteredCount === 0}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" />
          <span className="hidden sm:inline">Export Excel</span>
        </GlassButton>
      </div>
    </div>
  );
};
