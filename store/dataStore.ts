import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ParsedFile, DataStats, SheetData, Column } from '@/types/data';
import { saveFileToDB, deleteFileFromDB } from '@/lib/db';

export type UploadStage = 'idle' | 'reading' | 'parsing' | 'analyzing' | 'done' | 'error';

interface DataState {
  file: ParsedFile | null;
  activeSheet: string | null;
  selectedColumns: string[];
  highlightedRows: number[];
  stats: DataStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Restore State
  isRestoring: boolean;

  // File Upload Global Progress
  uploadStage: UploadStage;
  uploadProgress: number;
  uploadFileName: string | null;

  // Actions
  setFile: (file: ParsedFile) => void;
  restoreFile: (file: ParsedFile) => void;
  setIsRestoring: (isRestoring: boolean) => void;
  setActiveSheet: (sheetName: string) => void;
  toggleColumnSelection: (columnKey: string) => void;
  clearColumnSelection: () => void;
  highlightRows: (rowIndices: number[]) => void;
  clearHighlights: () => void;
  setError: (error: string | null) => void;
  clearFile: () => void;
  setIsLoading: (isLoading: boolean) => void;
  setUploadStage: (stage: UploadStage) => void;
  setUploadProgress: (progress: number) => void;
  setUploadFileName: (name: string | null) => void;

  // Selectors
  getActiveSheetData: () => SheetData | null;
  getColumn: (key: string) => Column | null;
}

export const useDataStore = create<DataState>()(
  immer((set, get) => ({
    file: null,
    activeSheet: null,
    selectedColumns: [],
    highlightedRows: [],
    stats: null,
    isLoading: false,
    error: null,
    isRestoring: true,
    uploadStage: 'idle',
    uploadProgress: 0,
    uploadFileName: null,

    setFile: (file) => set((state) => {
      state.file = file;
      const firstSheet = file.sheets[0];
      if (firstSheet) {
        state.activeSheet = firstSheet.name;
      } else {
        state.activeSheet = null;
      }
      state.selectedColumns = [];
      state.highlightedRows = [];
      state.error = null;

      // Save to IndexedDB
      if (typeof window !== 'undefined') {
        saveFileToDB(file).catch((err) => {
          console.error('Failed to save file to IndexedDB:', err);
        });
      }
    }),

    restoreFile: (file) => set((state) => {
      state.file = file;
      const firstSheet = file.sheets[0];
      if (firstSheet) {
        state.activeSheet = firstSheet.name;
      } else {
        state.activeSheet = null;
      }
      state.selectedColumns = [];
      state.highlightedRows = [];
      state.error = null;
    }),

    setIsRestoring: (isRestoring) => set((state) => {
      state.isRestoring = isRestoring;
    }),

    setActiveSheet: (sheetName) => set((state) => {
      state.activeSheet = sheetName;
      state.selectedColumns = [];
      state.highlightedRows = [];
    }),

    toggleColumnSelection: (columnKey) => set((state) => {
      const index = state.selectedColumns.indexOf(columnKey);
      if (index === -1) {
        state.selectedColumns.push(columnKey);
      } else {
        state.selectedColumns.splice(index, 1);
      }
    }),

    clearColumnSelection: () => set((state) => {
      state.selectedColumns = [];
    }),

    highlightRows: (rowIndices) => set((state) => {
      state.highlightedRows = rowIndices;
    }),

    clearHighlights: () => set((state) => {
      state.highlightedRows = [];
    }),

    setError: (error) => set((state) => {
      state.error = error;
    }),

    clearFile: () => set((state) => {
      state.file = null;
      state.activeSheet = null;
      state.selectedColumns = [];
      state.highlightedRows = [];
      state.stats = null;
      state.error = null;
      state.isLoading = false;

      // Delete from IndexedDB
      if (typeof window !== 'undefined') {
        deleteFileFromDB().catch((err) => {
          console.error('Failed to delete file from IndexedDB:', err);
        });
      }
    }),

    setIsLoading: (isLoading) => set((state) => {
      state.isLoading = isLoading;
    }),

    setUploadStage: (stage) => set((state) => {
      state.uploadStage = stage;
    }),

    setUploadProgress: (progress) => set((state) => {
      state.uploadProgress = progress;
    }),

    setUploadFileName: (name) => set((state) => {
      state.uploadFileName = name;
    }),

    getActiveSheetData: () => {
      const { file, activeSheet } = get();
      if (!file || !activeSheet) return null;
      return file.sheets.find((s) => s.name === activeSheet) || null;
    },

    getColumn: (key) => {
      const activeData = get().getActiveSheetData();
      if (!activeData) return null;
      return activeData.columns.find((c) => c.key === key) || null;
    }
  }))
);

