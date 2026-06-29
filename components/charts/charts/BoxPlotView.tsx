'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import * as ss from 'simple-statistics';
import { useChartDimensions } from '@/hooks/useChartDimensions';
import { getChartColor } from '@/lib/chartConfig';
import { formatNumber } from '@/lib/utils';
import { CellValue } from '@/types/data';

interface BoxPlotViewProps {
  data: CellValue[][];
  labels: string[];
}

interface BoxPlotStats {
  label: string;
  q1: number;
  median: number;
  q3: number;
  min: number;
  max: number;
  outliers: number[];
  mean: number;
  count: number;
}

interface TooltipState {
  x: number;
  y: number;
  stats: BoxPlotStats;
}

const MARGIN = { top: 20, right: 20, bottom: 60, left: 60 };
const MIN_VALUES = 4;

function computeBoxStats(values: CellValue[], label: string): BoxPlotStats | null {
  const nums = values
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
    .sort((a, b) => a - b);

  if (nums.length < MIN_VALUES) return null;

  const q1 = ss.quantile(nums, 0.25);
  const median = ss.median(nums);
  const q3 = ss.quantile(nums, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  const whiskerMin = nums.find((v) => v >= lowerFence) ?? nums[0]!;
  const whiskerMax = [...nums].reverse().find((v) => v <= upperFence) ?? nums[nums.length - 1]!;
  const outliers = nums.filter((v) => v < lowerFence || v > upperFence);

  return {
    label,
    q1,
    median,
    q3,
    min: whiskerMin,
    max: whiskerMax,
    outliers,
    mean: ss.mean(nums),
    count: nums.length,
  };
}

const BoxPlotView: React.FC<BoxPlotViewProps> = ({ data, labels }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { containerRef, dimensions } = useChartDimensions();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const boxStats = useMemo(() => {
    return data
      .map((col, i) => computeBoxStats(col, labels[i] ?? `Group ${i + 1}`))
      .filter((s): s is BoxPlotStats => s !== null);
  }, [data, labels]);

  const insufficientData = useMemo(() => {
    return data.some((col) => {
      const nums = col.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
      return nums.length > 0 && nums.length < MIN_VALUES;
    });
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || boxStats.length === 0) return;

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

    const yMin = d3.min(boxStats, (d) => Math.min(d.min, ...d.outliers)) ?? 0;
    const yMax = d3.max(boxStats, (d) => Math.max(d.max, ...d.outliers)) ?? 1;
    const yPadding = (yMax - yMin) * 0.1 || 1;

    const xScale = d3
      .scaleBand()
      .domain(boxStats.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.3);

    const yScale = d3
      .scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([innerHeight, 0]);

    const boxWidth = Math.min(40, xScale.bandwidth());

    boxStats.forEach((stats, i) => {
      const x = (xScale(stats.label) ?? 0) + xScale.bandwidth() / 2;
      const color = getChartColor(i);
      const group = g.append('g').attr('class', 'box-group');

      group
        .append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', yScale(stats.min))
        .attr('y2', yScale(stats.q1))
        .attr('stroke', color)
        .attr('stroke-width', 1.5);

      group
        .append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', yScale(stats.q3))
        .attr('y2', yScale(stats.max))
        .attr('stroke', color)
        .attr('stroke-width', 1.5);

      group
        .append('line')
        .attr('x1', x - boxWidth / 2)
        .attr('x2', x + boxWidth / 2)
        .attr('y1', yScale(stats.min))
        .attr('y2', yScale(stats.min))
        .attr('stroke', color)
        .attr('stroke-width', 1.5);

      group
        .append('line')
        .attr('x1', x - boxWidth / 2)
        .attr('x2', x + boxWidth / 2)
        .attr('y1', yScale(stats.max))
        .attr('y2', yScale(stats.max))
        .attr('stroke', color)
        .attr('stroke-width', 1.5);

      const box = group
        .append('rect')
        .attr('x', x - boxWidth / 2)
        .attr('y', yScale(stats.q3))
        .attr('width', boxWidth)
        .attr('height', Math.max(1, yScale(stats.q1) - yScale(stats.q3)))
        .attr('fill', `${color}33`)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('rx', 3)
        .style('cursor', 'pointer');

      group
        .append('line')
        .attr('x1', x - boxWidth / 2)
        .attr('x2', x + boxWidth / 2)
        .attr('y1', yScale(stats.median))
        .attr('y2', yScale(stats.median))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      stats.outliers.forEach((outlier) => {
        group
          .append('circle')
          .attr('cx', x)
          .attr('cy', yScale(outlier))
          .attr('r', 3)
          .attr('fill', color)
          .attr('stroke', 'rgba(255,255,255,0.5)')
          .attr('stroke-width', 1);
      });

      const showTooltip = (event: MouseEvent) => {
        const container = containerRef.current?.getBoundingClientRect();
        if (container) {
          setTooltip({
            x: event.clientX - container.left,
            y: event.clientY - container.top - 8,
            stats,
          });
        }
      };

      box.on('mouseenter', showTooltip).on('mousemove', showTooltip).on('mouseleave', () => setTooltip(null));
    });

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).ticks(6);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', 11)
      .attr('transform', 'rotate(-20)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.3em');

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', 11);

    g.selectAll('.domain, .tick line').attr('stroke', 'rgba(255,255,255,0.1)');
  }, [boxStats, dimensions, containerRef]);

  if (insufficientData || boxStats.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm text-center px-6">
        Box plot requires at least {MIN_VALUES} numeric values per group.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg ref={svgRef} className="w-full h-full" />
      {tooltip && (
        <div
          className="glass-card absolute z-10 px-3 py-2 pointer-events-none text-xs border border-white/10 shadow-xl min-w-[160px]"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="font-semibold text-white mb-1.5">{tooltip.stats.label}</p>
          <div className="space-y-0.5 text-slate-400">
            <p>Min: <span className="text-[var(--accent-cyan)]">{formatNumber(tooltip.stats.min)}</span></p>
            <p>Q1: <span className="text-[var(--accent-cyan)]">{formatNumber(tooltip.stats.q1)}</span></p>
            <p>Median: <span className="text-[var(--accent-cyan)]">{formatNumber(tooltip.stats.median)}</span></p>
            <p>Q3: <span className="text-[var(--accent-cyan)]">{formatNumber(tooltip.stats.q3)}</span></p>
            <p>Max: <span className="text-[var(--accent-cyan)]">{formatNumber(tooltip.stats.max)}</span></p>
            <p>Mean: <span className="text-[var(--accent-cyan)]">{formatNumber(tooltip.stats.mean)}</span></p>
            <p>Outliers: <span className="text-[var(--accent-amber)]">{tooltip.stats.outliers.length}</span></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoxPlotView;
