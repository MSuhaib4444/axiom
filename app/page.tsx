'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Topbar } from '@/components/layout/Topbar';
import { DropZone } from '@/components/upload/DropZone';
import { FormatBadge } from '@/components/upload/FormatBadge';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useDataStore } from '@/store/dataStore';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  BrainCircuit, 
  BarChart2, 
  MessageCircle, 
  Activity, 
  Zap, 
  Download,
  Loader2
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function LandingPage() {
  const { handleFile, stage, progress, error, clearError } = useFileUpload();
  const { file, isRestoring } = useDataStore();
  const router = useRouter();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  useEffect(() => {
    if (!isRestoring && file) {
      router.replace('/workspace');
    }
  }, [file, isRestoring, router]);

  if (isRestoring || file) {
    return (
      <div className="h-screen bg-[var(--bg-space)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)]" />
        <span className="text-sm text-[var(--text-secondary)] font-medium">Loading Axiom...</span>
      </div>
    );
  }


  const handleDemoClick = async () => {
    setIsDemoLoading(true);
    try {
      const res = await fetch('/sample-data/sales-data.xlsx');
      if (!res.ok) throw new Error('Failed to fetch demo data');
      const blob = await res.blob();
      const file = new File([blob], 'sales-data.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      await handleFile(file);
    } catch (err) {
      toast.error('Failed to load demo data');
      console.error(err);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const features = [
    {
      icon: <BrainCircuit className="w-6 h-6 text-[var(--accent-violet)]" />,
      title: 'AI Analysis',
      desc: 'Instant insights powered by Gemini 2.0 Flash'
    },
    {
      icon: <BarChart2 className="w-6 h-6 text-[var(--accent-cyan)]" />,
      title: '15+ Chart Types',
      desc: 'Bar, line, scatter, heatmap, treemap, Sankey and more'
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-[var(--accent-amber)]" />,
      title: 'Natural Language Q&A',
      desc: 'Ask any question about your data in plain English'
    },
    {
      icon: <Activity className="w-6 h-6 text-[var(--accent-green)]" />,
      title: 'Statistical Depth',
      desc: 'Correlation, regression, clustering, anomaly detection'
    },
    {
      icon: <Zap className="w-6 h-6 text-[var(--accent-violet)]" />,
      title: 'Zero Sign-up',
      desc: 'No accounts. No limits. Just upload and explore.'
    },
    {
      icon: <Download className="w-6 h-6 text-[var(--accent-cyan)]" />,
      title: 'Export Everything',
      desc: 'PNG, PDF, SVG, and CSV export for all charts and reports'
    }
  ];

  const stats = [
    { number: '15+', label: 'Chart Types' },
    { number: '30+', label: 'Analysis Tools' },
    { number: '0', label: 'Sign-ups Required' },
    { number: '<3s', label: 'AI Response' }
  ];

  const formats = ['xlsx', 'xls', 'csv', 'tsv', 'ods', 'xlsm'];

  return (
    <div className="min-h-screen bg-[var(--bg-space)] text-[var(--text-primary)] font-body flex flex-col">
      <Topbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 flex flex-col items-center">
        
        {/* Hero Section */}
        <motion.section 
          className="w-full flex flex-col items-center justify-center text-center min-h-[calc(100vh-56px)] py-12"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.h1 
            variants={itemVariants as any}
            className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-cyan)]"
          >
            Upload. Analyze. Understand.
          </motion.h1>
          
          <motion.p 
            variants={itemVariants as any}
            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mb-12"
          >
            Drop your Excel or CSV file and let AI uncover the story inside your data — in seconds.
          </motion.p>
          
          <motion.div variants={itemVariants as any} className="w-full max-w-[600px] relative mb-8">
            <DropZone 
              onFileAccepted={handleFile} 
              stage={stage}
              progress={progress}
              error={error}
            />
            {stage !== 'idle' && (
              <UploadProgress stage={stage} progress={progress} />
            )}
          </motion.div>
          
          <motion.div variants={itemVariants as any} className="flex flex-wrap justify-center gap-2 mb-8">
            {formats.map(fmt => (
              <FormatBadge key={fmt} format={fmt} />
            ))}
          </motion.div>
          
          <motion.div variants={itemVariants as any}>
            <GlassButton 
              variant="ghost" 
              size="sm" 
              onClick={handleDemoClick}
              disabled={isDemoLoading || stage !== 'idle'}
            >
              {isDemoLoading ? 'Loading demo...' : 'Try with demo data'}
            </GlassButton>
          </motion.div>
        </motion.section>
        
        {/* Feature Grid */}
        <motion.section 
          className="w-full py-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div key={idx} variants={itemVariants as any} className="h-full">
                <GlassCard variant="default" glow="none" className="h-full flex flex-col items-start text-left hover:glow-violet transition-all duration-300">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-display font-medium mb-2">{feature.title}</h3>
                  <p className="text-[var(--text-secondary)]">{feature.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.section>
        
        {/* Stats Bar */}
        <motion.section 
          className="w-full py-12 mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <GlassCard variant="heavy" glow="violet" className="w-full rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
              {stats.map((stat, idx) => (
                <motion.div 
                  key={idx} 
                  variants={itemVariants as any}
                  className="flex flex-col items-center justify-center text-center px-4"
                >
                  <div className="text-4xl md:text-5xl font-display font-bold text-[var(--text-primary)] mb-2 drop-shadow-[0_0_15px_var(--accent-violet-glow)]">
                    {stat.number}
                  </div>
                  <div className="text-sm md:text-base text-[var(--text-secondary)] uppercase tracking-wider font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.section>

        {/* Supported Formats Section */}
        <motion.section 
          className="w-full flex flex-col items-center text-center pb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <motion.h3 variants={itemVariants as any} className="text-2xl font-display font-medium mb-8">
            Supported Formats
          </motion.h3>
          <motion.div variants={itemVariants as any} className="flex flex-wrap justify-center gap-3">   
            {formats.map(fmt => (
              <div key={fmt} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-mono text-[var(--text-secondary)]">
                .{fmt}
              </div>
            ))}
          </motion.div>
        </motion.section>

      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-4 text-center">
          <p className="font-display font-medium text-[var(--text-primary)]">
            AXIOM — Upload. Analyze. Understand.
          </p>
          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              GitHub
            </a>
            <span>•</span>
            <span>Built with Next.js + Gemini</span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
            &copy; {new Date().getFullYear()} AXIOM. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
