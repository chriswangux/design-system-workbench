/**
 * Bezier Curve Fitting
 *
 * Given a set of (x, y) points, finds the cubic bezier control points
 * [P1x, P1y, P2x, P2y] that best fit the data. The bezier curve goes
 * from (0, 0) to (1, 1), matching the convention used by the design
 * system workbench for easing/mapping curves.
 *
 * Uses Nelder-Mead simplex optimization to minimize sum of squared errors.
 */

// ---- Types ----

export interface BezierFitResult {
  /** Cubic bezier control points: [P1x, P1y, P2x, P2y] */
  controlPoints: [number, number, number, number];
  /** How well the bezier fits the data (0-1, where 1 is perfect) */
  fitQuality: number;
}

// ---- Bezier Evaluation ----

/**
 * Evaluate the X coordinate of a cubic bezier at parameter u.
 * P0 = (0, 0), P3 = (1, 1), control points P1 = (x1, _), P2 = (x2, _)
 */
function bezierX(x1: number, x2: number, u: number): number {
  const inv = 1 - u;
  return 3 * inv * inv * u * x1 + 3 * inv * u * u * x2 + u * u * u;
}

/**
 * Evaluate the Y coordinate of a cubic bezier at parameter u.
 * P0 = (0, 0), P3 = (1, 1), control points P1 = (_, y1), P2 = (_, y2)
 */
function bezierY(y1: number, y2: number, u: number): number {
  const inv = 1 - u;
  return 3 * inv * inv * u * y1 + 3 * inv * u * u * y2 + u * u * u;
}

/**
 * Derivative of bezier X with respect to u.
 */
function bezierXDerivative(x1: number, x2: number, u: number): number {
  const inv = 1 - u;
  return 3 * inv * inv * x1 + 6 * inv * u * (x2 - x1) + 3 * u * u * (1 - x2);
}

/**
 * Given an X value, find the parameter u such that bezierX(u) = x.
 * Uses Newton-Raphson with bisection fallback.
 */
function solveBezierForX(x1: number, x2: number, targetX: number): number {
  if (targetX <= 0) return 0;
  if (targetX >= 1) return 1;

  // Newton-Raphson
  let u = targetX;
  for (let i = 0; i < 8; i++) {
    const x = bezierX(x1, x2, u) - targetX;
    if (Math.abs(x) < 1e-7) return u;
    const dx = bezierXDerivative(x1, x2, u);
    if (Math.abs(dx) < 1e-8) break;
    u -= x / dx;
    u = Math.max(0, Math.min(1, u));
  }

  // Bisection fallback
  let lo = 0;
  let hi = 1;
  u = targetX;
  for (let i = 0; i < 20; i++) {
    const x = bezierX(x1, x2, u);
    if (Math.abs(x - targetX) < 1e-7) return u;
    if (targetX > x) lo = u;
    else hi = u;
    u = (lo + hi) / 2;
  }

  return u;
}

/**
 * Evaluate the bezier curve at a given X coordinate.
 * Returns the corresponding Y value.
 */
function evaluateBezierAtX(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number,
): number {
  const u = solveBezierForX(x1, x2, x);
  return bezierY(y1, y2, u);
}

// ---- Cost Function ----

/**
 * Compute sum of squared errors between data points and bezier curve.
 */
function computeSSE(
  points: Array<{ x: number; y: number }>,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  let sse = 0;
  for (const p of points) {
    const predicted = evaluateBezierAtX(x1, y1, x2, y2, p.x);
    const error = p.y - predicted;
    sse += error * error;
  }
  return sse;
}

// ---- Nelder-Mead Simplex Optimization ----

type Vec4 = [number, number, number, number];

function nelderMead(
  costFn: (params: Vec4) => number,
  initial: Vec4,
  options: {
    maxIterations?: number;
    tolerance?: number;
    initialStep?: number;
  } = {},
): Vec4 {
  const maxIter = options.maxIterations ?? 500;
  const tol = options.tolerance ?? 1e-8;
  const step = options.initialStep ?? 0.2;

  const n = 4; // dimensions

  // Initialize simplex: n+1 vertices
  const simplex: Array<{ point: Vec4; cost: number }> = [];

  const initialCost = costFn(initial);
  simplex.push({ point: [...initial], cost: initialCost });

  for (let i = 0; i < n; i++) {
    const p: Vec4 = [...initial];
    p[i] += step;
    simplex.push({ point: p, cost: costFn(p) });
  }

  const alpha = 1; // reflection
  const gamma = 2; // expansion
  const rho = 0.5; // contraction
  const sigma = 0.5; // shrink

  for (let iter = 0; iter < maxIter; iter++) {
    // Sort by cost
    simplex.sort((a, b) => a.cost - b.cost);

    // Check convergence: spread of costs
    const costSpread = simplex[n].cost - simplex[0].cost;
    if (costSpread < tol) break;

    // Centroid of all points except the worst
    const centroid: Vec4 = [0, 0, 0, 0];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        centroid[j] += simplex[i].point[j];
      }
    }
    for (let j = 0; j < n; j++) {
      centroid[j] /= n;
    }

    const worst = simplex[n];
    const secondWorst = simplex[n - 1];
    const best = simplex[0];

    // Reflection
    const reflected: Vec4 = [0, 0, 0, 0];
    for (let j = 0; j < n; j++) {
      reflected[j] = centroid[j] + alpha * (centroid[j] - worst.point[j]);
    }
    const reflectedCost = costFn(reflected);

    if (reflectedCost < secondWorst.cost && reflectedCost >= best.cost) {
      simplex[n] = { point: reflected, cost: reflectedCost };
      continue;
    }

    if (reflectedCost < best.cost) {
      // Expansion
      const expanded: Vec4 = [0, 0, 0, 0];
      for (let j = 0; j < n; j++) {
        expanded[j] = centroid[j] + gamma * (reflected[j] - centroid[j]);
      }
      const expandedCost = costFn(expanded);
      if (expandedCost < reflectedCost) {
        simplex[n] = { point: expanded, cost: expandedCost };
      } else {
        simplex[n] = { point: reflected, cost: reflectedCost };
      }
      continue;
    }

    // Contraction
    const contracted: Vec4 = [0, 0, 0, 0];
    for (let j = 0; j < n; j++) {
      contracted[j] = centroid[j] + rho * (worst.point[j] - centroid[j]);
    }
    const contractedCost = costFn(contracted);

    if (contractedCost < worst.cost) {
      simplex[n] = { point: contracted, cost: contractedCost };
      continue;
    }

    // Shrink: move all points toward the best
    for (let i = 1; i <= n; i++) {
      for (let j = 0; j < n; j++) {
        simplex[i].point[j] = best.point[j] + sigma * (simplex[i].point[j] - best.point[j]);
      }
      simplex[i].cost = costFn(simplex[i].point);
    }
  }

  simplex.sort((a, b) => a.cost - b.cost);
  return simplex[0].point;
}

// ---- Normalization ----

function normalizePoints(
  points: Array<{ x: number; y: number }>,
): {
  normalized: Array<{ x: number; y: number }>;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
} {
  if (points.length === 0) {
    return { normalized: [], xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
  }

  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;

  for (const p of points) {
    if (p.x < xMin) xMin = p.x;
    if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }

  const xRange = xMax - xMin;
  const yRange = yMax - yMin;

  const normalized = points.map((p) => ({
    x: xRange > 0 ? (p.x - xMin) / xRange : 0.5,
    y: yRange > 0 ? (p.y - yMin) / yRange : 0.5,
  }));

  return { normalized, xMin, xMax, yMin, yMax };
}

// ---- R-squared ----

function rSquared(points: Array<{ x: number; y: number }>, predicted: number[]): number {
  if (points.length === 0) return 0;

  const meanY = points.reduce((s, p) => s + p.y, 0) / points.length;
  let ssTot = 0;
  let ssRes = 0;

  for (let i = 0; i < points.length; i++) {
    ssTot += (points[i].y - meanY) ** 2;
    ssRes += (points[i].y - predicted[i]) ** 2;
  }

  if (ssTot === 0) return 1;
  return Math.max(0, 1 - ssRes / ssTot);
}

// ---- Main Export ----

/**
 * Fit a cubic bezier curve to a set of (x, y) data points.
 *
 * The bezier goes from (0, 0) to (1, 1), parameterized by control points
 * P1 = (x1, y1) and P2 = (x2, y2). The function finds the [x1, y1, x2, y2]
 * that minimizes the sum of squared errors between the data points and the curve.
 *
 * Points are normalized to [0, 1] range before fitting.
 *
 * Algorithm: Nelder-Mead simplex optimization.
 */
export function fitBezierCurve(
  points: Array<{ x: number; y: number }>,
): BezierFitResult {
  // Handle edge cases
  if (points.length === 0) {
    return {
      controlPoints: [0.33, 0.33, 0.67, 0.67],
      fitQuality: 0,
    };
  }

  if (points.length === 1) {
    // Single point: create a curve that passes through it
    return {
      controlPoints: [0.33, 0.33, 0.67, 0.67],
      fitQuality: 0.5,
    };
  }

  // Normalize points to [0, 1]
  const { normalized } = normalizePoints(points);

  // Check for linear data first
  const isLinear = checkLinear(normalized);
  if (isLinear) {
    return {
      controlPoints: [0.33, 0.33, 0.67, 0.67],
      fitQuality: 1,
    };
  }

  // Initial guess: start with a reasonable curve shape
  // Analyze the data to get a better initial guess
  const initialGuess = estimateInitialGuess(normalized);

  // Optimize using Nelder-Mead
  const costFn = (params: Vec4): number => {
    const [x1, y1, x2, y2] = params;
    // Penalize control points outside reasonable range
    let penalty = 0;
    if (x1 < -0.5 || x1 > 1.5) penalty += (Math.abs(x1) - 0.5) ** 2;
    if (x2 < -0.5 || x2 > 1.5) penalty += (Math.abs(x2) - 0.5) ** 2;
    if (y1 < -0.5 || y1 > 1.5) penalty += (Math.abs(y1) - 0.5) ** 2;
    if (y2 < -0.5 || y2 > 1.5) penalty += (Math.abs(y2) - 0.5) ** 2;
    return computeSSE(normalized, x1, y1, x2, y2) + penalty * 10;
  };

  const optimized = nelderMead(costFn, initialGuess, {
    maxIterations: 800,
    tolerance: 1e-10,
    initialStep: 0.15,
  });

  // Clamp control points to reasonable range
  const controlPoints: [number, number, number, number] = [
    clamp(round(optimized[0], 4), -0.2, 1.2),
    clamp(round(optimized[1], 4), -0.2, 1.2),
    clamp(round(optimized[2], 4), -0.2, 1.2),
    clamp(round(optimized[3], 4), -0.2, 1.2),
  ];

  // Compute fit quality as R-squared
  const predicted = normalized.map((p) =>
    evaluateBezierAtX(controlPoints[0], controlPoints[1], controlPoints[2], controlPoints[3], p.x)
  );
  const fitQuality = rSquared(normalized, predicted);

  return {
    controlPoints,
    fitQuality: round(fitQuality, 4),
  };
}

/**
 * Check if the data is approximately linear.
 */
function checkLinear(points: Array<{ x: number; y: number }>): boolean {
  if (points.length < 3) return true;

  let maxDeviation = 0;
  for (const p of points) {
    // Distance from the line y = x
    const deviation = Math.abs(p.y - p.x);
    if (deviation > maxDeviation) maxDeviation = deviation;
  }

  return maxDeviation < 0.05;
}

/**
 * Estimate a reasonable initial guess based on the data shape.
 */
function estimateInitialGuess(points: Array<{ x: number; y: number }>): Vec4 {
  if (points.length < 3) {
    return [0.33, 0.33, 0.67, 0.67];
  }

  // Sample the curve at roughly 1/3 and 2/3 points
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const n = sorted.length;
  const p1 = sorted[Math.floor(n * 0.33)] ?? sorted[0];
  const p2 = sorted[Math.floor(n * 0.67)] ?? sorted[n - 1];

  // Use these as rough estimates for control point Y values
  // The X coordinates of control points determine curvature distribution
  return [
    0.33,
    clamp(p1.y * 1.5, -0.2, 1.2), // exaggerate slightly for better initial coverage
    0.67,
    clamp(p2.y * 1.5 - 0.5 * p2.y, -0.2, 1.2),
  ];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
