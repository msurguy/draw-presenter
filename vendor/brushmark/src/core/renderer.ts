import * as brush from "p5.brush/standalone";
import type { StrokeSpec } from "../types";
import type { ResolvedBrush } from "./brushes";
import { paintStroke } from "./brushes";

const MAX_DEVICE_DIM = 4096;

export interface ArtLayer {
  /** Layer art snapshot, device px, same origin as the overlay */
  canvas: HTMLCanvasElement;
  layer: number;
}

export interface RenderJob {
  strokes: StrokeSpec[];
  resolved: ResolvedBrush;
  /** Content size in CSS px (the overlay canvas size) */
  widthCss: number;
  heightCss: number;
  dpr: number;
  seed: number;
}

/**
 * The single shared WebGL2 surface p5.brush paints on. Annotations render
 * here one at a time (synchronously) and the result is copied out to cheap
 * per-annotation 2D canvases, so the page never holds more than one GL
 * context regardless of how many annotations exist.
 */
class SharedGLRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private contextLost = false;

  private ensureCanvas(wDev: number, hDev: number): HTMLCanvasElement {
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.width = Math.min(MAX_DEVICE_DIM, Math.max(wDev, 512));
      this.canvas.height = Math.min(MAX_DEVICE_DIM, Math.max(hDev, 512));
      this.canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        this.contextLost = true;
      });
      this.canvas.addEventListener("webglcontextrestored", () => {
        this.contextLost = false;
      });
      brush.load(this.canvas);
      return this.canvas;
    }
    if (this.canvas.width < wDev || this.canvas.height < hDev) {
      this.canvas.width = Math.min(MAX_DEVICE_DIM, Math.max(this.canvas.width, wDev));
      this.canvas.height = Math.min(MAX_DEVICE_DIM, Math.max(this.canvas.height, hDev));
      brush.load(this.canvas);
    }
    return this.canvas;
  }

  get lost(): boolean {
    return this.contextLost;
  }

  /**
   * Render all strokes of a job, one snapshot per layer (layers may overlap
   * each other, e.g. crossed-off diagonals, so they are masked separately).
   */
  render(job: RenderJob): ArtLayer[] {
    let dpr = job.dpr;
    let wDev = Math.ceil(job.widthCss * dpr);
    let hDev = Math.ceil(job.heightCss * dpr);
    if (wDev > MAX_DEVICE_DIM || hDev > MAX_DEVICE_DIM) {
      // Soften resolution instead of breaking for huge annotations.
      const shrink = MAX_DEVICE_DIM / Math.max(wDev, hDev);
      dpr *= shrink;
      wDev = Math.ceil(job.widthCss * dpr);
      hDev = Math.ceil(job.heightCss * dpr);
    }
    const glCanvas = this.ensureCanvas(wDev, hDev);
    // brush.load() is required after any resize; it re-reads canvas dims.
    brush.load(glCanvas);

    const layerIds = [...new Set(job.strokes.map((s) => s.layer))].sort((a, b) => a - b);
    const out: ArtLayer[] = [];
    const paper = choosePaper(job);

    for (const layerId of layerIds) {
      brush.seed(job.seed + layerId * 101);
      brush.noiseSeed(job.seed + layerId * 101);
      // p5.brush's pigment mixing needs opaque paper to blend against —
      // clear to solid paper (white for dark inks, black for light inks), then
      // key the paper out in the snapshot below.
      brush.clear(paper.value, paper.value, paper.value);
      brush.push();
      // Origin is centered: shift to the top-left, then scale so annotation
      // coords (CSS px) land on device px. Brush stamp sizes follow the matrix.
      brush.translate(-glCanvas.width / 2, -glCanvas.height / 2);
      brush.scale(dpr);
      try {
        for (const stroke of job.strokes) {
          if (stroke.layer !== layerId) continue;
          paintStroke(stroke, job.resolved);
        }
      } finally {
        brush.pop();
      }
      brush.render();

      const art = document.createElement("canvas");
      art.width = Math.ceil(job.widthCss * job.dpr);
      art.height = Math.ceil(job.heightCss * job.dpr);
      const ctx = art.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        // (Stretches back up if resolution was softened for huge annotations.)
        ctx.drawImage(glCanvas, 0, 0, wDev, hDev, 0, 0, art.width, art.height);
        keyOutPaper(ctx, art.width, art.height, paper.value, paper.contrast);
      }
      out.push({ canvas: art, layer: layerId });
    }

    return out;
  }
}

export interface Paper {
  /** Paper gray level the strokes are painted on: 255 (white) or 0 (black). */
  value: 0 | 255;
  /** How far the ink can move a channel away from the paper (1–255). */
  contrast: number;
}

let colorProbe: CanvasRenderingContext2D | null = null;

/** Any CSS color → [r, g, b] (0–255), or null when it cannot be parsed. */
export function parseCssColor(css: string): [number, number, number] | null {
  const hex = css.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  try {
    if (!colorProbe) colorProbe = document.createElement("canvas").getContext("2d");
    if (!colorProbe) return null;
    colorProbe.fillStyle = "#000";
    colorProbe.fillStyle = css;
    const m = String(colorProbe.fillStyle).match(/^#([0-9a-f]{6})/i);
    if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
    const rgb = String(colorProbe.fillStyle).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgb) return [+rgb[1], +rgb[2], +rgb[3]];
  } catch {
    /* no DOM */
  }
  return null;
}

/**
 * Pick the paper that contrasts most with the inks a job will lay down. Paint
 * is recovered by keying the paper out, so a light ink on white paper (or a
 * dark one on black) would vanish; the chosen paper's contrast also
 * normalizes the recovered alpha so full coverage is fully opaque for any
 * ink color, not just black.
 */
export function choosePaper(job: RenderJob): Paper {
  const inks: string[] = [job.resolved.color];
  for (const s of job.strokes) {
    if (s.kind === "wash" && job.resolved.fill) inks.push(job.resolved.fill.color);
    if (s.kind === "hatch" && job.resolved.hatch && job.resolved.hatch.color) inks.push(job.resolved.hatch.color);
  }
  let onWhite = 255;
  let onBlack = 255;
  for (const css of new Set(inks)) {
    const rgb = parseCssColor(css);
    if (!rgb) continue;
    onWhite = Math.min(onWhite, 255 - Math.min(rgb[0], rgb[1], rgb[2]));
    onBlack = Math.min(onBlack, Math.max(rgb[0], rgb[1], rgb[2]));
  }
  return onWhite >= onBlack
    ? { value: 255, contrast: Math.max(1, onWhite) }
    : { value: 0, contrast: Math.max(1, onBlack) };
}

/**
 * Convert paint-on-paper into true transparency: unpainted paper becomes
 * alpha 0, pigment keeps its hue with alpha equal to its ink density — how far
 * the pixel's most-changed channel moved away from the paper, scaled by the
 * ink's own achievable contrast so a fully covered pixel is fully opaque.
 * Colors are then un-composited against the paper:
 *   c_ink = paper + (c - paper) * 255 / a.
 * Runs once per art snapshot, never per animation frame.
 */
function keyOutPaper(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  paper: 0 | 255 = 255,
  contrast = 255,
): void {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const norm = 255 / Math.max(1, contrast);
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const raw = paper === 255 ? 255 - Math.min(r, g, b) : Math.max(r, g, b);
    if (raw === 0) {
      d[i + 3] = 0;
      continue;
    }
    const a = Math.min(255, Math.round(raw * norm));
    const k = 255 / a;
    d[i] = Math.max(0, Math.min(255, Math.round(paper + (r - paper) * k)));
    d[i + 1] = Math.max(0, Math.min(255, Math.round(paper + (g - paper) * k)));
    d[i + 2] = Math.max(0, Math.min(255, Math.round(paper + (b - paper) * k)));
    d[i + 3] = a;
  }
  ctx.putImageData(img, 0, 0);
}

let shared: SharedGLRenderer | null = null;

export function getRenderer(): SharedGLRenderer {
  if (!shared) shared = new SharedGLRenderer();
  return shared;
}
