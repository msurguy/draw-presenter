// Generates the deck's algorithmic line art (public/assets/images/*.svg):
// plotter-style sketches — concentric infill, Delaunay mesh, ray hatching,
// Hilbert curve, Truchet tiles, superformula — as stroke-only SVGs in the
// deck palette. Deterministic (seeded), so re-running reproduces the files.
// Usage: npm run art
import fs from "node:fs";
import path from "node:path";
import { Delaunay } from "d3-delaunay";

const OUT = path.resolve("public/assets/images");
const INK = "#f0efec";
const DIM = "#cccccb";
const GOLD = "#ffcc33";
const BLUE = "#8fb6e8";

// Small seeded PRNG (mulberry32) so every run draws the same picture.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Number(n.toFixed(1));
const poly = (pts, attrs = "", close = true) =>
  `<path d="M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}${close ? "Z" : ""}"${attrs ? " " + attrs : ""}/>`;
const svg = (w, h, body, sw = 1.6) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">\n${body}\n</svg>\n`;

// ---- Concentric infill: a lobed boundary filled with inset rings -----------
function concentric(size = 600, seed = 7) {
  const r = rng(seed);
  const cx = size / 2, cy = size / 2;
  const lobes = 4 + Math.floor(r() * 3);
  const base = size * 0.4;
  const amp = 0.12 + r() * 0.12;
  const phase = r() * Math.PI * 2;
  const boundary = [];
  for (let a = 0; a < Math.PI * 2 - 1e-6; a += 0.06) {
    const rr = base * (1 + amp * Math.sin(lobes * a + phase));
    boundary.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const rings = 22;
  const out = [];
  for (let k = 0; k < rings; k++) {
    const s = 1 - k / rings;
    const pts = boundary.map(([x, y]) => [cx + (x - cx) * s, cy + (y - cy) * s]);
    const last = k === rings - 1;
    out.push(poly(pts, last ? `stroke="${GOLD}" stroke-width="2.4"` : k % 2 ? `stroke="${DIM}" stroke-opacity="0.7"` : ""));
  }
  return svg(size, size, out.join("\n"));
}

// ---- Delaunay triangulation of scattered points --------------------------
function delaunay(w = 600, h = 600, n = 90, seed = 11) {
  const r = rng(seed);
  const m = Math.min(w, h) * 0.08;
  const pts = [];
  for (let i = 0; i < n; i++) pts.push([m + r() * (w - 2 * m), m + r() * (h - 2 * m)]);
  const d = Delaunay.from(pts);
  const { halfedges, triangles, points } = d;
  const edges = [];
  for (let e = 0; e < halfedges.length; e++) {
    const j = halfedges[e];
    if (j !== -1 && j < e) continue; // shared edge already drawn
    const a = triangles[e], b = triangles[e % 3 === 2 ? e - 2 : e + 1];
    edges.push(`M${f(points[2 * a])} ${f(points[2 * a + 1])}L${f(points[2 * b])} ${f(points[2 * b + 1])}`);
  }
  const dots = pts.map(([x, y], i) => `<circle cx="${f(x)}" cy="${f(y)}" r="${i % 9 === 0 ? 4.5 : 3}"${i % 9 === 0 ? ` fill="${GOLD}" stroke="none"` : ` fill="${DIM}" stroke="none"`}/>`);
  return svg(w, h, `<path d="${edges.join("")}" stroke-opacity="0.85"/>\n${dots.join("\n")}`, 1.4);
}

// ---- Ray hatching: a Lambert-shaded sphere as two families of hatch lines --
function rayHatching(size = 600, seed = 3) {
  const r = rng(seed);
  const cx = size / 2, cy = size / 2, R = size * 0.36;
  let L = [-0.5 - r() * 0.3, -0.6 - r() * 0.3, 0.7];
  const ln = Math.hypot(...L);
  L = L.map((v) => v / ln);
  const shadeAt = (x, y) => {
    const dx = (x - cx) / R, dy = (y - cy) / R;
    const d2 = dx * dx + dy * dy;
    if (d2 > 1) return -1;
    const nz = Math.sqrt(1 - d2);
    return Math.max(0, dx * L[0] + dy * L[1] + nz * L[2]);
  };
  const passes = [
    { ang: (35 * Math.PI) / 180, thr: 0.72, color: INK },
    { ang: (-35 * Math.PI) / 180, thr: 0.4, color: DIM },
  ];
  const spacing = size * 0.02, step = size * 0.006;
  const out = [];
  for (const pass of passes) {
    const c = Math.cos(pass.ang), s = Math.sin(pass.ang);
    const segs = [];
    for (let t = -size * 0.5; t <= size * 0.5; t += spacing) {
      let run = null;
      for (let u = -size * 0.5; u <= size * 0.5; u += step) {
        const x = cx + c * u - s * t, y = cy + s * u + c * t;
        const sh = shadeAt(x, y);
        const on = sh >= 0 && sh < pass.thr;
        if (on && !run) run = [x, y];
        else if (!on && run) {
          segs.push(`M${f(run[0])} ${f(run[1])}L${f(x)} ${f(y)}`);
          run = null;
        }
      }
    }
    out.push(`<path d="${segs.join("")}" stroke="${pass.color}"/>`);
  }
  out.push(`<circle cx="${cx}" cy="${cy}" r="${f(R)}" stroke="${GOLD}" stroke-opacity="0.6"/>`);
  return svg(size, size, out.join("\n"), 1.5);
}

// ---- Hilbert curve ---------------------------------------------------------
function hilbert(size = 600, order = 6) {
  const n = 1 << order;
  const d2xy = (d) => {
    let x = 0, y = 0;
    for (let s = 1; s < n; s *= 2) {
      const rx = 1 & (d / 2), ry = 1 & (d ^ rx);
      if (ry === 0) {
        if (rx === 1) { x = s - 1 - x; y = s - 1 - y; }
        [x, y] = [y, x];
      }
      x += s * rx; y += s * ry; d = Math.floor(d / 4);
    }
    return [x, y];
  };
  const m = size * 0.08, cell = (size - 2 * m) / (n - 1);
  const pts = [];
  for (let d = 0; d < n * n; d++) { const [x, y] = d2xy(d); pts.push([m + x * cell, m + y * cell]); }
  const head = pts.slice(-Math.floor(pts.length * 0.06));
  return svg(size, size, poly(pts, "", false) + "\n" + poly(head, `stroke="${GOLD}" stroke-width="2.6"`, false), 1.4);
}

// ---- Truchet tiles: quarter arcs on a grid ---------------------------------
function truchet(size = 600, grid = 12, seed = 5) {
  const r = rng(seed);
  const m = size * 0.08, c = (size - 2 * m) / grid, h = c / 2;
  const arcs = [];
  for (let j = 0; j < grid; j++) {
    for (let i = 0; i < grid; i++) {
      const x = m + i * c, y = m + j * c;
      if (r() < 0.5) {
        arcs.push(`M${f(x + h)} ${f(y)}A${f(h)} ${f(h)} 0 0 0 ${f(x)} ${f(y + h)}`);
        arcs.push(`M${f(x + c)} ${f(y + h)}A${f(h)} ${f(h)} 0 0 0 ${f(x + h)} ${f(y + c)}`);
      } else {
        arcs.push(`M${f(x + h)} ${f(y)}A${f(h)} ${f(h)} 0 0 1 ${f(x + c)} ${f(y + h)}`);
        arcs.push(`M${f(x)} ${f(y + h)}A${f(h)} ${f(h)} 0 0 1 ${f(x + h)} ${f(y + c)}`);
      }
    }
  }
  return svg(size, size, `<path d="${arcs.join("")}"/>\n<rect x="${m}" y="${m}" width="${f(size - 2 * m)}" height="${f(size - 2 * m)}" stroke="${DIM}" stroke-opacity="0.35"/>`, 1.8);
}

// ---- Superformula: nested supershapes --------------------------------------
function superformula(size = 600, m = 7, n1 = 0.6, n2 = 3, n3 = 6) {
  const cx = size / 2, cy = size / 2;
  const superR = (t) => {
    const a = Math.pow(Math.abs(Math.cos((m * t) / 4)), n2) + Math.pow(Math.abs(Math.sin((m * t) / 4)), n3);
    return Math.pow(a, -1 / n1);
  };
  const base = [];
  let rmax = 0;
  for (let i = 0; i < 720; i++) {
    const t = (i / 720) * Math.PI * 2;
    const rr = superR(t);
    rmax = Math.max(rmax, rr);
    base.push([Math.cos(t) * rr, Math.sin(t) * rr]);
  }
  const k = (size * 0.42) / rmax;
  const out = [];
  const scales = [1, 0.86, 0.72, 0.58, 0.44, 0.3, 0.16];
  scales.forEach((s, i) => {
    const pts = base.map(([x, y]) => [cx + x * k * s, cy + y * k * s]);
    out.push(poly(pts, i === 0 ? `stroke="${GOLD}" stroke-width="2.2"` : i % 2 ? `stroke="${DIM}" stroke-opacity="0.7"` : ""));
  });
  return svg(size, size, out.join("\n"), 1.6);
}

fs.mkdirSync(OUT, { recursive: true });
const files = {
  "concentric.svg": concentric(),
  "delaunay.svg": delaunay(),
  "delaunay-wide.svg": delaunay(1600, 800, 260, 23),
  "ray-hatching.svg": rayHatching(),
  "hilbert.svg": hilbert(),
  "truchet.svg": truchet(),
  "superformula.svg": superformula(),
};
for (const [name, body] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), body);
  console.log(`${name}  ${(body.length / 1024).toFixed(1)} KB`);
}
