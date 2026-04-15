'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseFile, ParseError } from '@/lib/parser';
import { useDataStore } from '@/store/dataStore';
import { sleep } from '@/lib/utils';
import { UploadStage } from '@/components/upload/UploadProgress';
import { toast } from 'react-hot-toast';

export function useFileUpload() {
  const router = useRouter();
  const { setFile } = useDataStore();
  
  const [stage, setStage] = useState<UploadStage>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const handleFile = async (file: File) => {
    try {
      setError(null);
      setStage('reading');
      setProgress(20);
      
      // Artificial delay for UI feedback
      await sleep(300);
      
      setStage('parsing');
      setProgress(60);
      
      const result = await parseFile(file);
      
      setStage('analyzing');
      setProgress(90);
      
      // Simulate analysis phase 
      await sleep(400);
      
      setFile(result);
      
      setStage('done');
      setProgress(100);
      
      toast.success('Successfully parsed dataset');
      
      await sleep(500);
      router.push('/workspace');
    } catch (err) {
      setStage('idle');
      setProgress(0);
      
      if (err instanceof ParseError) {
        setError(err.message);
      } else {
        const errorMsg = "Unexpected error — please try again";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    }
  };

  return {
    handleFile,
    stage,
    progress,
    error,
    clearError
  };
}
