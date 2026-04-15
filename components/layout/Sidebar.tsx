'use client';

import React from 'react';
import { useUIStore } from '@/store/uiStore';
import { useDataStore } from '@/store/dataStore';
import { getColumnTypeIcon, getSeverityColor } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Upload as UploadIcon,
  TableProperties,
  ListFilter
} from 'lucide-react';
import { GlassButton } from '../ui/GlassButton';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed, isMobile } = useUIStore();
  const { file, activeSheet, setActiveSheet, selectedColumns, toggleColumnSelection, getActiveSheetData, stats } = useDataStore();
  
  const activeData = getActiveSheetData();

  if (!file) {
    return (
      <aside 
        className={cn(
          "fixed left-0 top-14 bottom-7 glass-heavy border-r border-[var(--glass-border)] z-40 transition-all duration-300 ease-in-out flex flex-col",
          sidebarCollapsed ? "w-0 sm:w-12 opacity-0 sm:opacity-100 overflow-hidden" : "w-60",
          !isMobile && !sidebarCollapsed ? "translate-x-0" : isMobile && sidebarCollapsed ? "-translate-x-full" : "translate-x-0"
        )}
      >
        {!sidebarCollapsed && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4 text-[var(--text-secondary)] opacity-60">
            <UploadIcon className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">Upload a file to begin</p>
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside 
      className={cn(
        "fixed left-0 top-14 bottom-7 glass-heavy border-r border-[var(--glass-border)] z-40 transition-all duration-300 ease-in-out flex flex-col",
        sidebarCollapsed ? "w-0 sm:w-12 overflow-hidden" : "w-60",
        isMobile && sidebarCollapsed ? "-translate-x-full" : "translate-x-0"
      )}
    >
      {/* Collapse Toggle */}
      <div className={cn(
        "flex items-center p-2 border-b border-[var(--glass-border)]",
        sidebarCollapsed ? "justify-center" : "justify-between"
      )}>
        {!sidebarCollapsed && (
          <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider ml-1">
            Side Bar
          </span>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1 rounded-md hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {!sidebarCollapsed && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col pb-4">
          
          {/* Sheets Section */}
          <div className="px-3 py-4 border-b border-[var(--glass-border)]">
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 flex items-center gap-2">
              <TableProperties className="w-3.5 h-3.5" />
              Sheets
            </h3>
            <ul className="space-y-1">
              {file.sheets.map(sheet => (
                <li key={sheet.name}>
                  <button
                    onClick={() => setActiveSheet(sheet.name)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors truncate",
                      activeSheet === sheet.name 
                        ? "bg-[var(--accent-violet-glow)] text-white font-medium border border-[var(--accent-violet)]" 
                        : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                    )}
                  >
                    {sheet.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Columns Section */}
          {activeData && (
            <div className="px-3 py-4 border-b border-[var(--glass-border)] flex-1">
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ListFilter className="w-3.5 h-3.5" />
                  Columns ({activeData.columns.length})
                </span>
              </h3>
              <ul className="space-y-1 overflow-y-auto max-h-[40vh] no-scrollbar pr-1">
                {activeData.columns.map(col => {
                  const isSelected = selectedColumns.includes(col.key);
                  const qualityColor = col.qualityScore > 80 ? 'bg-[var(--accent-green)]' 
                    : col.qualityScore >= 50 ? 'bg-[var(--accent-amber)]' 
                    : 'bg-[var(--accent-red)]';

                  return (
                    <li key={col.key}>
                      <button
                        onClick={() => toggleColumnSelection(col.key)}
                        className={cn(
                          "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-all group border-l-2",
                          isSelected 
                            ? "bg-white/10 text-white border-[var(--accent-violet)]" 
                            : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] border-transparent"
                        )}
                        title={`${col.name} (${col.type})`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-[10px] w-4 text-center opacity-60 font-mono">
                            {getColumnTypeIcon(col.type)}
                          </span>
                          <span className="truncate">{col.name}</span>
                        </div>
                        <div 
                          className={cn("w-2 h-2 rounded-full", qualityColor)} 
                          title={`Quality: ${col.qualityScore}%`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Quick Stats Section */}
          {stats && (
            <div className="px-3 py-4 mt-auto">
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                Dataset Overview
              </h3>
              <div className="space-y-2 text-xs text-[var(--text-secondary)] bg-white/5 rounded-lg p-3 border border-white/5">
                <div className="flex justify-between">
                  <span>Rows</span>
                  <span className="text-[var(--text-primary)] font-medium">{stats.totalRows.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Columns</span>
                  <span className="text-[var(--text-primary)] font-medium">{stats.totalColumns.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nulls</span>
                  <span className="text-[var(--text-primary)] font-medium">{stats.totalNulls.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-white/10">
                  <span>Quality</span>
                  <span className={cn(
                    "font-medium",
                    stats.qualityScore > 80 ? "text-[var(--accent-green)]" 
                      : stats.qualityScore >= 50 ? "text-[var(--accent-amber)]" 
                      : "text-[var(--accent-red)]"
                  )}>
                    {stats.qualityScore.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
