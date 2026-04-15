'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { FormatBadge } from './FormatBadge';
import { UploadProgress, UploadStage } from './UploadProgress';
import { FileRejection } from 'react-dropzone';
import { cn } from '@/lib/utils';

export interface DropZoneProps {
  onFileAccepted: (file: File) => void;
  className?: string;
  stage?: UploadStage;
  progress?: number;
  error?: string | null;
}

export const DropZone: React.FC<DropZoneProps> = ({ 
  onFileAccepted, 
  className,
  stage = 'idle',
  progress = 0,
  error = null
}) => {
  const [localError, setLocalError] = useState<string | null>(null);
  
  const displayError = error || localError;

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setLocalError(null);
    
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection && rejection.errors[0]?.code === 'file-too-large') {
        const maxSize = process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || '50';
        setLocalError(`File too large — maximum limit is ${maxSize}MB`);
      } else {
        setLocalError('Unsupported format — use .xlsx, .xls, .csv, .tsv, .ods only');
      }
      return;
    }

    if (acceptedFiles.length > 0 && acceptedFiles[0]) {
      onFileAccepted(acceptedFiles[0]);
    }
  }, [onFileAccepted]);

  const maxSizeMB = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || 50);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm'],
      'application/vnd.oasis.opendocument.spreadsheet': ['.ods'],
      'text/csv': ['.csv'],
      'text/tab-separated-values': ['.tsv']
    },
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
    disabled: stage !== 'idle'
  });

  return (
    <div className={cn("relative w-full", className)}>
      {/* @ts-expect-error missing strict types for framer-motion */}
      <motion.div
        {...getRootProps()}
        animate={{
          scale: isDragActive ? 1.02 : 1,
          borderColor: displayError 
            ? 'var(--accent-red)' 
            : isDragActive 
              ? 'var(--accent-violet)' 
              : 'var(--glass-border-strong)',
          backgroundColor: isDragActive ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.02)',
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          "glass-card border-2 border-dashed flex flex-col items-center justify-center p-12 text-center cursor-pointer overflow-hidden min-h-[320px]",
          stage !== 'idle' && "pointer-events-none",
          displayError && "glow-red box-shadow-[0_0_24px_var(--accent-red-glow)]"
        )}
      >
        <input {...getInputProps()} />

        <div className="relative z-0 flex flex-col items-center justify-center w-full">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-300",
            isDragActive ? "bg-[var(--accent-violet-glow)]" : "bg-white/5",
            displayError && "bg-[var(--accent-red-glow)]"
          )}>
            <UploadCloud className={cn(
              "w-8 h-8 transition-colors duration-300",
              isDragActive ? "text-[var(--accent-violet)]" : "text-[var(--text-secondary)]",
              displayError && "text-[var(--accent-red)]"
            )} />
          </div>

          <h3 className="tracking-wide text-lg font-medium text-[var(--text-primary)] mb-2">
            {isDragActive ? "Release to upload" : "Drop your Excel or CSV file here"}
          </h3>
          
          <p className="text-sm text-[var(--text-tertiary)] mb-8">
            or click to browse from your computer
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <FormatBadge format="xlsx" />
            <FormatBadge format="csv" />
            <FormatBadge format="tsv" />
            <FormatBadge format="ods" />
          </div>

          {displayError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-center gap-2 text-sm text-[var(--accent-red)] bg-[var(--accent-red-glow)] px-4 py-2 rounded-lg border border-[var(--accent-red)]/30"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{displayError}</span>
            </motion.div>
          )}
        </div>

        {stage !== 'idle' && (
          <UploadProgress stage={stage} progress={progress} />
        )}
      </motion.div>
    </div>
  );
};
