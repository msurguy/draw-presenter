import type { LineRect, Padding } from "../types";

export interface ResolvedPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function resolvePadding(padding: Padding | undefined, fallback = 4): ResolvedPadding {
  if (padding === undefined) {
    return { top: fallback, right: fallback, bottom: fallback, left: fallback };
  }
  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  if (padding.length === 2) {
    const [v, h] = padding;
    return { top: v, right: h, bottom: v, left: h };
  }
  const [top, right, bottom, left] = padding;
  return { top, right, bottom, left };
}

/**
 * Measure the target's per-line rects in viewport CSS px.
 * Uses a Range so block elements also report one rect per wrapped line.
 */
export function measureLineRects(el: HTMLElement, multiline: boolean): LineRect[] {
  if (!multiline) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? [{ x: r.left, y: r.top, w: r.width, h: r.height }] : [];
  }
  const range = document.createRange();
  range.selectNodeContents(el);
  const raw = Array.from(range.getClientRects()).filter((r) => r.width > 1 && r.height > 1);
  range.detach();
  if (raw.length === 0) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? [{ x: r.left, y: r.top, w: r.width, h: r.height }] : [];
  }

  // Merge fragments that sit on the same visual line (nested inline elements
  // produce several rects per line): >50% vertical overlap → same line.
  const sorted = raw
    .map((r) => ({ x: r.left, y: r.top, w: r.width, h: r.height }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: LineRect[] = [];
  for (const r of sorted) {
    const last = lines[lines.length - 1];
    if (last) {
      const overlap = Math.min(last.y + last.h, r.y + r.h) - Math.max(last.y, r.y);
      if (overlap > 0.5 * Math.min(last.h, r.h)) {
        const x1 = Math.min(last.x, r.x);
        const y1 = Math.min(last.y, r.y);
        const x2 = Math.max(last.x + last.w, r.x + r.w);
        const y2 = Math.max(last.y + last.h, r.y + r.h);
        last.x = x1;
        last.y = y1;
        last.w = x2 - x1;
        last.h = y2 - y1;
        continue;
      }
    }
    lines.push({ ...r });
  }
  return lines;
}

export function unionRect(rects: LineRect[]): LineRect {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const r of rects) {
    x1 = Math.min(x1, r.x);
    y1 = Math.min(y1, r.y);
    x2 = Math.max(x2, r.x + r.w);
    y2 = Math.max(y2, r.y + r.h);
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

export function padRect(r: LineRect, p: ResolvedPadding): LineRect {
  return {
    x: r.x - p.left,
    y: r.y - p.top,
    w: r.w + p.left + p.right,
    h: r.h + p.top + p.bottom,
  };
}

export function rectsEqual(a: LineRect[], b: LineRect[], epsilon = 0.5): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      Math.abs(a[i].x - b[i].x) > epsilon ||
      Math.abs(a[i].y - b[i].y) > epsilon ||
      Math.abs(a[i].w - b[i].w) > epsilon ||
      Math.abs(a[i].h - b[i].h) > epsilon
    ) {
      return false;
    }
  }
  return true;
}
