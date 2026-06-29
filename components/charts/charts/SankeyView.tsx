'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';
import { useChartDimensions } from '@/hooks/useChartDimensions';
import { getChartColor } from '@/lib/chartConfig';
import { formatNumber } from '@/lib/utils';

interface SankeyViewProps {
  data: Record<string, unknown>[];
  sourceKey: string;
  targetKey: string;
  valueKey: string;
}

interface TooltipState {
  x: number;
  y: number;
  label: string;
  value: number;
  type: 'node' | 'link';
}

interface SankeyNodeDatum extends SankeyNode {
  name: string;
  index?: number;
}

interface SankeyLinkDatum extends SankeyLink {
  source: number;
  target: number;
  value: number;
}

const MARGIN = { top: 20, right: 120, bottom: 20, left: 120 };
const NODE_WIDTH = 20;

function buildSankeyData(
  data: Record<string, unknown>[],
  sourceKey: string,
  targetKey: string,
  valueKey: string
): { nodes: SankeyNodeDatum[]; links: SankeyLinkDatum[] } | null {
  const linkMap = new Map<string, number>();

  data.forEach((row) => {
    const source = String(row[sourceKey] ?? '').trim();
    const target = String(row[targetKey] ?? '').trim();
    const raw = row[valueKey];
    const value = typeof raw === 'number' ? raw : Number(raw);
    if (!source || !target || source === target || !Number.isFinite(value) || value <= 0) return;

    const key = `${source}→${target}`;
    linkMap.set(key, (linkMap.get(key) ?? 0) + value);
  });

  if (linkMap.size < 2) return null;

  const nodeNames = new Set<string>();
  linkMap.forEach((_val, key) => {
    const [source, target] = key.split('→') as [string, string];
    nodeNames.add(source);
    nodeNames.add(target);
  });

  const nodes: SankeyNodeDatum[] = Array.from(nodeNames).map((name) => ({ name }));
  const nodeIndex = new Map(nodes.map((n, i) => [n.name, i]));

  const links: SankeyLinkDatum[] = Array.from(linkMap, ([key, value]) => {
    const [source, target] = key.split('→') as [string, string];
    return {
      source: nodeIndex.get(source) ?? 0,
      target: nodeIndex.get(target) ?? 0,
      value,
    };
  });

  return { nodes, links };
}

const SankeyView: React.FC<SankeyViewProps> = ({ data, sourceKey, targetKey, valueKey }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { containerRef, dimensions } = useChartDimensions();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const graphData = useMemo(
    () => buildSankeyData(data, sourceKey, targetKey, valueKey),
    [data, sourceKey, targetKey, valueKey]
  );

  useEffect(() => {
    if (!svgRef.current || !graphData) return;

    const { width, height } = dimensions;
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const sankeyGenerator = sankey<SankeyNodeDatum, SankeyLinkDatum>()
      .nodeWidth(NODE_WIDTH)
      .nodePadding(12)
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ]);

    const graph = sankeyGenerator({
      nodes: graphData.nodes.map((d) => ({ ...d })),
      links: graphData.links.map((d) => ({ ...d })),
    });

    const g = svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const defs = svg.append('defs');

    const getNode = (ref: number | SankeyNodeDatum): SankeyNodeDatum =>
      typeof ref === 'number' ? graph.nodes[ref]! : ref;

    graph.links.forEach((link, i) => {
      const sourceNode = getNode(link.source);
      const targetNode = getNode(link.target);
      const sourceColor = getChartColor(sourceNode.index ?? 0);
      const targetColor = getChartColor((targetNode.index ?? 0) + 2);

      const gradient = defs
        .append('linearGradient')
        .attr('id', `link-gradient-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', sourceNode.x1 ?? 0)
        .attr('x2', targetNode.x0 ?? 0);

      gradient.append('stop').attr('offset', '0%').attr('stop-color', sourceColor).attr('stop-opacity', 0.45);
      gradient.append('stop').attr('offset', '100%').attr('stop-color', targetColor).attr('stop-opacity', 0.25);

      gradient
        .attr('x1', sourceNode.x1 ?? 0)
        .attr('x2', targetNode.x0 ?? 0);
    });

    const linkPath = sankeyLinkHorizontal();

    g.append('g')
      .attr('fill', 'none')
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('d', linkPath)
      .attr('stroke', (_d, i) => `url(#link-gradient-${i})`)
      .attr('stroke-width', (d) => Math.max(1, d.width ?? 0))
      .attr('stroke-opacity', 0.7)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('stroke-opacity', 1);
        const sourceNode = getNode(d.source as number | SankeyNodeDatum);
        const targetNode = getNode(d.target as number | SankeyNodeDatum);
        const container = containerRef.current?.getBoundingClientRect();
        if (container) {
          setTooltip({
            x: event.clientX - container.left,
            y: event.clientY - container.top - 8,
            label: `${sourceNode.name} → ${targetNode.name}`,
            value: d.value ?? 0,
            type: 'link',
          });
        }
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke-opacity', 0.7);
        setTooltip(null);
      });

    const nodeGroups = g
      .append('g')
      .selectAll('g')
      .data(graph.nodes)
      .join('g');

    nodeGroups
      .append('rect')
      .attr('x', (d) => d.x0 ?? 0)
      .attr('y', (d) => d.y0 ?? 0)
      .attr('height', (d) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .attr('width', (d) => (d.x1 ?? 0) - (d.x0 ?? 0))
      .attr('fill', (d, i) => getChartColor(i))
      .attr('stroke', 'rgba(255,255,255,0.2)')
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        const container = containerRef.current?.getBoundingClientRect();
        if (container) {
          setTooltip({
            x: event.clientX - container.left,
            y: event.clientY - container.top - 8,
            label: d.name,
            value: d.value ?? 0,
            type: 'node',
          });
        }
      })
      .on('mouseleave', () => setTooltip(null));

    nodeGroups
      .append('text')
      .attr('x', (d) => {
        const midX = ((d.x0 ?? 0) + (d.x1 ?? 0)) / 2;
        return midX < innerWidth / 2 ? (d.x0 ?? 0) - 6 : (d.x1 ?? 0) + 6;
      })
      .attr('y', (d) => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d) => {
        const midX = ((d.x0 ?? 0) + (d.x1 ?? 0)) / 2;
        return midX < innerWidth / 2 ? 'end' : 'start';
      })
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', 11)
      .text((d) => d.name);
  }, [graphData, dimensions, containerRef]);

  if (!graphData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm text-center px-6">
        Sankey diagram requires at least 2 unique source→target pairs with positive values.
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
          <p className="font-semibold text-white mb-0.5">{tooltip.label}</p>
          <p className="text-[var(--accent-cyan)] font-medium">{formatNumber(tooltip.value)}</p>
        </div>
      )}
    </div>
  );
};

export default SankeyView;
