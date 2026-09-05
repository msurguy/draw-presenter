import type { BrushPoint } from "../types";

/** Deterministic PRNG (mulberry32). */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash for default seeds. */
export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Smooth seeded 1D value noise in [-1, 1]. `x` is in arbitrary units;
 * features are ~1 unit wide.
 */
export function createValueNoise(seed: number): (x: number) => number {
  const rng = createRng(seed);
  const grid: number[] = [];
  for (let i = 0; i < 256; i++) grid.push(rng() * 2 - 1);
  return (x: number) => {
    const xf = Math.floor(x);
    const t = x - xf;
    const s = t * t * (3 - 2 * t);
    const a = grid[((xf % 256) + 256) % 256];
    const b = grid[(((xf + 1) % 256) + 256) % 256];
    return a + (b - a) * s;
  };
}

export function polylineLength(points: BrushPoint[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return len;
}

/** Resample a polyline to roughly uniform `spacing`, keeping endpoints. */
export function resample(points: BrushPoint[], spacing: number): BrushPoint[] {
  if (points.length < 2) return points.slice();
  const total = polylineLength(points);
  const n = Math.max(2, Math.round(total / spacing) + 1);
  const step = total / (n - 1);
  const out: BrushPoint[] = [[points[0][0], points[0][1], points[0][2]]];
  let segIdx = 0;
  let segStartDist = 0;
  let segLen = Math.hypot(points[1][0] - points[0][0], points[1][1] - points[0][1]);
  for (let i = 1; i < n - 1; i++) {
    const target = i * step;
    while (segStartDist + segLen < target && segIdx < points.length - 2) {
      segStartDist += segLen;
      segIdx++;
      segLen = Math.hypot(
        points[segIdx + 1][0] - points[segIdx][0],
        points[segIdx + 1][1] - points[segIdx][1],
      );
    }
    const t = segLen > 0 ? (target - segStartDist) / segLen : 0;
    const a = points[segIdx];
    const b = points[segIdx + 1];
    const pa = a[2] ?? 1;
    const pb = b[2] ?? 1;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, pa + (pb - pa) * t]);
  }
  const last = points[points.length - 1];
  out.push([last[0], last[1], last[2]]);
  return out;
}

/**
 * Offset each point perpendicular to the local direction by smooth seeded
 * noise. `amplitude` px, `frequency` = features per 100px of arc length.
 */
export function jitterPerpendicular(
  points: BrushPoint[],
  amplitude: number,
  seed: number,
  frequency = 1.4,
): BrushPoint[] {
  if (amplitude <= 0 || points.length < 2) return points;
  const noise = createValueNoise(seed);
  const out: BrushPoint[] = [];
  let dist = 0;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) {
      dist += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    }
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    const off = noise((dist / 100) * frequency) * amplitude;
    out.push([
      points[i][0] + (-dy / len) * off,
      points[i][1] + (dx / len) * off,
      points[i][2],
    ]);
  }
  return out;
}

/** One pass of Chaikin corner cutting. */
export function chaikin(points: BrushPoint[], closed: boolean): BrushPoint[] {
  if (points.length < 3) return points.slice();
  const out: BrushPoint[] = [];
  const n = points.length;
  const limit = closed ? n : n - 1;
  if (!closed) out.push(points[0]);
  for (let i = 0; i < limit; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const pa = a[2] ?? 1;
    const pb = b[2] ?? 1;
    out.push(
      [a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25, pa * 0.75 + pb * 0.25],
      [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75, pa * 0.25 + pb * 0.75],
    );
  }
  if (!closed) out.push(points[n - 1]);
  return out;
}

/** Points of an ellipse, slightly overshooting a full turn so ends overlap. */
export function ellipsePoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
  irregularity = 1,
  turns = 1.06,
  startAngle = -Math.PI / 3,
): BrushPoint[] {
  const noise = createValueNoise(seed);
  const circumference = Math.PI * (rx + ry);
  const n = Math.max(24, Math.round(circumference / 8));
  const out: BrushPoint[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const theta = startAngle + t * turns * Math.PI * 2;
    const wobble = 1 + noise(t * 5) * 0.035 * irregularity;
    out.push([
      cx + Math.cos(theta) * rx * wobble,
      cy + Math.sin(theta) * ry * wobble,
      1,
    ]);
  }
  return out;
}

/** Apply a pressure profile fn(t 0..1) to points by arc length. */
export function applyPressure(
  points: BrushPoint[],
  profile: (t: number) => number,
): BrushPoint[] {
  const total = polylineLength(points);
  if (total === 0) return points;
  let dist = 0;
  return points.map((p, i) => {
    if (i > 0) {
      dist += Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]);
    }
    const base = p[2] ?? 1;
    return [p[0], p[1], Math.max(0.05, base * profile(dist / total))] as BrushPoint;
  });
}
