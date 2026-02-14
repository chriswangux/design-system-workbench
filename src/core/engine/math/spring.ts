import type { SpringConfig, CubicBezierValue } from '@/core/tokens/types';

// Spring physics solver using velocity Verlet integration
// Used by: Easing Curve Editor (spring mode), Transition Choreography

export interface SpringState {
  position: number;
  velocity: number;
}

export interface SpringKeyframe {
  time: number;     // ms
  position: number; // 0-1 (0 = start, 1 = target)
  velocity: number;
}

/**
 * Simulate a spring animation from position 0 to target 1.
 * Returns keyframes at each millisecond until the spring settles.
 */
export function simulateSpring(
  config: SpringConfig,
  dt = 1, // timestep in ms
  settleThreshold = 0.001,
  maxDuration = 5000,
): SpringKeyframe[] {
  const { stiffness, damping, mass } = config;
  const dtSeconds = dt / 1000;

  const keyframes: SpringKeyframe[] = [];
  let position = 0;
  let velocity = 0;
  let time = 0;

  while (time < maxDuration) {
    keyframes.push({ time, position, velocity });

    // Spring force: F = -k * (x - target) - c * v
    const springForce = -stiffness * (position - 1);
    const dampingForce = -damping * velocity;
    const acceleration = (springForce + dampingForce) / mass;

    // Velocity Verlet integration
    const newVelocity = velocity + acceleration * dtSeconds;
    const newPosition = position + newVelocity * dtSeconds;

    // Check if settled
    if (
      time > 100 &&
      Math.abs(newPosition - 1) < settleThreshold &&
      Math.abs(newVelocity) < settleThreshold
    ) {
      keyframes.push({ time: time + dt, position: 1, velocity: 0 });
      break;
    }

    position = newPosition;
    velocity = newVelocity;
    time += dt;
  }

  return keyframes;
}

/**
 * Get the total duration of a spring animation (time until settled).
 */
export function springDuration(config: SpringConfig): number {
  const keyframes = simulateSpring(config);
  return keyframes[keyframes.length - 1].time;
}

/**
 * Approximate a spring curve as a cubic bezier (best fit).
 * This is inherently lossy but useful for CSS output.
 */
export function springToBezier(config: SpringConfig): CubicBezierValue {
  const keyframes = simulateSpring(config, 1);
  const duration = keyframes[keyframes.length - 1].time;

  if (duration === 0) return [0, 0, 1, 1];

  // Normalize keyframes to [0,1] time range
  const normalized = keyframes.map((kf) => ({
    t: kf.time / duration,
    y: kf.position,
  }));

  // Simple heuristic: find the point at ~33% and ~66% of duration
  const t1 = 0.33;
  const t2 = 0.66;
  const y1 = interpolateKeyframes(normalized, t1);
  const y2 = interpolateKeyframes(normalized, t2);

  // Map to bezier control points (rough approximation)
  return [
    Math.max(0, Math.min(1, t1)),
    Math.max(0, Math.min(2, y1 * 1.5)),
    Math.max(0, Math.min(1, t2)),
    Math.max(0, Math.min(1, y2)),
  ];
}

function interpolateKeyframes(
  keyframes: Array<{ t: number; y: number }>,
  targetT: number,
): number {
  for (let i = 1; i < keyframes.length; i++) {
    if (keyframes[i].t >= targetT) {
      const prev = keyframes[i - 1];
      const next = keyframes[i];
      const ratio = (targetT - prev.t) / (next.t - prev.t);
      return prev.y + (next.y - prev.y) * ratio;
    }
  }
  return keyframes[keyframes.length - 1].y;
}

/**
 * Evaluate a spring at a specific time (ms).
 */
export function evaluateSpringAt(config: SpringConfig, timeMs: number): number {
  const keyframes = simulateSpring(config, 1, 0.001, timeMs + 100);
  const target = keyframes.find((kf) => kf.time >= timeMs);
  return target?.position ?? 1;
}

/**
 * Convert a spring simulation to a CSS `linear()` easing function string.
 * Unlike cubic-bezier(), linear() can represent full spring oscillation
 * by encoding the simulation as a series of sample points.
 *
 * Output: "linear(0, 0.05 4%, 0.18 8%, 0.42 12%, 0.77 16%, 1.15 20%, ...)"
 */
export function springToLinear(config: SpringConfig, samples = 80): string {
  const keyframes = simulateSpring(config, 1);
  const duration = keyframes[keyframes.length - 1].time;

  if (duration === 0 || keyframes.length < 2) return 'linear(0, 1)';

  // Sample the spring at evenly spaced time points
  const points: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const timeMs = t * duration;

    // Find the position at this time via interpolation
    let position = 1;
    for (let j = 1; j < keyframes.length; j++) {
      if (keyframes[j].time >= timeMs) {
        const prev = keyframes[j - 1];
        const next = keyframes[j];
        const ratio = (timeMs - prev.time) / (next.time - prev.time);
        position = prev.position + (next.position - prev.position) * ratio;
        break;
      }
    }

    // Round to 4 decimal places for compact output
    const rounded = Math.round(position * 10000) / 10000;

    if (i === 0) {
      points.push(String(rounded));
    } else if (i === samples) {
      points.push(String(rounded));
    } else {
      // Include percentage for each point
      const pct = Math.round(t * 10000) / 100;
      points.push(`${rounded} ${pct}%`);
    }
  }

  return `linear(${points.join(', ')})`;
}

// Common spring presets
export const SPRING_PRESETS: Record<string, SpringConfig> = {
  gentle: { stiffness: 120, damping: 14, mass: 1 },
  default: { stiffness: 200, damping: 20, mass: 1 },
  snappy: { stiffness: 300, damping: 24, mass: 1 },
  bouncy: { stiffness: 400, damping: 10, mass: 1 },
  stiff: { stiffness: 500, damping: 30, mass: 1 },
  slow: { stiffness: 100, damping: 20, mass: 2 },
};
