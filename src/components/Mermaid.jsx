import React, { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useSlide } from "../deck/SlideContext.jsx";
import { tokens } from "../theme/tokens.js";

// A mermaid diagram whose blocks join the slide timeline.
//
//   <Mermaid chart={`flowchart LR\n  A[Brief] --> B[Sketch]\n  B --> C[Ship]`}
//            reveal="steps" step={1}
//            style={{ position: "absolute", left: 120, top: 300, width: 1680, height: 640 }} />
//
// reveal="steps"    one keypress per block: node i (plus every edge that is
//                   complete once it exists) reveals on `step + i`, in the
//                   order nodes are first mentioned in the chart.
// reveal="stagger"  all blocks in one step, `stagger` seconds apart.
// reveal="none"     the whole diagram at once.
//
// With `draw`, strokes dash-draw like SvgIcon and labels fade in as each block
// lands; arrowheads appear when their edge finishes. Colours must be hex —
// mermaid derives its palette from them and cannot read CSS variables.
//
// The SVG is injected via host.innerHTML (not dangerouslySetInnerHTML) so
// React re-renders never recreate the nodes GSAP is animating.

let mermaidPromise = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        suppressErrorRendering: true,
        flowchart: { htmlLabels: false, useMaxWidth: false },
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

let renderSeq = 0;

function themedChart(chart, { handDrawn, seed, fontSize, color, lineColor, fill }) {
  const init = {
    theme: "base",
    look: handDrawn ? "handDrawn" : "classic",
    handDrawnSeed: seed,
    themeVariables: {
      darkMode: true,
      background: tokens.bg,
      primaryColor: fill,
      primaryBorderColor: color,
      primaryTextColor: color,
      secondaryColor: fill,
      secondaryBorderColor: color,
      secondaryTextColor: color,
      tertiaryColor: tokens.bgDarker,
      tertiaryBorderColor: lineColor,
      tertiaryTextColor: color,
      lineColor,
      textColor: color,
      nodeTextColor: color,
      edgeLabelBackground: tokens.bg,
      clusterBkg: tokens.bgDarker,
      clusterBorder: lineColor,
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      fontSize: `${fontSize}px`,
    },
  };
  return `%%{init: ${JSON.stringify(init)}}%%\n${chart}`;
}

// ---------------------------------------------------------- SVG → groups

const SHAPE_SEL = "path, line, polyline, polygon, circle, ellipse, rect";
const isNone = (v) => !v || v === "none" || v === "transparent" || /^rgba\([^)]*,\s*0\)$/.test(v);

const newGroup = () => ({ strokes: [], fades: [], swaps: [] });

/** Sort an element's descendants into dash-drawable strokes and things that fade. */
function classify(root, g, draw) {
  for (const el of root.querySelectorAll(SHAPE_SEL)) {
    if (el.closest("marker")) continue;
    const cs = getComputedStyle(el);
    if (draw && typeof el.getTotalLength === "function" && !isNone(cs.stroke) && isNone(cs.fill)) g.strokes.push(el);
    else g.fades.push(el);
  }
  for (const el of root.querySelectorAll("text, foreignObject, image")) g.fades.push(el);
}

/** An edge with an arrowhead is drawn on a marker-less clone, then swapped for the real path. */
function addEdge(g, p, draw) {
  const hasMarker = p.hasAttribute("marker-end") || p.hasAttribute("marker-start");
  if (!draw) {
    g.fades.push(p);
    return;
  }
  if (!hasMarker) {
    g.strokes.push(p);
    return;
  }
  const clone = p.cloneNode(false);
  for (const a of ["marker-end", "marker-start", "id", "data-id", "data-points"]) clone.removeAttribute(a);
  p.parentNode.insertBefore(clone, p);
  g.strokes.push(clone);
  g.swaps.push({ from: clone, to: p });
}

const vertexId = (domId) => (domId || "").match(/^[A-Za-z]+-(.+)-\d+$/)?.[1] ?? null;

/** `L_A_B_0` (v11) / `L-A-B-0` (v10) → [indexOf(A), indexOf(B)] using the known node ids. */
function parseEndpoints(p, idIndex) {
  const raw = p.getAttribute("data-id") || p.id || "";
  const m = raw.match(/L[_-](.+)[_-]\d+$/);
  if (!m) return null;
  const mid = m[1];
  for (let i = 1; i < mid.length; i++) {
    if (mid[i] !== "_" && mid[i] !== "-") continue;
    const a = mid.slice(0, i);
    const b = mid.slice(i + 1);
    if (idIndex.has(a) && idIndex.has(b)) return [idIndex.get(a), idIndex.get(b)];
  }
  return null;
}

/** Geometric fallback: which node box is nearest to one end of the edge path. */
function nearestNode(p, atStart, nodeEls) {
  const ctm = p.getScreenCTM?.();
  if (!ctm || typeof p.getPointAtLength !== "function") return -1;
  const pt = p.getPointAtLength(atStart ? 0 : p.getTotalLength());
  const sp = new DOMPoint(pt.x, pt.y).matrixTransform(ctm);
  let best = -1;
  let bestD = Infinity;
  nodeEls.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const dx = Math.max(r.left - sp.x, 0, sp.x - r.right);
    const dy = Math.max(r.top - sp.y, 0, sp.y - r.bottom);
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** One group per node (flowchart/state family); anything else is a single group. */
function collectGroups(svg, draw) {
  const nodeEls = Array.from(svg.querySelectorAll("g.nodes > g"));
  if (!nodeEls.length) {
    const g = newGroup();
    classify(svg, g, draw);
    return [g];
  }
  const idIndex = new Map();
  nodeEls.forEach((el, i) => {
    const id = vertexId(el.id);
    if (id != null && !idIndex.has(id)) idIndex.set(id, i);
  });
  const groups = nodeEls.map(() => newGroup());
  for (const c of svg.querySelectorAll("g.clusters > g")) classify(c, groups[0], draw);
  nodeEls.forEach((el, i) => classify(el, groups[i], draw));

  const labelGroups = Array.from(svg.querySelectorAll("g.edgeLabels > g"));
  const edges = Array.from(svg.querySelectorAll("g.edgePaths > path"));
  edges.forEach((p, i) => {
    let ends = parseEndpoints(p, idIndex);
    if (!ends) ends = [nearestNode(p, true, nodeEls), nearestNode(p, false, nodeEls)];
    const at = Math.max(ends[0], ends[1]);
    const g = groups[at >= 0 ? at : groups.length - 1];
    addEdge(g, p, draw);
    const dataId = p.getAttribute("data-id");
    let label = dataId && svg.querySelector(`g.edgeLabels .label[data-id="${CSS.escape(dataId)}"]`);
    label = label ? label.closest("g.edgeLabel") || label : labelGroups[i];
    if (label) classify(label, g, false);
  });
  return groups;
}

function mergeGroups(groups) {
  const g = newGroup();
  for (const x of groups) {
    g.strokes.push(...x.strokes);
    g.fades.push(...x.fades);
    g.swaps.push(...x.swaps);
  }
  return g;
}

// ---------------------------------------------------------- timeline bits

function prime(g, lengths) {
  for (const el of g.strokes) {
    const len = el.getTotalLength();
    lengths.set(el, len);
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
  }
  if (g.fades.length) gsap.set(g.fades, { opacity: 0 });
  if (g.swaps.length) gsap.set(g.swaps.map((s) => s.to), { opacity: 0 });
}

function finish(g) {
  if (g.strokes.length) gsap.set(g.strokes, { strokeDashoffset: 0 });
  if (g.fades.length) gsap.set(g.fades, { opacity: 1 });
  if (g.swaps.length) {
    gsap.set(g.swaps.map((s) => s.to), { opacity: 1 });
    gsap.set(g.swaps.map((s) => s.from), { opacity: 0 });
  }
}

// Only tweens, never callbacks: the editor scrubs the slide timeline with
// events suppressed, so every visible state must come from a tween's ends.
function groupTimeline(g, lengths, { draw, drawDuration, ease }) {
  const tl = gsap.timeline();
  if (g.strokes.length) {
    const n = g.strokes.length;
    const each = n > 1 ? Math.min(0.06, (drawDuration * 0.5) / (n - 1)) : 0;
    tl.fromTo(
      g.strokes,
      { strokeDashoffset: (i, el) => lengths.get(el) ?? 0 },
      { strokeDashoffset: 0, duration: drawDuration, ease, stagger: each },
      0,
    );
  }
  if (g.fades.length) {
    tl.fromTo(g.fades, { opacity: 0 }, { opacity: 1, duration: draw ? 0.35 : 0.5, ease: "power1.out" }, draw ? drawDuration * 0.55 : 0);
  }
  if (g.swaps.length) {
    const end = Math.max(0, tl.duration() - 0.1);
    tl.fromTo(g.swaps.map((s) => s.to), { opacity: 0 }, { opacity: 1, duration: 0.15 }, end);
    tl.to(g.swaps.map((s) => s.from), { opacity: 0, duration: 0.15 }, end);
  }
  return tl;
}

// ---------------------------------------------------------- component

export default function Mermaid({
  chart = "",
  reveal = "steps", // steps | stagger | none
  step = 0,
  order = 0,
  delay = 0,
  draw = true,
  drawDuration = 0.8,
  stagger = 0.35,
  ease = "power2.inOut",
  handDrawn = true,
  seed = 7,
  fontSize = 28,
  color = tokens.inkBright,
  lineColor = tokens.inkDim,
  fill = tokens.surfaceHover,
  className,
  style,
  ...rest // data-* attributes (the editor's data-loc) reach the DOM
}) {
  const hostRef = useRef(null);
  const { register, requestRebuild } = useSlide();
  const [markup, setMarkup] = useState(null);
  const [error, setError] = useState(null);

  const text = themedChart(chart, { handDrawn, seed, fontSize, color, lineColor, fill });

  useLayoutEffect(() => {
    let cancelled = false;
    setError(null);
    loadMermaid()
      .then((mermaid) => mermaid.render(`mmd-${++renderSeq}`, text))
      .then(({ svg }) => {
        if (!cancelled) setMarkup(svg);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[deck] Mermaid render failed:", err);
        setMarkup(null);
        setError(err?.message || String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host || !markup) return;
    host.innerHTML = markup;
    const svg = host.querySelector("svg");
    if (!svg) return;
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.maxWidth = "none";
    svg.style.display = "block";

    const groups = collectGroups(svg, draw);
    const all = reveal === "none" ? [mergeGroups(groups)] : groups;
    const lengths = new Map();
    for (const g of all) prime(g, lengths);

    const opts = { draw, drawDuration, ease };
    const unregisters = [];
    if (reveal === "steps") {
      all.forEach((g, i) => {
        unregisters.push(
          register({
            step: step + i,
            order,
            delay,
            targets: () => [],
            custom: (tl, _targets, at) => tl.add(groupTimeline(g, lengths, opts), at),
            finalize: () => finish(g),
          }),
        );
      });
    } else {
      unregisters.push(
        register({
          step,
          order,
          delay,
          targets: () => [],
          custom: (tl, _targets, at) => {
            const sub = gsap.timeline();
            all.forEach((g, i) => sub.add(groupTimeline(g, lengths, opts), i * (reveal === "stagger" ? stagger : 0)));
            tl.add(sub, at);
          },
          finalize: () => all.forEach(finish),
        }),
      );
    }
    requestRebuild();
    return () => {
      for (const u of unregisters) u();
      host.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markup, reveal, step, order, delay, draw, drawDuration, stagger, ease]);

  return (
    <div {...rest} className={className} style={{ position: "relative", width: 960, height: 540, ...style }}>
      <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />
      {error && (
        <pre
          style={{
            position: "absolute",
            inset: 0,
            margin: 0,
            padding: 16,
            overflow: "hidden",
            fontSize: 18,
            lineHeight: 1.4,
            color: "var(--muted)",
            whiteSpace: "pre-wrap",
          }}
        >
          {`Mermaid: ${error}`}
        </pre>
      )}
    </div>
  );
}
