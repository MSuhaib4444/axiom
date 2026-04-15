'use client';

import { useState, useCallback } from 'react';
import { domToPng, domToSvg } from 'modern-screenshot';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';

interface ChartExporterProps {
  chartContainerRef: React.RefObject<HTMLDivElement | null>;
  chartTitle: string;
}

export type ExportType = 'png' | 'svg' | 'clipboard' | null;

export const useChartExporter = ({ chartContainerRef, chartTitle }: ChartExporterProps) => {
  const [exportingType, setExportingType] = useState<ExportType>(null);

  const exportPNG = useCallback(async () => {
    if (!chartContainerRef.current) return;
    
    setExportingType('png');
    try {
      const dataUrl = await domToPng(chartContainerRef.current, {
        backgroundColor: '#0f172a', // Matches our dark theme
        scale: 2, // Higher resolution
      });
      
      saveAs(dataUrl, `${chartTitle.replace(/\s+/g, '_')}_chart.png`);
      toast.success('Chart exported as PNG');
    } catch (error) {
      console.error('Failed to export PNG:', error);
      toast.error('Failed to export PNG');
    } finally {
      setExportingType(null);
    }
  }, [chartContainerRef, chartTitle]);

  const exportSVG = useCallback(async () => {
    if (!chartContainerRef.current) return;
    
    setExportingType('svg');
    try {
      const dataUrl = await domToSvg(chartContainerRef.current, {
        backgroundColor: '#0f172a',
      });
      
      saveAs(dataUrl, `${chartTitle.replace(/\s+/g, '_')}_chart.svg`);
      toast.success('Chart exported as SVG');
    } catch (error) {
      console.error('Failed to export SVG:', error);
      toast.error('Failed to export SVG');
    } finally {
      setExportingType(null);
    }
  }, [chartContainerRef, chartTitle]);

  const copyToClipboard = useCallback(async () => {
    if (!chartContainerRef.current) return;
    
    setExportingType('clipboard');
    try {
      const dataUrl = await domToPng(chartContainerRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
      });

      // Convert dataUrl to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      if (blob) {
        try {
          const data = [new ClipboardItem({ [blob.type]: blob })];
          await navigator.clipboard.write(data);
          toast.success('Chart copied to clipboard');
        } catch (err) {
          console.error('Clipboard API failed:', err);
          toast.error('Failed to copy to clipboard');
        }
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    } finally {
      setExportingType(null);
    }
  }, [chartContainerRef, chartTitle]);

  return {
    exportPNG,
    exportSVG,
    copyToClipboard,
    exportingType,
    isExporting: exportingType !== null
  };
};
