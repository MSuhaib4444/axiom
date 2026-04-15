'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { buildCorrelationMatrix } from '@/lib/stats';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useRouter } from 'next/navigation';
import { CellValue } from '@/types/data';

export const CorrelationMatrix: React.FC = () => {
  const { getActiveSheetData } = useDataStore();
  const sheet = getActiveSheetData();
  const router = useRouter();

  const [d3, setD3] = useState<any>(null);

  useEffect(() => {
    import('d3').then((d3Module) => {
      setD3(d3Module);
    });
  }, []);

  const numericColumns = useMemo(() => {
    if (!sheet) return [];
    return sheet.columns.filter((c) => c.type === 'number');
  }, [sheet]);

  const [isComputing, setIsComputing] = useState(true);
  const [matrix, setMatrix] = useState<Array<{ colA: string; colB: string; r: number | null }>>([]);

  useEffect(() => {
    if (!sheet || numericColumns.length < 2) {
      setIsComputing(false);
      return;
    }

    setIsComputing(true);
    // Use setTimeout to allow UI to render loading state
    const timer = setTimeout(() => {
      const colsToProcess = numericColumns.map((col) => ({
        key: col.key,
        values: sheet.rows.map((r) => r[col.key]) as CellValue[],
      }));
      const result = buildCorrelationMatrix(colsToProcess);
      setMatrix(result);
      setIsComputing(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [sheet, numericColumns]);

  if (!sheet) return null;

  if (numericColumns.length < 2) {
    return (
      <GlassCard>
        <div className="flex h-40 items-center justify-center text-slate-400">
          Need at least 2 numeric columns for correlation analysis
        </div>
      </GlassCard>
    );
  }

  if (isComputing || !d3) {
    return (
      <GlassCard title="Correlation Matrix">
        <div className="flex h-64 items-center justify-center text-slate-400 animate-pulse">
          Computing correlation matrix...
        </div>
      </GlassCard>
    );
  }

  const cellSize = 60;
  const padding = 120; // for labels
  const width = numericColumns.length * cellSize + padding * 2;
  const height = numericColumns.length * cellSize + padding * 2;

  const colorScale = d3.scaleSequential()
    .domain([-1, 1])
    .interpolator(d3.interpolateRdYlPu);

  const handleCellClick = (colA: string, colB: string) => {
    // Navigate to visualize page and set up scatter plot
    // For now we pass via query params
    router.push(`/visualize?type=scatter&x=${encodeURIComponent(colA)}&y=${encodeURIComponent(colB)}`);
  };

  const drawSVGElements = () => {
    const elements: React.ReactNode[] = [];

    // cells
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = 0; j < numericColumns.length; j++) {
        const colA = numericColumns[i];
        const colB = numericColumns[j];
        if (!colA || !colB) continue;

        const cellData = matrix.find((m) => m.colA === colA.key && m.colB === colB.key);
        const r = cellData?.r ?? 0;
        
        const x = padding + i * cellSize;
        const y = padding + j * cellSize;

        elements.push(
          <g 
            key={`${i}-${j}`} 
            transform={`translate(${x},${y})`}
            onClick={() => handleCellClick(colA.key, colB.key)}
            className="cursor-pointer transition-transform hover:scale-95 origin-center group"
          >
            <rect
              width={cellSize}
              height={cellSize}
              fill={cellData?.r !== null ? colorScale(r) : '#222'}
              stroke="var(--glass-border)"
              strokeWidth="1"
            />
            {cellData?.r !== null && (
              <text
                x={cellSize / 2}
                y={cellSize / 2}
                dy=".35em"
                textAnchor="middle"
                fontSize="11px"
                fill={Math.abs(r) > 0.5 ? '#fff' : '#000'}
                className="font-mono pointer-events-none"
              >
                {r.toFixed(2)}
              </text>
            )}
            {/* Tooltip via native title for simplicity */}
            <title>{`${colA.name} vs ${colB.name}: r = ${cellData?.r !== null ? r.toFixed(3) : 'N/A'}`}</title>
          </g>
        );
      }
    }

    // headers
    for (let i = 0; i < numericColumns.length; i++) {
        const col = numericColumns[i];
        if(!col) continue;

        // X Axis labels (top)
        elements.push(
            <text
                key={`x-label-${i}`}
                x={padding + i * cellSize + cellSize / 2}
                y={padding - 10}
                textAnchor="start"
                fontSize="12px"
                fill="var(--text-secondary)"
                transform={`rotate(-45, ${padding + i * cellSize + cellSize / 2}, ${padding - 10})`}
            >
                {col.name.length > 25 ? col.name.substring(0, 25) + '...' : col.name}
            </text>
        );

        // Y Axis labels (left)
        elements.push(
            <text
                key={`y-label-${i}`}
                x={padding - 10}
                y={padding + i * cellSize + cellSize / 2}
                dy=".35em"
                textAnchor="end"
                fontSize="12px"
                fill="var(--text-secondary)"
            >
                {col.name.length > 25 ? col.name.substring(0, 25) + '...' : col.name}
            </text>
        );
    }

    return elements;
  }

  const exportAsPng = () => {
    const svg = document.getElementById('correlation-svg');
    if (!svg) return;
    
    // Simple SVG to PNG using Canvas
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    const svgSize = svg.getBoundingClientRect();
    canvas.width = svgSize.width;
    canvas.height = svgSize.height;

    img.onload = () => {
        if(ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height); // white bg
            ctx.drawImage(img, 0, 0);
        }
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "correlation-matrix.png";
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Correlation Matrix</h3>
        <GlassButton onClick={exportAsPng} variant="ghost" className="text-xs">
          Export PNG
        </GlassButton>
      </div>
      <div className="overflow-auto border border-white/10 rounded-xl bg-black/20 p-4 custom-scrollbar">
        <svg width={width} height={height} className="mx-auto" id="correlation-svg">
            {drawSVGElements()}
        </svg>
      </div>
    </GlassCard>
  )
}
