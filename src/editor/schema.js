import { FONTS, FONT_GROUPS } from "../hershey/fonts.js";
import { tokens } from "../theme/tokens.js";

// Per-component inspector schemas. Field: { name, label, type, options?,
// step?, min?, max?, placeholder?, def?, hint? } — `name` may be dotted (brush.color)
// to edit one key of an object-literal prop.

const toKebab = (s) => s.replace(/([A-Z])/g, "-$1").toLowerCase();

export const COLOR_TOKENS = Object.entries(tokens).map(([k, v]) => ({
  label: toKebab(k),
  value: `var(--${toKebab(k)})`,
  hex: v,
}));

export const FONT_NAMES = Object.keys(FONTS);
/** Grouped select options: [{ value, label, group }]. */
export const FONT_OPTIONS = FONT_GROUPS.flatMap((g) => g.fonts.map((f) => ({ value: f, label: f, group: g.label })));

export const APPEAR_EFFECTS = [
  "fade",
  "fade-up",
  "fade-down",
  "fade-left",
  "fade-right",
  "scale",
  "blur",
  "mask-reveal",
  "none",
];

export const BRUSHES = ["marker", "pen", "rotring", "2B", "HB", "2H", "cpencil", "pastel", "crayon", "charcoal", "spray"];

export const BRUSH_TYPES = [
  "underline",
  "highlight",
  "box",
  "circle",
  "contour",
  "strike-through",
  "crossed-off",
  "bracket",
];

/** GSAP ease names, grouped for the inspector's <optgroup> select. */
const easeGroup = (group, bases, variants = ["in", "out", "inOut"], args = "") =>
  bases.flatMap((b) => variants.map((v) => ({ value: `${b}.${v}${args}`, label: `${b}.${v}${args}`, group })));
export const EASES = [
  { value: "none", label: "none (linear)", group: "Linear" },
  ...easeGroup("Power", ["power1", "power2", "power3", "power4"]),
  ...easeGroup("Sine", ["sine"]),
  ...easeGroup("Expo", ["expo"]),
  ...easeGroup("Circ", ["circ"]),
  ...easeGroup("Back", ["back"], ["in", "out", "inOut"], "(1.7)"),
  ...easeGroup("Elastic", ["elastic"], ["out", "inOut"], "(1, 0.3)"),
  ...easeGroup("Bounce", ["bounce"], ["out", "inOut"]),
];

const num = (name, label, extra = {}) => ({ name, label, type: "number", ...extra });
const sel = (name, label, options, extra = {}) => ({ name, label, type: "select", options, ...extra });
const txt = (name, label, extra = {}) => ({ name, label, type: "text", ...extra });
const area = (name, label, extra = {}) => ({ name, label, type: "textarea", wide: true, ...extra });
const col = (name, label, extra = {}) => ({ name, label, type: "color", ...extra });
const bool = (name, label, extra = {}) => ({ name, label, type: "bool", ...extra });
const asset = (name, label, assetType) => ({ name, label, type: "asset", assetType });

const STEP_ORDER = [
  num("step", "Step", { step: 1, min: 0, def: 0 }),
  num("order", "Order", { step: 1, min: 0, def: 0 }),
  num("delay", "Delay (s)", { step: 0.1, min: 0, def: 0 }),
];

export const SCHEMAS = {
  Appear: {
    appearance: [],
    animation: [
      sel("effect", "Effect", APPEAR_EFFECTS, { def: "fade-up" }),
      ...STEP_ORDER,
      num("duration", "Duration (s)", { step: 0.1, min: 0, placeholder: "0.6" }),
      num("stagger", "Stagger (s)", { step: 0.05, min: 0, def: 0 }),
      sel("ease", "Ease", EASES, { placeholder: "power3.out", allowEmpty: true }),
    ],
  },
  HersheyText: {
    text: true,
    appearance: [
      sel("font", "Font", FONT_OPTIONS, { def: "HersheySans1" }),
      num("size", "Size", { step: 1, min: 8, def: 96 }),
      sel("align", "Align", ["left", "center", "right"], { def: "center" }),
      col("color", "Color", { def: "var(--ink-bright)" }),
      num("strokeWidth", "Stroke width", { step: 0.1, min: 0.1, def: 2.5 }),
      num("charSpacing", "Char spacing", { step: 1, def: 0 }),
      num("lineHeight", "Line height", { step: 0.05, def: 1.25 }),
    ],
    animation: [
      ...STEP_ORDER,
      sel(
        "mode",
        "Draw mode",
        [
          { value: "sequential", label: "Sequential (letter by letter)" },
          { value: "overlap", label: "Overlap (stagger)" },
        ],
        { def: "sequential" },
      ),
      num("drawDuration", "Draw (s)", { step: 0.1, min: 0, def: 1.6 }),
      num("stagger", "Stagger (s)", { step: 0.005, min: 0, def: 0.04, hint: "Overlap mode only — ignored when Draw mode is sequential" }),
      sel("ease", "Ease · whole", EASES, { def: "none" }),
      sel("charEase", "Ease · per letter", EASES, { def: "sine.inOut" }),
    ],
  },
  Img: {
    appearance: [asset("src", "Image", "image"), num("width", "Width", { step: 1, min: 1 }), num("height", "Height", { step: 1, min: 1 }), txt("alt", "Alt text")],
    animation: [],
  },
  SvgIcon: {
    appearance: [
      asset("src", "Icon", "svg"),
      num("size", "Size", { step: 1, min: 1, def: 120 }),
      col("color", "Stroke color", { allowEmpty: true }),
      num("strokeWidth", "Stroke width", { step: 0.1, min: 0.1 }),
      bool("draw", "Draw on"),
    ],
    animation: [
      ...STEP_ORDER,
      num("drawDuration", "Draw (s)", { step: 0.1, min: 0, def: 1 }),
      num("stagger", "Stagger (s)", { step: 0.01, min: 0, def: 0.08 }),
      sel("ease", "Ease", EASES, { def: "power2.inOut" }),
    ],
  },
  VideoLayer: {
    appearance: [
      asset("src", "Video", "video"),
      sel("fit", "Fit", ["cover", "contain"], { def: "cover" }),
      num("opacity", "Opacity", { step: 0.05, min: 0, max: 1, def: 1 }),
      bool("loop", "Loop", { def: true }),
      num("playbackRate", "Playback rate", { step: 0.1, min: 0.1, def: 1 }),
    ],
    animation: [],
  },
  BrushReveal: {
    appearance: [
      sel("type", "Type", BRUSH_TYPES, { def: "underline" }),
      sel("brush.name", "Brush", BRUSHES, { def: "marker" }),
      col("brush.color", "Brush color", { def: "#ffcc33", hexOnly: true }),
      num("brush.weight", "Weight", { step: 0.1, min: 0.1 }),
      bool("dim", "Spotlight (dim rest)"),
      num("dimOpacity", "Dim opacity", { step: 0.02, min: 0, max: 1, def: 0.22 }),
      sel("as", "Element", ["span", "div"], { def: "span" }),
    ],
    animation: [...STEP_ORDER, num("duration", "Duration (s)", { step: 0.1, min: 0, def: 1 }), num("hideOn", "Hide on step", { step: 1, min: 0, allowEmpty: true })],
  },
  BrushText: {
    text: true,
    appearance: [
      sel("font", "Font", FONT_OPTIONS, { def: "HersheySans1" }),
      num("size", "Size", { step: 1, min: 8, def: 120 }),
      sel("align", "Align", ["left", "center", "right"], { def: "left" }),
      sel("brush.name", "Brush", BRUSHES, { def: "marker" }),
      col("brush.color", "Brush color", { def: "#ffcc33", hexOnly: true }),
      num("brush.weight", "Weight", { step: 0.1, min: 0.1, def: 1.2 }),
      num("jitter", "Jitter", { step: 0.1, min: 0, def: 0.5 }),
      num("curvature", "Curvature", { step: 0.05, min: 0, max: 1, def: 0.3 }),
      num("charSpacing", "Char spacing", { step: 1, def: 0 }),
      num("lineHeight", "Line height", { step: 0.05, def: 1.25 }),
    ],
    animation: [...STEP_ORDER, num("duration", "Duration (s)", { step: 0.1, min: 0, def: 2.5 }), num("hideOn", "Hide on step", { step: 1, min: 0, allowEmpty: true })],
  },
  ShaderLayer: {
    appearance: [num("opacity", "Opacity", { step: 0.05, min: 0, max: 1, def: 1 }), txt("blend", "Blend mode", { placeholder: "screen" })],
    animation: [],
  },
  ThreeScene: { appearance: [col("background", "Background", { allowEmpty: true })], animation: [] },
  Mermaid: {
    appearance: [
      area("chart", "Chart (mermaid)", { rows: 8 }),
      sel("reveal", "Reveal", ["steps", "stagger", "none"], { def: "steps" }),
      bool("handDrawn", "Hand-drawn look", { def: true }),
      num("fontSize", "Font size", { step: 1, min: 8, def: 28 }),
      col("color", "Stroke / text", { def: tokens.inkBright, hexOnly: true }),
      col("lineColor", "Edge color", { def: tokens.inkDim, hexOnly: true }),
      col("fill", "Node fill", { def: tokens.surfaceHover, hexOnly: true }),
      num("seed", "Sketch seed", { step: 1, min: 0, def: 7 }),
    ],
    animation: [
      ...STEP_ORDER,
      bool("draw", "Draw strokes", { def: true }),
      num("drawDuration", "Draw (s)", { step: 0.1, min: 0, def: 0.8 }),
      num("stagger", "Stagger (s)", { step: 0.05, min: 0, def: 0.35 }),
      sel("ease", "Ease", EASES, { def: "power2.inOut" }),
    ],
  },
};

/** Common inline-style keys offered for host elements (div, p, span…). */
export const HOST_STYLE_FIELDS = [
  num("fontSize", "Font size", { step: 1, min: 1 }),
  col("color", "Color"),
  col("background", "Background"),
  num("width", "Width", { step: 1 }),
  num("height", "Height", { step: 1 }),
  num("maxWidth", "Max width", { step: 1 }),
  txt("padding", "Padding", { placeholder: "12px 24px" }),
  num("gap", "Gap", { step: 1 }),
  num("letterSpacing", "Letter spacing", { step: 0.5 }),
  sel("textAlign", "Text align", ["left", "center", "right"], { allowEmpty: true }),
  num("lineHeight", "Line height", { step: 0.05 }),
  num("opacity", "Opacity", { step: 0.05, min: 0, max: 1 }),
  num("borderRadius", "Radius", { step: 1, min: 0 }),
  sel("fontWeight", "Weight", ["300", "400", "500", "600", "700"], { allowEmpty: true }),
  sel("textTransform", "Transform", ["uppercase", "lowercase", "capitalize", "none"], { allowEmpty: true }),
];

/** Element kinds that own an entrance in the slide timeline. */
export const ANIMATED = new Set(["Appear", "HersheyText", "SvgIcon", "BrushReveal", "BrushText", "Mermaid"]);

export function schemaFor(name) {
  return SCHEMAS[name] || null;
}
