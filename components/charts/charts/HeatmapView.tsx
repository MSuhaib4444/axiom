'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { useChartDimensions } from '@/hooks/useChartDimensions';
import { formatNumber } from '@/lib/utils';

interface HeatmapViewProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  valueKey: string;
}

interface TooltipState {
  x: number;
  y: number;
  xLabel: string;
  yLabel: string;
  value: number;
}

interface MatrixCell {
  xLabel: string;
  yLabel: string;
  value: number;
}

const MARGIN = { top: 20, right: 20, bottom: 80, left: 80 };

function buildMatrix(
  data: Record<string, unknown>[],
  xKey: string,
  yKey: string,
  valueKey: string
): { cells: MatrixCell[]; xLabels: string[]; yLabels: string[] } {
  const matrix = new Map<string, number>();

  data.forEach((row) => {
    const xLabel = String(row[xKey] ?? '');
    const yLabel = String(row[yKey] ?? '');
    const raw = row[valueKey];
    const val = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(val)) return;

    const key = `${xLabel}|||${yLabel}`;
    matrix.set(key, (matrix.get(key) ?? 0) + val);
  });

  const xSet = new Set<string>();
  const ySet = new Set<string>();
  const cells: MatrixCell[] = [];

  matrix.forEach((value, key) => {
    const [xLabel, yLabel] = key.split('|||') as [string, string];
    xSet.add(xLabel);
    ySet.add(yLabel);
    cells.push({ xLabel, yLabel, value });
  });

  const xLabels = Array.from(xSet).sort();
  const yLabels = Array.from(ySet).sort();

  return { cells, xLabels, yLabels };
}

const HeatmapView: React.FC<HeatmapViewProps> = ({ data, xKey, yKey, valueKey }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { containerRef, dimensions } = useChartDimensions();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const { cells, xLabels, yLabels } = useMemo(
    () => buildMatrix(data, xKey, yKey, valueKey),
    [data, xKey, yKey, valueKey]
  );

  const valueExtent = useMemo(() => {
    if (cells.length === 0) return [0, 1] as [number, number];
    const values = cells.map((c) => c.value);
    return d3.extent(values) as [number, number];
  }, [cells]);

  useEffect(() => {
    if (!svgRef.current || cells.length === 0) return;

    const { width, height } = dimensions;
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const xScale = d3
      .scaleBand()
      .domain(xLabels)
      .range([0, innerWidth])
      .padding(0.05);

    const yScale = d3
      .scaleBand()
      .domain(yLabels)
      .range([0, innerHeight])
      .padding(0.05);

    const [minVal, maxVal] = valueExtent;
    const colorScale = d3
      .scaleSequential(d3.interpolateViridis)
      .domain([minVal ?? 0, maxVal ?? 1]);

    const cellWidth = xScale.bandwidth();
    const cellHeight = yScale.bandwidth();
    const showText = cellWidth > 28 && cellHeight > 18;

    g.selectAll('rect')
      .data(cells)
      .join('rect')
      .attr('x', (d) => xScale(d.xLabel) ?? 0)
      .attr('y', (d) => yScale(d.yLabel) ?? 0)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('rx', 3)
      .attr('fill', (d) => colorScale(d.value))
      .attr('stroke', 'rgba(255,255,255,0.08)')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('stroke', 'rgba(255,255,255,0.4)').attr('stroke-width', 2);
        const rect = (event.currentTarget as SVGRectElement).getBoundingClientRect();
        const container = containerRef.current?.getBoundingClientRect();
        if (container) {
          setTooltip({
            x: rect.left - container.left + rect.width / 2,
            y: rect.top - container.top - 8,
            xLabel: d.xLabel,
            yLabel: d.yLabel,
            value: d.value,
          });
        }
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke', 'rgba(255,255,255,0.08)').attr('stroke-width', 1);
        setTooltip(null);
      });

    if (showText) {
      g.selectAll('text.cell-value')
        .data(cells)
        .join('text')
        .attr('class', 'cell-value')
        .attr('x', (d) => (xScale(d.xLabel) ?? 0) + cellWidth / 2)
        .attr('y', (d) => (yScale(d.yLabel) ?? 0) + cellHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', (d) => (d.value > ((minVal ?? 0) + (maxVal ?? 1)) / 2 ? '#fff' : '#ddd'))
        .attr('font-size', Math.min(11, cellHeight * 0.4))
        .attr('pointer-events', 'none')
        .text((d) => formatNumber(d.value, d.value % 1 === 0 ? 0 : 1));
    }

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.15em')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', 11);

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', 11);

    g.selectAll('.domain, .tick line').attr('stroke', 'rgba(255,255,255,0.1)');
  }, [cells, xLabels, yLabels, dimensions, valueExtent, containerRef]);

  if (cells.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
        No data available for heatmap. Ensure all three columns have valid values.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg ref={svgRef} className="w-full h-full" />
      {tooltip && (
        <div
          className="glass-card absolute z-10 px-3 py-2 pointer-events-none text-xs border border-white/10 shadow-xl"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="font-semibold text-white mb-0.5">
            {tooltip.xLabel} × {tooltip.yLabel}
          </p>
          <p className="text-[var(--accent-cyan)] font-medium">{formatNumber(tooltip.value)}</p>
        </div>
      )}
    </div>
  );
};

export default HeatmapView;
