// Deck palette: dark paper, bright ink, one gold accent. Mirrored as CSS
// variables in styles/global.css — keep the two in sync.
export const tokens = {
  bg: "#2d2d2d", // default slide background
  bgDarker: "#202020", // letterbox / deep panels
  panel: "#1e1e1e", // footer-dark panels
  surfaceHover: "#363636",
  inkBright: "#f0efec", // bright strokes / primary line work
  inkDim: "#cccccb", // dim strokes
  line: "#c5c5c5", // SVG line art
  accent: "#ffcc33", // gold — use sparingly, one element per slide
  brand: "#1c76e1", // brand blue
  brand2: "#8fb6e8", // secondary blue
  text: "#f3f3f3", // titles / body on dark
  muted: "#9ba3ad", // muted text on dark
  inkLight: "#1f2933", // body text on light backgrounds
};

// Handy for Three.js: tokens as hex numbers.
export const hex = Object.fromEntries(
  Object.entries(tokens).map(([k, v]) => [k, parseInt(v.slice(1), 16)]),
);
