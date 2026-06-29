'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDataStore } from '@/store/dataStore';
import { useOpenRouterStream } from '@/hooks/useOpenRouterStream';
import { StoryView } from '@/components/ai/StoryView';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { 
  Briefcase, 
  Code, 
  Coffee, 
  Sparkles, 
  Loader2, 
  ArrowLeft, 
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const toneOptions = [
  {
    id: 'executive',
    label: 'Executive',
    icon: Briefcase,
    description: 'High-level summaries, key metrics, and strategic recommendations for leadership.',
  },
  {
    id: 'technical',
    label: 'Technical',
    icon: Code,
    description: 'Deep statistical analysis, profile metrics, anomaly details, and technical notes.',
  },
  {
    id: 'casual',
    label: 'Casual',
    icon: Coffee,
    description: 'A conversational, easy-to-read narrative translating complex data into plain English.',
  },
];

function ReportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { file, getActiveSheetData, isRestoring } = useDataStore();
  const activeSheetData = getActiveSheetData();

  // Retrieve initial tone from search query, fallback to executive
  const initialTone = (searchParams.get('tone') || 'executive') as 'executive' | 'technical' | 'casual';
  const [tone, setTone] = useState<'executive' | 'technical' | 'casual'>(initialTone);
  
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Redirect if no file is present
  useEffect(() => {
    if (!isRestoring && !file) {
      router.push('/');
    }
  }, [file, isRestoring, router]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const { stream, content, isStreaming, error } = useOpenRouterStream({
    endpoint: '/api/openrouter/story',
    onComplete: (result) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      const duration = (Date.now() - startTimeRef.current) / 1000;
      setGenerationTime(duration);
    },
    onError: (err) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      toast.error(err || 'Failed to generate story');
    },
  });

  const handleGenerate = () => {
    if (!activeSheetData) return;

    setGenerationTime(null);
    setTimer(0);
    setHasGenerated(true);
    startTimeRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      setTimer(Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1)));
    }, 100);

    stream({
      sheet: activeSheetData,
      tone: tone,
    });
  };

  if (isRestoring || !file) {
    return (
      <div className="h-screen bg-[var(--bg-space)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)]" />
        <span className="text-sm text-[var(--text-secondary)] font-medium">Restoring session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-space)] text-[var(--text-primary)] relative z-10">
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 pb-24">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => router.push('/workspace')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Workspace
            </GlassButton>
          </div>
          
          <div className="text-right sm:text-left flex flex-col items-end sm:items-start">
            <span className="text-xs text-[var(--text-tertiary)] font-mono">
              Active Dataset: {file.name}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-4xl font-extrabold bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-cyan)] bg-clip-text text-transparent">
            AI Data Story Studio
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Transform raw rows and columns into a structured, narrative report tailored to your audience.
          </p>
        </div>

        {/* Section A — Tone Selector */}
        <div className="space-y-3">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[var(--accent-violet)] rounded-full" />
            Report Tone
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {toneOptions.map((option) => {
              const isSelected = tone === option.id;
              const IconComponent = option.icon;
              return (
                <GlassCard
                  key={option.id}
                  glow={isSelected ? 'violet' : 'none'}
                  padding="lg"
                  className={cn(
                    "relative overflow-hidden text-left hover:border-white/20 transition-all duration-300 cursor-pointer select-none border border-white/5",
                    isSelected ? "border-[var(--accent-violet)] bg-white/[0.02]" : "bg-black/20"
                  )}
                  onClick={() => setTone(option.id as any)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={cn(
                        "p-2 rounded-xl transition-colors",
                        isSelected 
                          ? "bg-[var(--accent-violet)]/20 text-[#a8a3ff]" 
                          : "bg-white/5 text-[var(--text-secondary)]"
                      )}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="font-display font-semibold text-base text-white">
                      {option.label}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {option.description}
                  </p>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Section B — Generate Button + Status */}
        <div className="flex flex-col items-center justify-center py-6 px-4 glass bg-black/20 rounded-2xl border border-white/5 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <GlassButton
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              loading={isStreaming}
              className="shadow-[0_0_20px_var(--accent-violet-glow)] font-display font-semibold min-w-[200px]"
              leftIcon={!isStreaming && <Sparkles className="w-5 h-5" />}
            >
              {hasGenerated ? "Re-generate Report" : "Generate Report"}
            </GlassButton>

            {generationTime !== null && !isStreaming && (
              <div className="flex items-center gap-1.5 text-xs text-green-400 font-mono bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                <Clock className="w-3.5 h-3.5" />
                <span>Generated in {generationTime.toFixed(1)}s</span>
              </div>
            )}
          </div>

          {isStreaming && (
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                Elapsed: {timer.toFixed(1)}s
              </span>
              <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                Generating your data story...
              </p>
            </div>
          )}
        </div>

        {/* Section C — Report Output */}
        {hasGenerated && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[var(--accent-cyan)] rounded-full" />
              Report Output
            </h2>
            <StoryView markdown={content || error} isStreaming={isStreaming} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-[var(--bg-space)] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="text-sm text-[var(--text-secondary)]">Loading Studio...</span>
        </div>
      }
    >
      <ReportPageContent />
    </Suspense>
  );
}