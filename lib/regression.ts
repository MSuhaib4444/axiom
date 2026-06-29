import type { RegressionResult } from '@/types/analysis';

const COEF_DECIMALS = 4;

function formatCoef(n: number): string {
  const rounded = Number(n.toFixed(COEF_DECIMALS));
  if (Object.is(rounded, -0)) return '0';
  return String(rounded);
}

function computeR2(y: number[], predictions: number[]): number {
  const n = y.length;
  if (n === 0) return 0;
  const mean = y.reduce((a, b) => a + b, 0) / n;
  const ssTot = y.reduce((s, yi) => s + (yi - mean) ** 2, 0);
  if (ssTot === 0) return 1;
  const ssRes = y.reduce((s, yi, i) => s + (yi - (predictions[i] ?? 0)) ** 2, 0);
  return 1 - ssRes / ssTot;
}

function buildVandermondeMatrix(x: number[], degree: number): number[][] {
  return x.map((xi) => {
    const row: number[] = [];
    for (let d = 0; d <= degree; d++) {
      row.push(xi ** d);
    }
    return row;
  });
}

/** Solve Ax = b via Gaussian elimination with partial pivoting */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const aug = A.map((row, i) => [...row, b[i] ?? 0]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row]![col] ?? 0) > Math.abs(aug[pivotRow]![col] ?? 0)) {
        pivotRow = row;
      }
    }
    [aug[col], aug[pivotRow]] = [aug[pivotRow]!, aug[col]!];

    const pivot = aug[col]![col] ?? 0;
    if (Math.abs(pivot) < 1e-12) {
      throw new Error('Matrix is singular — cannot fit polynomial to this data.');
    }

    for (let row = col + 1; row < n; row++) {
      const factor = (aug[row]![col] ?? 0) / pivot;
      for (let j = col; j <= n; j++) {
        aug[row]![j] = (aug[row]![j] ?? 0) - factor * (aug[col]![j] ?? 0);
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = aug[row]![n] ?? 0;
    for (let j = row + 1; j < n; j++) {
      sum -= (aug[row]![j] ?? 0) * (x[j] ?? 0);
    }
    x[row] = sum / (aug[row]![row] ?? 1);
  }
  return x;
}

function multiplyTranspose(A: number[][]): number[][] {
  const rows = A.length;
  const cols = A[0]?.length ?? 0;
  const result: number[][] = Array.from({ length: cols }, () => new Array(cols).fill(0));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let r = 0; r < rows; r++) {
        sum += (A[r]![i] ?? 0) * (A[r]![j] ?? 0);
      }
      result[i]![j] = sum;
    }
  }
  return result;
}

function multiplyTransposeVector(A: number[][], b: number[]): number[] {
  const cols = A[0]?.length ?? 0;
  const result = new Array(cols).fill(0);
  for (let i = 0; i < cols; i++) {
    let sum = 0;
    for (let r = 0; r < A.length; r++) {
      sum += (A[r]![i] ?? 0) * (b[r] ?? 0);
    }
    result[i] = sum;
  }
  return result;
}

function evaluatePolynomial(coefficients: number[], x: number): number {
  return coefficients.reduce((sum, coef, i) => sum + coef * x ** i, 0);
}

function buildPolynomialEquation(coefficients: number[]): string {
  const terms: string[] = [];
  coefficients.forEach((coef, i) => {
    if (Math.abs(coef) < 1e-12) return;
    const abs = formatCoef(Math.abs(coef));
    if (i === 0) {
      terms.push(formatCoef(coef));
    } else if (i === 1) {
      const sign = coef >= 0 ? (terms.length ? ' + ' : '') : ' - ';
      terms.push(`${sign}${abs}x`);
    } else {
      const sign = coef >= 0 ? ' + ' : ' - ';
      terms.push(`${sign}${abs}x^${i}`);
    }
  });
  return terms.length ? `y = ${terms.join('')}` : 'y = 0';
}

/**
 * Ordinary least-squares linear regression.
 */
export function linearRegression(x: number[], y: number[]): RegressionResult {
  const n = x.length;
  if (n !== y.length || n < 2) {
    throw new Error('Need at least 2 paired (x, y) values for linear regression.');
  }

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let ssXX = 0;
  let ssXY = 0;
  for (let i = 0; i < n; i++) {
    const dx = (x[i] ?? 0) - meanX;
    const dy = (y[i] ?? 0) - meanY;
    ssXX += dx * dx;
    ssXY += dx * dy;
  }

  if (ssXX === 0) {
    throw new Error('All x values are identical — cannot fit a line.');
  }

  const slope = ssXY / ssXX;
  const intercept = meanY - slope * meanX;
  const coefficients = [intercept, slope];
  const predictions = x.map((xi) => slope * xi + intercept);
  const residuals = y.map((yi, i) => yi - (predictions[i] ?? 0));
  const r2 = computeR2(y, predictions);

  const slopeStr = formatCoef(slope);
  const interceptStr = formatCoef(intercept);
  const interceptPart =
    intercept >= 0 ? ` + ${interceptStr}` : ` - ${formatCoef(Math.abs(intercept))}`;

  return {
    slope,
    intercept,
    r2,
    predictions,
    residuals,
    equation: `y = ${slopeStr}x${interceptPart}`,
    degree: 1,
    coefficients,
    xValues: [...x],
  };
}

/**
 * Polynomial regression via normal equations (degree 2 or 3 recommended).
 */
export function polynomialRegression(
  x: number[],
  y: number[],
  degree: number
): RegressionResult {
  const n = x.length;
  if (n !== y.length || n <= degree) {
    throw new Error(
      `Need more data points than polynomial degree (have ${n}, degree ${degree}).`
    );
  }
  if (degree < 1 || degree > 5) {
    throw new Error('Polynomial degree must be between 1 and 5.');
  }

  const X = buildVandermondeMatrix(x, degree);
  const XtX = multiplyTranspose(X);
  const Xty = multiplyTransposeVector(X, y);
  const coefficients = solveLinearSystem(XtX, Xty);

  const predictions = x.map((xi) => evaluatePolynomial(coefficients, xi));
  const residuals = y.map((yi, i) => yi - (predictions[i] ?? 0));
  const r2 = computeR2(y, predictions);

  return {
    slope: coefficients[1] ?? 0,
    intercept: coefficients[0] ?? 0,
    r2,
    predictions,
    residuals,
    equation: buildPolynomialEquation(coefficients),
    degree,
    coefficients,
    xValues: [...x],
  };
}

/** Apply a fitted regression model to future x values */
export function forecast(result: RegressionResult, futureX: number[]): number[] {
  if (result.coefficients && result.coefficients.length > 0) {
    return futureX.map((xi) => evaluatePolynomial(result.coefficients!, xi));
  }
  return futureX.map((xi) => result.slope * xi + result.intercept);
}
