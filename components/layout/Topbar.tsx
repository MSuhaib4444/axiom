'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUIStore, ViewType } from '@/store/uiStore';
import { useDataStore } from '@/store/dataStore';
import { useRouter, usePathname } from 'next/navigation';
import { GlassTabs, GlassTabOption } from '../ui/GlassTabs';
import { GlassSelect } from '../ui/GlassSelect';
import { GlassButton } from '../ui/GlassButton';
import { LayoutGrid, BarChart2, Activity, MessageSquare, FileText, Command, Upload, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileUpload } from '@/hooks/useFileUpload';
import { ThemeToggle } from '../ui/ThemeToggle';

export const Topbar: React.FC = () => {
  const { activeView, setActiveView, isMobile, openModal, toggleCommandPalette } = useUIStore();
  const { file } = useDataStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleFile } = useFileUpload();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await handleFile(selectedFile);
    }
  };

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
          ? "bg-[var(--bg-space)]/95 backdrop-blur-xl border-b border-[var(--glass-border)] shadow-[0_4px_30px_rgba(0,0,0,0.3)] supports-[backdrop-filter]:bg-[var(--bg-space)]/80" 
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
          <div className="hidden sm:flex items-center px-2 py-1 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)]">
            <span className="text-xs font-medium text-[var(--text-secondary)] truncate max-w-[150px]" title={file.name}>
              {file.name}
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center px-2 py-1 rounded-md bg-[var(--glass-bg)] border border-[var(--glass-border)] opacity-50">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              No file loaded
            </span>
          </div>
        )}
      </div>

      {/* Center Section: Navigation */}
      <div className="flex-1 flex justify-center max-w-lg">
        {file && (
          isMobile ? (
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
          )
        )}
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center justify-end gap-2 min-w-[200px]">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".xlsx,.xls,.csv,.tsv,.ods,.xlsm"
        />

        {!file && (
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleUploadClick}
            className="hidden sm:flex"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </GlassButton>
        )}

        <GlassButton
          variant="ghost"
          size="sm"
          onClick={toggleCommandPalette}
          className="hidden md:flex items-center gap-2 text-[var(--text-secondary)] hover:text-white"
          title="Command Palette (⌘K)"
        >
          <span className="text-xs border border-[var(--glass-border-strong)] rounded px-1.5 py-0.5 opacity-70">⌘ K</span>
        </GlassButton>

        <GlassButton
          variant="ghost"
          size="sm"
          className="text-[var(--text-secondary)] hover:text-[var(--accent-amber)] transition-colors"
          title="Star on GitHub"
          onClick={() => window.open('https://github.com/msuhaib4444/axiom', '_blank')}
        >
          <Star className="w-4 h-4" />
        </GlassButton>

        <ThemeToggle />
      </div>
    </header>
  );
};
