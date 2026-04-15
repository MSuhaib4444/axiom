'use client';

import React from 'react';
import { useDataStore } from '@/store/dataStore';
import { Download, Search } from 'lucide-react';
import { GlassButton } from '../ui/GlassButton';
import * as XLSX from 'xlsx';

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

  const handleExportCSV = () => {
    if (!activeData) return;
    try {
      // Create a temporary workbook to use XLSX's CSV export
      const ws = XLSX.utils.json_to_sheet(activeData.rows);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${activeData.name}_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to export CSV', e);
    }
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
      <div className="flex items-center">
        <GlassButton 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs px-3 py-0"
          onClick={handleExportCSV}
          disabled={!activeData || filteredCount === 0}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export CSV</span>
        </GlassButton>
      </div>
    </div>
  );
};
