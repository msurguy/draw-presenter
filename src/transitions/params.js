// Declarative description of each transition kind's `params`, used by the
// visual editor's Slide panel to render controls and by docs. Keep in sync
// with domTransitions.js / shaderTransitions.js.
//
// Field: { key, label, type: "number" | "select" | "color", def, step, min,
//          max, options, hint }

const DIRS = ["left", "right", "up", "down"];
const point = [
  { key: "x", label: "Center X", type: "number", def: 0.5, step: 0.05, min: 0, max: 1, hint: "0 = left edge, 1 = right edge" },
  { key: "y", label: "Center Y", type: "number", def: 0.5, step: 0.05, min: 0, max: 1, hint: "0 = top edge, 1 = bottom edge" },
];

export const TRANSITION_GROUPS = [
  { label: "DOM", kinds: ["none", "fade", "slide", "wipe", "zoom"] },
  {
    label: "Shader (WebGPU)",
    kinds: [
      "dissolve-shader",
      "sweep-shader",
      "ink-shader",
      "burn-shader",
      "iris-shader",
      "ripple-shader",
      "blinds-shader",
      "mosaic-shader",
      "glitch-shader",
      "light-leak-shader",
    ],
  },
  {
    label: "Generative",
    kinds: ["shatter-shader", "flow-shader", "mandala-shader", "halftone-shader", "hatch-shader"],
  },
];

export const TRANSITION_PARAMS = {
  none: [],
  fade: [],
  zoom: [],
  slide: [{ key: "direction", label: "Direction", type: "select", options: DIRS, def: "left", hint: "incoming enters from the opposite edge" }],
  wipe: [{ key: "direction", label: "Direction", type: "select", options: DIRS, def: "left", hint: "edge the reveal starts from" }],

  "dissolve-shader": [
    { key: "intensity", label: "Intensity", type: "number", def: 0.75, step: 0.05, min: 0, max: 1 },
    { key: "scale", label: "Grain scale", type: "number", def: 110, step: 10, min: 10 },
    { key: "color", label: "Grain color", type: "color", def: "#f0efec" },
  ],
  "sweep-shader": [
    { key: "direction", label: "Direction", type: "select", options: DIRS, def: "left", hint: "edge the wipe starts from" },
    { key: "width", label: "Bar width", type: "number", def: 0.06, step: 0.01, min: 0.01, max: 0.5 },
    { key: "color", label: "Glow color", type: "color", def: "#ffcc33" },
  ],
  "ink-shader": [
    ...point,
    { key: "scale", label: "Blot detail", type: "number", def: 3, step: 0.5, min: 0.5, max: 12 },
    { key: "color", label: "Ink color", type: "color", def: "#111111" },
  ],
  "burn-shader": [
    { key: "direction", label: "Direction", type: "select", options: [...DIRS, "diagonal"], def: "left", hint: "edge the burn starts from" },
    { key: "scale", label: "Edge detail", type: "number", def: 4, step: 0.5, min: 0.5, max: 12 },
    { key: "color", label: "Ember color", type: "color", def: "#ffcc33" },
  ],
  "iris-shader": [
    ...point,
    { key: "width", label: "Ring width", type: "number", def: 0.05, step: 0.01, min: 0.01, max: 0.4 },
    { key: "color", label: "Ring color", type: "color", def: "#ffcc33" },
  ],
  "ripple-shader": [
    ...point,
    { key: "rings", label: "Ring density", type: "number", def: 14, step: 1, min: 2, max: 60 },
    { key: "intensity", label: "Intensity", type: "number", def: 0.9, step: 0.1, min: 0, max: 2 },
    { key: "color", label: "Ripple color", type: "color", def: "#8fb6e8" },
  ],
  "blinds-shader": [
    { key: "direction", label: "Slats", type: "select", options: ["horizontal", "vertical"], def: "horizontal" },
    { key: "count", label: "Slat count", type: "number", def: 8, step: 1, min: 1, max: 64 },
    { key: "stagger", label: "Stagger", type: "number", def: 0.35, step: 0.05, min: 0, max: 0.9, hint: "0 = all slats move together" },
    { key: "color", label: "Slat color", type: "color", def: "#202020" },
  ],
  "mosaic-shader": [
    { key: "size", label: "Tiles across", type: "number", def: 16, step: 1, min: 2, max: 96 },
    { key: "color", label: "Tile color", type: "color", def: "#1c76e1" },
  ],
  "glitch-shader": [
    { key: "intensity", label: "Intensity", type: "number", def: 0.8, step: 0.1, min: 0, max: 1 },
    { key: "bands", label: "Bands", type: "number", def: 24, step: 1, min: 2, max: 120 },
    { key: "color", label: "Accent color", type: "color", def: "#ffcc33" },
  ],
  "light-leak-shader": [
    { key: "intensity", label: "Intensity", type: "number", def: 0.8, step: 0.1, min: 0, max: 2 },
    { key: "color", label: "Leak color", type: "color", def: "#ffcc33" },
  ],

  "shatter-shader": [
    { key: "cells", label: "Cells across", type: "number", def: 7, step: 1, min: 2, max: 40 },
    { key: "tint", label: "Glass tint", type: "number", def: 0.5, step: 0.1, min: 0, max: 1, hint: "0 = dark shards, 1 = full stained glass" },
    { key: "seed", label: "Seed", type: "number", def: 3.1, step: 0.1 },
    { key: "color", label: "Seam color", type: "color", def: "#ffcc33" },
  ],
  "flow-shader": [
    { key: "direction", label: "Direction", type: "select", options: [...DIRS, "diagonal"], def: "left", hint: "edge the smoke comes from" },
    { key: "turbulence", label: "Turbulence", type: "number", def: 1, step: 0.25, min: 0, max: 4 },
    { key: "color", label: "Smoke color", type: "color", def: "#8fb6e8" },
  ],
  "mandala-shader": [
    ...point,
    { key: "segments", label: "Segments", type: "number", def: 8, step: 1, min: 3, max: 24 },
    { key: "rings", label: "Rings", type: "number", def: 5, step: 1, min: 1, max: 16 },
    { key: "color", label: "Disk color", type: "color", def: "#202020" },
    { key: "lineColor", label: "Line color", type: "color", def: "#ffcc33" },
  ],
  "halftone-shader": [
    { key: "direction", label: "Direction", type: "select", options: [...DIRS, "diagonal"], def: "left", hint: "edge the raster grows from" },
    { key: "pitch", label: "Dots across", type: "number", def: 28, step: 2, min: 4, max: 120 },
    { key: "angle", label: "Screen angle (°)", type: "number", def: 15, step: 5 },
    { key: "color", label: "Ink color", type: "color", def: "#ffcc33" },
  ],
  "hatch-shader": [
    { key: "spacing", label: "Lines per height", type: "number", def: 36, step: 2, min: 4, max: 160 },
    { key: "angle1", label: "Angle A (°)", type: "number", def: 35, step: 5 },
    { key: "angle2", label: "Angle B (°)", type: "number", def: -50, step: 5 },
    { key: "weight", label: "Pen weight", type: "number", def: 0.28, step: 0.02, min: 0.05, max: 1, hint: "line width as a fraction of spacing" },
    { key: "wobble", label: "Wobble", type: "number", def: 1, step: 0.25, min: 0, max: 4 },
    { key: "color", label: "Ink color", type: "color", def: "#f0efec" },
  ],
};

export function transitionParamFields(kind) {
  return TRANSITION_PARAMS[kind] || [];
}

/** Drop params that the given kind does not understand. */
export function pruneParams(kind, params) {
  if (!params || typeof params !== "object") return undefined;
  const fields = new Map(transitionParamFields(kind).map((f) => [f.key, f]));
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    const f = fields.get(k);
    if (!f) continue;
    if (f.type === "select" && !f.options.includes(v)) continue;
    if (f.type === "number" && typeof v !== "number") continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}
