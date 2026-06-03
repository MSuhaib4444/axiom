'use client';

import { useRouter } from 'next/navigation';
import { parseFile, ParseError } from '@/lib/parser';
import { useDataStore, UploadStage } from '@/store/dataStore';
import { useUIStore } from '@/store/uiStore';
import { sleep } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export function useFileUpload() {
  const router = useRouter();
  const { 
    setFile, 
    uploadStage, 
    uploadProgress, 
    error: globalError,
    setUploadStage, 
    setUploadProgress, 
    setUploadFileName, 
    setError 
  } = useDataStore();
  const { setActiveView } = useUIStore();
  
  const clearError = () => setError(null);

  const handleFile = async (file: File) => {
    try {
      setError(null);
      setUploadFileName(file.name);
      setUploadStage('reading');
      setUploadProgress(20);
      
      // Artificial delay for UI feedback
      await sleep(300);
      
      setUploadStage('parsing');
      setUploadProgress(60);
      
      const result = await parseFile(file);
      
      setUploadStage('analyzing');
      setUploadProgress(90);
      
      // Simulate analysis phase 
      await sleep(400);
      
      setFile(result);
      setActiveView('grid');
      
      setUploadStage('done');
      setUploadProgress(100);
      
      const sheet = result.sheets[0];
      toast.success(
        `File parsed successfully — ${sheet?.rowCount || 0} rows, ${sheet?.columnCount || 0} columns`
      );
      
      await sleep(500);
      // Reset back to idle after completion
      setUploadStage('idle');
      setUploadProgress(0);
      setUploadFileName(null);
      router.push('/workspace');
    } catch (err) {
      setUploadStage('error');
      setUploadProgress(0);
      
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
    stage: uploadStage,
    progress: uploadProgress,
    error: globalError,
    clearError
  };
}
