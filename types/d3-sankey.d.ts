declare module 'd3-sankey' {
  import { Link, SimulationNodeDatum } from 'd3';

  export interface SankeyNode extends SimulationNodeDatum {
    name?: string;
    x0?: number;
    x1?: number;
    y0?: number;
    y1?: number;
    value?: number;
  }

  export interface SankeyLink {
    source: number | SankeyNode;
    target: number | SankeyNode;
    value: number;
    width?: number;
    y0?: number;
    y1?: number;
  }

  export interface SankeyGraph<N extends SankeyNode, L extends SankeyLink> {
    nodes: N[];
    links: L[];
  }

  export interface SankeyLayout<N extends SankeyNode, L extends SankeyLink> {
    (graph: SankeyGraph<N, L>): SankeyGraph<N, L>;
    nodeAlign(
      align: 'left' | 'right' | 'center' | 'justify' | ((node: N, n: number) => number)
    ): this;
    nodeWidth(width: number): this;
    nodePadding(padding: number): this;
    extent(extent: [[number, number], [number, number]]): this;
    size(size: [number, number]): this;
    iterations(iterations: number): this;
  }

  export function sankey<N extends SankeyNode, L extends SankeyLink>(): SankeyLayout<N, L>;

  export function sankeyLinkHorizontal(): Link<SankeyNode, SankeyLink>;
  export function sankeyLinkVertical(): Link<SankeyNode, SankeyLink>;
  export function sankeyLeft(node: SankeyNode, n: number): number;
  export function sankeyRight(node: SankeyNode, n: number): number;
  export function sankeyCenter(node: SankeyNode, n: number): number;
  export function sankeyJustify(node: SankeyNode, n: number): number;
}
