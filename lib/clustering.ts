import type { ClusterResult } from '@/types/analysis';

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, ai, i) => sum + (ai - (b[i] ?? 0)) ** 2, 0));
}

function centroidsEqual(a: number[][], b: number[][]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ca = a[i];
    const cb = b[i];
    if (!ca || !cb || ca.length !== cb.length) return false;
    for (let j = 0; j < ca.length; j++) {
      if (Math.abs((ca[j] ?? 0) - (cb[j] ?? 0)) > 1e-10) return false;
    }
  }
  return true;
}

/** k-means++ centroid initialization */
function initCentroidsKMeansPlusPlus(data: number[][], k: number): number[][] {
  if (data.length === 0) throw new Error('Cannot cluster empty data.');
  if (k > data.length) throw new Error('k cannot exceed the number of data points.');

  const centroids: number[][] = [data[Math.floor(Math.random() * data.length)]!];

  while (centroids.length < k) {
    const distances = data.map((point) => {
      const minDist = Math.min(...centroids.map((c) => euclideanDistance(point, c)));
      return minDist * minDist;
    });
    const totalDist = distances.reduce((a, b) => a + b, 0);
    if (totalDist === 0) {
      const remaining = data.filter(
        (p) => !centroids.some((c) => euclideanDistance(p, c) < 1e-10)
      );
      centroids.push(remaining[0] ?? data[centroids.length % data.length]!);
      continue;
    }
    let rand = Math.random() * totalDist;
    for (let i = 0; i < distances.length; i++) {
      rand -= distances[i] ?? 0;
      if (rand <= 0) {
        centroids.push(data[i]!);
        break;
      }
    }
  }

  return centroids;
}

function recomputeCentroids(
  data: number[][],
  assignments: number[],
  k: number,
  dims: number
): number[][] {
  const centroids: number[][] = Array.from({ length: k }, () => new Array(dims).fill(0));
  const counts = new Array(k).fill(0);

  data.forEach((point, i) => {
    const label = assignments[i] ?? 0;
    counts[label] = (counts[label] ?? 0) + 1;
    for (let d = 0; d < dims; d++) {
      centroids[label]![d] = (centroids[label]![d] ?? 0) + (point[d] ?? 0);
    }
  });

  return centroids.map((c, ci) => {
    const count = counts[ci] ?? 0;
    if (count === 0) return data[Math.floor(Math.random() * data.length)]!;
    return c.map((v) => v / count);
  });
}

function computeInertia(
  data: number[][],
  assignments: number[],
  centroids: number[][]
): number {
  return data.reduce((sum, point, i) => {
    const centroid = centroids[assignments[i] ?? 0];
    if (!centroid) return sum;
    return sum + euclideanDistance(point, centroid) ** 2;
  }, 0);
}

/** Average silhouette coefficient approximation (sampled for large datasets) */
function computeSilhouetteScore(
  data: number[][],
  assignments: number[],
  k: number
): number {
  const n = data.length;
  if (n < 2 || k < 2) return 0;

  const maxSample = 500;
  const indices =
    n <= maxSample
      ? Array.from({ length: n }, (_, i) => i)
      : Array.from({ length: maxSample }, () => Math.floor(Math.random() * n));

  let total = 0;
  let valid = 0;

  for (const i of indices) {
    const cluster = assignments[i] ?? 0;

    const sameCluster = data.filter((_, j) => assignments[j] === cluster && j !== i);
    const a =
      sameCluster.length === 0
        ? 0
        : sameCluster.reduce((s, p) => s + euclideanDistance(data[i]!, p), 0) /
          sameCluster.length;

    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === cluster) continue;
      const otherCluster = data.filter((_, j) => assignments[j] === c);
      if (otherCluster.length === 0) continue;
      const avgDist =
        otherCluster.reduce((s, p) => s + euclideanDistance(data[i]!, p), 0) /
        otherCluster.length;
      b = Math.min(b, avgDist);
    }

    if (!Number.isFinite(b)) continue;
    const denom = Math.max(a, b);
    total += denom === 0 ? 0 : (b - a) / denom;
    valid++;
  }

  return valid === 0 ? 0 : total / valid;
}

/**
 * k-means clustering with k-means++ initialization.
 * Converges when centroids stabilize or maxIterations (default 100) is reached.
 */
export function kMeans(
  data: number[][],
  k: number,
  maxIterations = 100
): ClusterResult {
  if (data.length === 0) throw new Error('Cannot cluster empty data.');
  if (k < 1) throw new Error('k must be at least 1.');
  if (k > data.length) throw new Error('k cannot exceed the number of data points.');

  const dims = data[0]?.length ?? 0;
  if (dims === 0) throw new Error('Data points must have at least one dimension.');

  let centroids = initCentroidsKMeansPlusPlus(data, k);
  let assignments: number[] = new Array(data.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    const newAssignments = data.map((point) => {
      let minDist = Infinity;
      let label = 0;
      centroids.forEach((centroid, ci) => {
        const dist = euclideanDistance(point, centroid);
        if (dist < minDist) {
          minDist = dist;
          label = ci;
        }
      });
      return label;
    });

    const newCentroids = recomputeCentroids(data, newAssignments, k, dims);

    assignments = newAssignments;
    if (centroidsEqual(centroids, newCentroids)) {
      centroids = newCentroids;
      break;
    }
    centroids = newCentroids;
  }

  const inertia = computeInertia(data, assignments, centroids);
  const silhouetteScore = computeSilhouetteScore(data, assignments, k);

  return { k, assignments, centroids, inertia, silhouetteScore };
}

/**
 * Run k-means for k = 2 … maxK and return inertia values (index 0 → k=2).
 * Used for elbow-method charts.
 */
export function findOptimalK(data: number[][], maxK = 8): number[] {
  if (data.length < 2) return [];

  const upperK = Math.min(maxK, data.length);
  const inertias: number[] = [];

  for (let k = 2; k <= upperK; k++) {
    const result = kMeans(data, k, 100);
    inertias.push(result.inertia);
  }

  return inertias;
}

/** Min-max normalize each column to [0, 1]. Constant columns become 0. */
export function normalizeCols(data: number[][]): number[][] {
  if (data.length === 0) return [];

  const cols = data[0]?.length ?? 0;
  const mins = new Array(cols).fill(Infinity);
  const maxs = new Array(cols).fill(-Infinity);

  for (const row of data) {
    for (let c = 0; c < cols; c++) {
      const v = row[c] ?? 0;
      if (v < mins[c]!) mins[c] = v;
      if (v > maxs[c]!) maxs[c] = v;
    }
  }

  return data.map((row) =>
    row.map((v, c) => {
      const min = mins[c] ?? 0;
      const max = maxs[c] ?? 0;
      const range = max - min;
      return range === 0 ? 0 : ((v ?? 0) - min) / range;
    })
  );
}
