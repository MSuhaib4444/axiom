'use client';

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useChartDimensions } from '@/hooks/useChartDimensions';
import { getChartColor } from '@/lib/chartConfig';
import { formatNumber } from '@/lib/utils';

interface TreemapViewProps {
  data: Record<string, unknown>[];
  labelKey: string;
  valueKey: string;
  groupKey?: string;
}

interface TreemapNode extends d3.HierarchyNode<TreemapDatum> {
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
}

interface TreemapDatum {
  name: string;
  value?: number;
  children?: TreemapDatum[];
}

interface TooltipState {
  x: number;
  y: number;
  name: string;
  value: number;
}

function buildHierarchy(
  data: Record<string, unknown>[],
  labelKey: string,
  valueKey: string,
  groupKey?: string
): TreemapDatum {
  if (groupKey) {
    const groups = d3.group(data, (d) => String(d[groupKey] ?? 'Other'));
    return {
      name: 'root',
      children: Array.from(groups, ([group, rows]) => ({
        name: group,
        children: rows.map((row) => ({
          name: String(row[labelKey] ?? ''),
          value: Math.max(0, Number(row[valueKey]) || 0),
        })),
      })),
    };
  }

  const aggregated = d3.rollup(
    data,
    (rows) => d3.sum(rows, (r) => Math.max(0, Number(r[valueKey]) || 0)),
    (d) => String(d[labelKey] ?? '')
  );

  return {
    name: 'root',
    children: Array.from(aggregated, ([name, value]) => ({ name, value })),
  };
}

const TreemapView: React.FC<TreemapViewProps> = ({
  data,
  labelKey,
  valueKey,
  groupKey,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { containerRef, dimensions } = useChartDimensions();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [drillPath, setDrillPath] = useState<string[]>([]);

  const rootData = useMemo(
    () => buildHierarchy(data, labelKey, valueKey, groupKey),
    [data, labelKey, valueKey, groupKey]
  );

  const currentRoot = useMemo((): TreemapDatum => {
    if (!groupKey) return rootData;

    if (drillPath.length === 0) {
      return {
        name: 'root',
        children: (rootData.children ?? []).map((group) => {
          const child: TreemapDatum = {
            name: group.name,
            value: d3.sum(group.children ?? [], (c) => c.value ?? 0),
          };
          if (group.children && group.children.length > 0) {
            child.children = group.children;
          }
          return child;
        }),
      };
    }

    let node: TreemapDatum = rootData;
    for (const segment of drillPath) {
      const child = node.children?.find((c) => c.name === segment);
      if (!child) break;
      node = child;
    }
    return {
      name: node.name,
      children: node.children ?? [],
    };
  }, [rootData, drillPath, groupKey]);

  const parentColorMap = useMemo(() => {
    const map = new Map<string, string>();
    rootData.children?.forEach((child, i) => {
      map.set(child.name, getChartColor(i));
    });
    return map;
  }, [rootData]);

  const handleDrillUp = useCallback(() => {
    setDrillPath((prev) => prev.slice(0, -1));
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const { width, height } = dimensions;
    if (width <= 0 || height <= 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const hierarchy = d3
      .hierarchy<TreemapDatum>(currentRoot)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const treemapLayout = d3
      .treemap<TreemapDatum>()
      .tile(d3.treemapSquarify)
      .size([width, height])
      .paddingInner(2)
      .paddingOuter(4)
      .round(true);

    treemapLayout(hierarchy);

    const leaves = hierarchy.leaves() as TreemapNode[];

    const g = svg.append('g');

    const cells = g
      .selectAll('g.cell')
      .data(leaves)
      .join('g')
      .attr('class', 'cell')
      .attr('transform', (d) => `translate(${d.x0 ?? 0},${d.y0 ?? 0})`)
      .style('cursor', 'pointer');

    cells
      .append('rect')
      .attr('width', (d) => Math.max(0, (d.x1 ?? 0) - (d.x0 ?? 0)))
      .attr('height', (d) => Math.max(0, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .attr('fill', (d) => {
        const parentName = d.parent?.data.name ?? '';
        const leafIndex = leaves.indexOf(d);
        const color = parentColorMap.get(parentName) ?? getChartColor(leafIndex);
        return color;
      })
      .attr('stroke', 'rgba(255,255,255,0.15)')
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .on('mouseenter', function (event, d) {
        d3.select(this.parentNode as SVGGElement)
          .transition()
          .duration(150)
          .attr('transform', `translate(${d.x0 ?? 0},${d.y0 ?? 0}) scale(1.02)`);
        const rect = (event.currentTarget as SVGRectElement).getBoundingClientRect();
        const container = containerRef.current?.getBoundingClientRect();
        if (container) {
          setTooltip({
            x: rect.left - container.left + rect.width / 2,
            y: rect.top - container.top - 8,
            name: d.data.name,
            value: d.value ?? 0,
          });
        }
      })
      .on('mouseleave', function (_event, d) {
        d3.select(this.parentNode as SVGGElement)
          .transition()
          .duration(150)
          .attr('transform', `translate(${d.x0 ?? 0},${d.y0 ?? 0}) scale(1)`);
        setTooltip(null);
      })
      .on('click', (_event, d) => {
        if (!groupKey) return;
        const hasChildren = d.data.children && d.data.children.length > 0;
        if (hasChildren && drillPath.length < 2) {
          setDrillPath((prev) => [...prev, d.data.name]);
        }
      });

    cells.each(function (d) {
      const cellWidth = (d.x1 ?? 0) - (d.x0 ?? 0);
      const cellHeight = (d.y1 ?? 0) - (d.y0 ?? 0);
      if (cellWidth < 30 || cellHeight < 16) return;

      const text = d3
        .select(this)
        .append('text')
        .attr('x', 4)
        .attr('y', 14)
        .attr('fill', '#fff')
        .attr('font-size', Math.min(12, cellHeight * 0.35))
        .attr('font-weight', 500)
        .attr('pointer-events', 'none');

      const label = d.data.name;
      const maxChars = Math.floor(cellWidth / 7);
      const clipped = label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label;
      text.text(clipped);

      text.each(function () {
        const self = d3.select(this);
        let textLength = (this as SVGTextElement).getComputedTextLength();
        let truncated = clipped;
        while (textLength > cellWidth - 8 && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
          self.text(`${truncated}…`);
          textLength = (this as SVGTextElement).getComputedTextLength();
        }
      });
    });
  }, [currentRoot, dimensions, parentColorMap, containerRef, drillPath, groupKey]);

  const canDrillUp = drillPath.length > 0;

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {canDrillUp && (
        <button
          type="button"
          onClick={handleDrillUp}
          className="absolute top-2 left-2 z-10 btn-glass text-xs px-2 py-1"
        >
          ← Back{drillPath.length > 0 ? ` (${drillPath[drillPath.length - 1]})` : ''}
        </button>
      )}
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
          <p className="font-semibold text-white mb-0.5">{tooltip.name}</p>
          <p className="text-[var(--accent-cyan)] font-medium">{formatNumber(tooltip.value)}</p>
        </div>
      )}
    </div>
  );
};

export default TreemapView;
