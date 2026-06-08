'use client';

import React, { useEffect } from 'react';
import { useDataStore } from '@/store/dataStore';
import { getFileFromDB } from '@/lib/db';

export const MemoryInitializer: React.FC = () => {
  const { restoreFile, setIsRestoring } = useDataStore();

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const storedFile = await getFileFromDB();
        if (storedFile && active) {
          // Convert date string back to Date object if needed
          if (storedFile.parsedAt && !(storedFile.parsedAt instanceof Date)) {
            storedFile.parsedAt = new Date(storedFile.parsedAt);
          }
          restoreFile(storedFile);
        }
      } catch (err) {
        console.error('Failed to restore spreadsheet session from IndexedDB:', err);
      } finally {
        if (active) {
          setIsRestoring(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, [restoreFile, setIsRestoring]);

  return null;
};
