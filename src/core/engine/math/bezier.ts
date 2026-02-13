import type { BezierControlPoints } from '@/core/tokens/types';

// Cubic bezier evaluation for curve-based parameter control
// Used by: Color Lab (hue/chroma/lightness curves), Easing Curve Editor, etc.

/**
 * Evaluate a cubic bezier curve at parameter t.
 * The curve goes from (0,0) to (1,1) with control points P1(x1,y1) and P2(x2,y2).
 * Input t is the X position, output is the Y value.
 */
export function evaluateBezier(controlPoints: BezierControlPoints, t: number): number {
  const [x1, y1, x2, y2] = controlPoints;
  // For a bezier used as an easing/mapping curve, we need to find the
  // bezier parameter `u` such that bezierX(u) = t, then return bezierY(u)
  const u = solveBezierX(x1, x2, t);
  return cubicBezierY(y1, y2, u);
}

/**
 * Get the Y value of the cubic bezier at parameter u.
 * B(u) = 3(1-u)^2*u*P1 + 3(1-u)*u^2*P2 + u^3
 */
function cubicBezierY(y1: number, y2: number, u: number): number {
  const u2 = u * u;
  const u3 = u2 * u;
  const inv = 1 - u;
  const inv2 = inv * inv;
  return 3 * inv2 * u * y1 + 3 * inv * u2 * y2 + u3;
}

/**
 * Get the X value of the cubic bezier at parameter u.
 */
function cubicBezierX(x1: number, x2: number, u: number): number {
  const u2 = u * u;
  const u3 = u2 * u;
  const inv = 1 - u;
  const inv2 = inv * inv;
  return 3 * inv2 * u * x1 + 3 * inv * u2 * x2 + u3;
}

/**
 * Newton-Raphson + bisection to find u such that bezierX(u) = t.
 */
function solveBezierX(x1: number, x2: number, t: number, epsilon = 1e-6): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  // Newton-Raphson
  let u = t; // initial guess
  for (let i = 0; i < 8; i++) {
    const x = cubicBezierX(x1, x2, u) - t;
    if (Math.abs(x) < epsilon) return u;
    const dx = cubicBezierXDerivative(x1, x2, u);
    if (Math.abs(dx) < 1e-6) break;
    u -= x / dx;
  }

  // Fallback to bisection
  let lo = 0;
  let hi = 1;
  u = t;
  for (let i = 0; i < 20; i++) {
    const x = cubicBezierX(x1, x2, u);
    if (Math.abs(x - t) < epsilon) return u;
    if (t > x) lo = u;
    else hi = u;
    u = (lo + hi) / 2;
  }
  return u;
}

function cubicBezierXDerivative(x1: number, x2: number, u: number): number {
  return 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
}

/**
 * Create a bezier evaluation function from control points.
 * Returns a function that maps [0,1] -> [0,1].
 */
export function createBezierEasing(controlPoints: BezierControlPoints): (t: number) => number {
  return (t: number) => evaluateBezier(controlPoints, t);
}

/**
 * Sample a bezier curve at N evenly-spaced points for visualization.
 */
export function sampleBezierCurve(
  controlPoints: BezierControlPoints,
  samples: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    points.push({ x: t, y: evaluateBezier(controlPoints, t) });
  }
  return points;
}

// Common easing presets as bezier control points
export const BEZIER_PRESETS: Record<string, BezierControlPoints> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
  'material-standard': [0.2, 0, 0, 1],
  'material-decelerate': [0, 0, 0, 1],
  'material-accelerate': [0.3, 0, 1, 1],
};
