'use client';

import React, { useState, useEffect } from 'react';
import { useUIStore, ViewType } from '@/store/uiStore';
import { useDataStore } from '@/store/dataStore';
import { useRouter, usePathname } from 'next/navigation';
import { GlassTabs, GlassTabOption } from '../ui/GlassTabs';
import { GlassSelect } from '../ui/GlassSelect';
import { GlassButton } from '../ui/GlassButton';
import { LayoutGrid, BarChart2, Activity, MessageSquare, FileText, Command, Upload, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Topbar: React.FC = () => {
  const { activeView, setActiveView, isMobile, openModal, toggleCommandPalette } = useUIStore();
  const { file } = useDataStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    
    // Logic to determine if we need to switch pages
    const isWorkspaceView = ['grid', 'charts', 'ai', 'report'].includes(view);
    const isAnalysisView = view === 'analysis';
    
    if (isWorkspaceView && pathname !== '/workspace') {
      router.push('/workspace');
    } else if (isAnalysisView && pathname !== '/analyze') {
      router.push('/analyze');
    } else if (window.location.hash) {
      // If we are already on the correct page but have a hash, 
      // cleared it to prevent "stuck" navigation as described by user
      router.push(pathname);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const viewOptions: GlassTabOption[] = [
    { value: 'grid', label: 'Grid', icon: <LayoutGrid className="w-4 h-4" /> },
    { value: 'charts', label: 'Charts', icon: <BarChart2 className="w-4 h-4" /> },
    { value: 'analysis', label: 'Analysis', icon: <Activity className="w-4 h-4" /> },
    { value: 'ai', label: 'Ask AI', icon: <MessageSquare className="w-4 h-4" /> },
    { value: 'report', label: 'Report', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-4 transition-all duration-300",
        isScrolled 
          ? "bg-[#04040f]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] supports-[backdrop-filter]:bg-[#04040f]/80" 
          : "bg-transparent border-b border-transparent"
      )}
    >
      {/* Left Section: Logo & File Info */}
      <div className="flex items-center gap-4 min-w-[200px]">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-cyan)]">
            AXIOM
          </span>
        </div>
        {file ? (
          <div className="hidden sm:flex items-center px-2 py-1 rounded-md bg-white/5 border border-white/10">
            <span className="text-xs font-medium text-[var(--text-secondary)] truncate max-w-[150px]" title={file.name}>
              {file.name}
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center px-2 py-1 rounded-md bg-white/5 border border-white/10 opacity-50">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              No file loaded
            </span>
          </div>
        )}
      </div>

      {/* Center Section: Navigation */}
      <div className="flex-1 flex justify-center max-w-lg">
        {isMobile ? (
          <div className="w-40">
            <GlassSelect
              value={activeView}
              onValueChange={(val) => handleViewChange(val as ViewType)}
              options={viewOptions.map(opt => ({ value: opt.value, label: opt.label }))}
            />
          </div>
        ) : (
          <GlassTabs
            tabs={viewOptions}
            value={activeView}
            onValueChange={(val) => handleViewChange(val as ViewType)}
            className="w-auto"
            listClassName="border-none space-x-1"
          />
        )}
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center justify-end gap-2 min-w-[200px]">
        <GlassButton
          variant="primary"
          size="sm"
          onClick={() => openModal('upload')}
          className="hidden sm:flex"
        >
          <Upload className="w-4 h-4" />
          <span>Upload</span>
        </GlassButton>

        <GlassButton
          variant="ghost"
          size="sm"
          onClick={toggleCommandPalette}
          className="hidden md:flex items-center gap-2 text-[var(--text-secondary)] hover:text-white"
          title="Command Palette (⌘K)"
        >
          <span className="text-xs border border-white/20 rounded px-1.5 py-0.5 opacity-60">⌘ K</span>
        </GlassButton>

        <GlassButton
          variant="ghost"
          size="sm"
          className="text-[var(--text-secondary)] hover:text-[var(--accent-amber)] transition-colors"
          title="Star on GitHub"
          onClick={() => window.open('https://github.com', '_blank')}
        >
          <Star className="w-4 h-4" />
        </GlassButton>
      </div>
    </header>
  );
};
