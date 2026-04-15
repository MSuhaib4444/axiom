'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Column } from '@/types/data';
import { getColumnTypeIcon } from '@/lib/formatters';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, MoreVertical, BarChart2, Activity, MessageSquare } from 'lucide-react';

export interface ColumnHeaderProps {
  column: Column;
  isSelected?: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onSort?: (direction: 'asc' | 'desc' | null) => void;
  sortDirection?: 'asc' | 'desc' | null;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  column,
  isSelected = false,
  onSelect,
  onSort,
  sortDirection = null,
}) => {
  const { setActiveView } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const headerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  };

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);
    if (menuOpen) {
      window.addEventListener('click', closeMenu);
    }
    return () => window.removeEventListener('click', closeMenu);
  }, [menuOpen]);

  const handleAction = (action: string) => {
    switch (action) {
      case 'sort-asc':
        onSort?.('asc');
        break;
      case 'sort-desc':
        onSort?.('desc');
        break;
      case 'profile':
        setActiveView('analysis');
        break;
      case 'chart':
        setActiveView('charts');
        break;
      case 'ai':
        setActiveView('ai');
        break;
    }
    setMenuOpen(false);
  };

  return (
    <>
      <div
        ref={headerRef}
        onClick={onSelect}
        onContextMenu={handleContextMenu}
        className={cn(
          "w-full h-full flex flex-col justify-center px-3 py-1 cursor-pointer transition-colors select-none group border-r border-[var(--glass-border)]",
          isSelected 
            ? "bg-[rgba(108,99,255,0.15)] shadow-[inset_0_-2px_0_0_var(--accent-violet)]" 
            : "hover:bg-white/5"
        )}
      >
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className="text-[10px] w-4 text-center opacity-60 font-mono shrink-0 hidden md:inline-block">
              {getColumnTypeIcon(column.type)}
            </span>
            <span className={cn(
              "text-xs font-semibold truncate",
              isSelected ? "text-white" : "text-[var(--text-secondary)]"
            )}>
              {column.name}
            </span>
            {column.nullCount > 0 && (
              <div 
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)] shrink-0" 
                title={`${column.nullCount} nulls`}
              />
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {sortDirection === 'asc' && <ArrowUp className="w-3 h-3 text-[var(--accent-violet)] opacity-100" />}
            {sortDirection === 'desc' && <ArrowDown className="w-3 h-3 text-[var(--accent-violet)] opacity-100" />}
            {!sortDirection && <ArrowDown className="w-3 h-3 text-[var(--text-tertiary)]" />}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div 
          className="fixed z-50 glass-heavy rounded-md shadow-xl py-1 w-48 border border-[var(--glass-border)]"
          style={{ 
            top: Math.min(menuPosition.y, window.innerHeight - 200), 
            left: Math.min(menuPosition.x, window.innerWidth - 200) 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--accent-violet)] hover:text-white transition-colors flex items-center gap-2"
            onClick={() => handleAction('sort-asc')}
          >
            <ArrowUp className="w-3 h-3" /> Sort Ascending
          </button>
          <button 
            className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--accent-violet)] hover:text-white transition-colors flex items-center gap-2 border-b border-[var(--glass-border)]"
            onClick={() => handleAction('sort-desc')}
          >
            <ArrowDown className="w-3 h-3" /> Sort Descending
          </button>

          <button 
            className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-white/10 transition-colors flex items-center gap-2 mt-1"
            onClick={() => handleAction('profile')}
          >
            <Activity className="w-3 h-3 text-[var(--accent-cyan)]" /> Profile Column
          </button>
          <button 
            className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-white/10 transition-colors flex items-center gap-2"
            onClick={() => handleAction('chart')}
          >
            <BarChart2 className="w-3 h-3 text-[var(--accent-amber)]" /> Chart from Column
          </button>
          <button 
            className="w-full text-left px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-white/10 transition-colors flex items-center gap-2"
            onClick={() => handleAction('ai')}
          >
            <MessageSquare className="w-3 h-3 text-[var(--accent-green)]" /> Ask AI
          </button>
        </div>
      )}
    </>
  );
};
