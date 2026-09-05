import type { LineRect } from "../types";

export interface Overlay {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** Viewport position of the overlay's top-left at last placement */
  viewport: LineRect;
  dpr: number;
  /** Undo style mutations made to the host element */
  restore: () => void;
  /** internal: isolation bookkeeping for applyOverlayStacking */
  _isolationTouched: boolean;
}

/**
 * Create the per-annotation overlay canvas INSIDE the target element, which
 * is made position:relative (if static). Anchoring inside the element means
 * the canvas travels with the text through any reflow — content changes
 * above, column resizes, scroll containers — with no position tracking.
 */
export function createOverlay(el: HTMLElement): Overlay {
  const canvas = document.createElement("canvas");
  canvas.className = "brushmark-overlay";
  canvas.setAttribute("aria-hidden", "true");
  const style = canvas.style;
  style.position = "absolute";
  style.top = "0";
  style.left = "0";
  style.pointerEvents = "none";

  const computed = getComputedStyle(el);
  const prevPosition = el.style.position;
  const prevIsolation = el.style.isolation;
  let touchedPosition = false;

  if (!computed.position || computed.position === "static") {
    el.style.position = "relative";
    touchedPosition = true;
  }

  el.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("brushmark: 2D context unavailable");
  const overlay: Overlay = {
    canvas,
    ctx,
    viewport: { x: 0, y: 0, w: 0, h: 0 },
    dpr: 1,
    _isolationTouched: false,
    restore: () => {
      if (touchedPosition) el.style.position = prevPosition;
      if (overlay._isolationTouched) el.style.isolation = prevIsolation;
    },
  };
  return overlay;
}

/**
 * Stack the overlay under or over the element's text. `under` gives the
 * canvas z-index:-1 and the element isolation:isolate, so paint (highlight,
 * watercolor wash, hatching) sits below the glyphs but above the element's
 * own background. Safe to call again when config changes.
 */
export function applyOverlayStacking(
  overlay: Overlay,
  el: HTMLElement,
  under: boolean,
  zIndex?: number,
): void {
  const style = overlay.canvas.style;
  if (under) {
    style.zIndex = zIndex !== undefined ? String(zIndex) : "-1";
    if (getComputedStyle(el).isolation !== "isolate") {
      el.style.isolation = "isolate";
      overlay._isolationTouched = true;
    }
  } else {
    style.zIndex = zIndex !== undefined ? String(zIndex) : "";
  }
}

/**
 * Size and position the overlay so it covers `target` (viewport CSS px).
 * The offset from the canvas's natural (0,0) spot to the target is measured
 * directly, so any box model / display type of the host works.
 */
export function placeOverlay(overlay: Overlay, target: LineRect, dpr: number): void {
  const { canvas } = overlay;
  canvas.style.top = "0px";
  canvas.style.left = "0px";
  canvas.style.width = `${target.w}px`;
  canvas.style.height = `${target.h}px`;
  const origin = canvas.getBoundingClientRect();
  // VENDOR PATCH (draw-presenter): compensate for CSS transform scale on
  // ancestors (e.g. a scaled presentation stage). `target` is in viewport CSS
  // px; the canvas's CSS box lives in element-local px, which differ by the
  // accumulated ancestor scale. Measure the actual scale from the canvas's
  // own rendered size and divide it back out of every CSS-space value.
  const sx = target.w > 0 && origin.width > 0 ? origin.width / target.w : 1;
  const sy = target.h > 0 && origin.height > 0 ? origin.height / target.h : 1;
  if (Math.abs(sx - 1) > 0.001 || Math.abs(sy - 1) > 0.001) {
    canvas.style.width = `${target.w / sx}px`;
    canvas.style.height = `${target.h / sy}px`;
  }
  canvas.style.left = `${(target.x - origin.left) / sx}px`;
  canvas.style.top = `${(target.y - origin.top) / sy}px`;

  const wDev = Math.max(1, Math.ceil(target.w * dpr));
  const hDev = Math.max(1, Math.ceil(target.h * dpr));
  if (canvas.width !== wDev || canvas.height !== hDev) {
    canvas.width = wDev;
    canvas.height = hDev;
  }
  overlay.viewport = { ...target };
  overlay.dpr = dpr;
}

export function removeOverlay(overlay: Overlay): void {
  overlay.canvas.remove();
  overlay.restore();
}
