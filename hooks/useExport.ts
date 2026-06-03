'use client';

import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { SheetData } from '@/types/data';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = useCallback(async (elementRef: React.RefObject<HTMLDivElement | null>, filename: string) => {
    const element = elementRef.current;
    if (!element) {
      toast.error('Export target element not found');
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading('Generating PDF...');

    try {
      // Capture the element using html2canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#04040f',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 size width in mm
      const pageHeight = 297; // A4 size height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Add subsequent pages if the content overflows A4 height
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
      toast.success('PDF exported successfully', { id: toastId });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to generate PDF', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportCSV = useCallback((sheet: SheetData, filename: string) => {
    try {
      const ws = XLSX.utils.json_to_sheet(sheet.rows);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('CSV export failed:', error);
      toast.error('Failed to export CSV');
    }
  }, []);

  const exportXLSX = useCallback((sheet: SheetData, filename: string) => {
    try {
      const ws = XLSX.utils.json_to_sheet(sheet.rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheet.name || 'Sheet1');
      XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Excel export failed:', error);
      toast.error('Failed to export Excel file');
    }
  }, []);

  return {
    exportPDF,
    exportCSV,
    exportXLSX,
    isExporting,
  };
}
