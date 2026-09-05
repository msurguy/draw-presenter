# brushmark

Animated, hand-painted annotations for text on the web. brushmark draws **real
brush strokes** — graphite, marker, watercolor, spray, charcoal — over ordinary
DOM text, animated with a GSAP-shaped timeline API (built-in zero-dependency
engine, or your own GSAP / Anime.js), while the text itself stays selectable,
accessible, CSS-responsive text.

It combines three engines:

- **[p5.brush](https://github.com/acamposuribe/p5.brush)** (standalone build, no
  p5.js) renders the painterly strokes on a single shared WebGL2 canvas.
- **[rough-notation](https://github.com/rough-stuff/rough-notation)**'s
  annotation model: per-line rect tracking, adjacent absolutely-positioned
  overlays, ResizeObserver-driven re-rendering.
- **Native word geometry** — per-word boxes are read straight from the
  rendered layout with a DOM Range, for word-level stagger and natural
  pressure variation.
- A **swappable animation engine** drives all timing behind one GSAP-shaped
  facade: seconds, `"power2.out"`-style eases, timelines, repeat/yoyo,
  scrubbing. Ships with a ~3 KB built-in engine; adapters for
  [GSAP](https://gsap.com) and [Anime.js](https://animejs.com) v4 are one
  import away.

## See it

Real animated brush strokes drawn over live DOM text (the text stays selectable
and responsive — these are just the painted overlays revealing in):

<table>
  <tr>
    <td align="center">
      <img src="./assets/underline.gif" alt="Animated underline stroke" width="400" /><br />
      <sub><code>type: "underline"</code></sub>
    </td>
    <td align="center">
      <img src="./assets/highlight.gif" alt="Animated marker highlight" width="400" /><br />
      <sub><code>type: "highlight"</code> · marker</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="./assets/circle.gif" alt="Animated hand-drawn circle" width="400" /><br />
      <sub><code>type: "circle"</code> · <code>iterations: 2</code></sub>
    </td>
    <td align="center">
      <img src="./assets/contour.gif" alt="Animated hand-drawn contour hull" width="400" /><br />
      <sub><code>type: "contour"</code></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="./assets/watercolor.gif" alt="Animated watercolor highlight wash" width="400" /><br />
      <sub><code>highlightStyle: "watercolor"</code></sub>
    </td>
    <td align="center">
      <img src="./assets/word-stagger.gif" alt="Underline revealing word by word" width="400" /><br />
      <sub><code>stagger: { by: "word" }</code></sub>
    </td>
  </tr>
</table>

The live demo has a **Recipes** section pairing every effect with the exact,
copy-pasteable `annotate()` call that produced it — see [Demos](#demos).

## Install

```bash
npm i brushmark            # zero animation dependencies (built-in engine)
npm i brushmark gsap       # if you want GSAP driving the timelines
npm i brushmark animejs    # if you want Anime.js v4
```

`gsap` and `animejs` are optional peers — install one only if you opt into
that engine. `react` is an optional peer for the `brushmark/react` entry.

## Animation engines

By default brushmark animates with its built-in engine: no dependencies, exact
scrubbing, repeat/yoyo, the common GSAP ease names (`power1–4`, `sine`,
`expo`, `circ`, `back`, `elastic`, `bounce`, plus custom functions). To hand
timing to a real animation library instead:

```ts
import { setAnimationEngine } from "brushmark";

// GSAP — annotation timelines become REAL gsap.core.Timeline instances:
import { gsapEngine } from "brushmark/gsap";
setAnimationEngine(gsapEngine);

// or Anime.js v4:
import { animeEngine } from "brushmark/anime";
setAnimationEngine(animeEngine);
```

The engine is captured when an annotation is created, so call
`setAnimationEngine()` before `annotate()`. Adapters are separate entry
points: whichever you don't import costs zero bytes. The config format
(seconds, ease strings, `repeat`/`yoyo`, `timelineVars`) is identical across
engines; engine-specific `timelineVars` keys (like `scrollTrigger`) only take
effect on their engine.

## Quick start (vanilla)

```ts
import { annotate } from "brushmark";

const a = annotate(document.querySelector("#phrase"), {
  type: "highlight",                       // or underline | box | circle | contour |
                                           // strike-through | crossed-off | bracket
  brush: { name: "marker", color: "#f2c94c" },
  duration: 1.2,
  ease: "power2.out",
});
await a.show();       // paints in
await a.hide();       // un-draws (reverse) — also 'fade' | 'instant'
a.remove();           // cleanup: overlay, observers, tweens
```

### Sequencing

```ts
import { annotate, annotationGroup } from "brushmark";

const group = annotationGroup([a1, a2, a3], { overlap: 0.15 });
group.show();                    // plays children one after another
group.timeline.progress(0.5);    // or scrub the master timeline
```

### Adopting the timeline (ScrollTrigger etc.)

Every annotation owns a paused timeline (`BrushTimeline`). On the gsap engine
it is a **real `gsap.core.Timeline`**, so all GSAP interop works natively:

```ts
import { setAnimationEngine } from "brushmark";
import { gsapEngine } from "brushmark/gsap";
setAnimationEngine(gsapEngine);

const a = annotate(el, { type: "underline", timelineVars: {
  scrollTrigger: { trigger: el, scrub: true },   // register ScrollTrigger yourself
}});
a.prepare(); // build without playing — timeline gets its real duration

// or nest it into your own timeline:
master.add(a.timeline.paused(false), "+=0.2");
```

If you previously typed callbacks as `(tl: gsap.core.Timeline) => void`,
switch to the exported `BrushTimeline` type (or cast — on the gsap engine the
object really is a gsap timeline).

## React

```tsx
import { BrushAnnotation, BrushAnnotationGroup, useBrushAnnotation } from "brushmark/react";

<BrushAnnotation type="circle" brush={{ name: "2B", color: "#c93030" }} show={visible}>
  important words
</BrushAnnotation>

<BrushAnnotationGroup overlap={0.1}>
  ...children sequence themselves in render order...
</BrushAnnotationGroup>

const { ref, show, hide, annotation } = useBrushAnnotation<HTMLSpanElement>({
  type: "underline",
  brush: { name: "pen" },
});
```

`onTimeline={(tl) => ...}` hands you the annotation's timeline for
`useGSAP`-style composition (add it to your timelines; don't kill it — the
component owns its lifecycle).

## Options

```ts
annotate(el, {
  type: "underline",
  brush: {
    name: "2B",            // listBrushes(): pen, rotring, 2B, HB, 2H, cpencil,
                           // pastel, crayon, charcoal, spray, marker, + custom
    color: "#c93030",
    weight: 1.5,           // strokeWeight multiplier; 0 = fill/hatch only, no outline
    scaleWithFont: true,   // weight follows the element's font size (default)
    pressure: [1.2, 0.8],  // constant | [start, end] | (t) => number
    wiggle: 1,             // hand-tremor wobble
    field: "waves",        // p5.brush vector field distortion
    fill: { color, opacity, bleed, texture, border },   // watercolor (closed shapes)
    hatch: { distance: 4, angle: -41, rand: 0.1 },      // hatching (closed shapes)
  },
  padding: 4,              // number | [v,h] | [t,r,b,l]
  multiline: true,         // annotate each wrapped line (default)

  // animation (GSAP conventions, seconds — same on every engine)
  animate: true,
  duration: 0.8,
  delay: 0,
  ease: "power2.out",      // GSAP-style ease string or (t) => number
  direction: "ltr",        // 'rtl' | 'center-out'
  stagger: { by: "word" }, // 'line' | 'word' | 'stroke'; each / overlap
  iterations: 2,           // extra jittered passes, rough-notation style
  repeat: -1, yoyo: true,  // loop
  timelineVars: { ... },   // merged into the engine's timeline vars
  seed: 42,                // deterministic art (defaults to a stable hash)
  onResize: "snap",        // 'snap' keeps progress across reflows | 'replay'

  // type-specific
  highlightStyle: "marker",            // or 'watercolor'
  brackets: ["left", "right"],
  contour: { inflate: 6, roundness: 0.8, irregularity: 1, singleLine: "auto" },
});
```

Custom brushes pass straight through to p5.brush:

```ts
import { registerBrush, listBrushes } from "brushmark";
registerBrush("my-ink", { type: "custom", weight: 0.9, vibration: 0.14, /* … */ });
```

## How it works

- **One WebGL context total.** Every annotation's finished art is painted once
  on a shared off-DOM WebGL2 canvas, keyed from its white paper background to
  true transparency, and snapshotted to a cheap per-annotation 2D canvas.
- **Reveal is a pure function of progress.** Each frame, the overlay composites
  the pre-rendered art through a dash-offset mask that grows along the same
  polyline the brush painted (sweep/fade for watercolor and hatch). That's why
  scrubbing, `reverse()`, `repeat`, `timeScale` and ScrollTrigger `scrub` all
  work exactly.
- **Overlays are anchored inside the annotated element.** The element is made
  `position: relative` and the canvas lives inside it, so strokes travel with
  the text through *any* reflow — content changes elsewhere on the page,
  column resizes, scroll containers, transformed ancestors — with zero
  position-tracking JavaScript. Highlights sit under the glyphs (but above the
  element's own background) via a negative z-index child + `isolation`.
- **Responsive by re-measurement.** ResizeObserver + window resize + font-load
  events re-measure the line rects (via `Range.getClientRects()`, overlays
  excluded); if the element-relative geometry changed, brushmark rebuilds with
  the same seed, re-paints, and snaps the timeline back to its progress —
  mid-animation reflows continue seamlessly.
- **Word geometry from the rendered layout.** Per-word x/width inside each
  measured line comes from `Range.getClientRects()` on the words themselves —
  layout reads only, no DOM writes, so no forced reflow. Kerning,
  letter-spacing, `text-transform`, nested markup and hyphenation are all
  reflected exactly; if the words can't be grouped one row per measured line
  (e.g. `multiline: false` while the text wraps), brushmark silently falls
  back to line-level animation.

## Caveats

- The annotated element gains `position: relative` (if static) and a child
  `<canvas class="brushmark-overlay">`; both are restored/removed by
  `remove()`. If the element itself has `overflow: hidden/auto`, strokes that
  extend past its box (padding, contour inflation) will be clipped.
- Painted colors are extracted from a white-paper render; very light strokes
  on dark backgrounds will look like real paint would on dark paper — dim.
- `prefers-reduced-motion` renders the final state instantly.

## Demos

```bash
npm run dev
# → /vanilla/index.html  (recipes: code + live preview, types, brush gallery,
#                         contour, animation lab, responsive, sequencing/scrub,
#                         watercolor, stress test;
#                         engine switcher: ?engine=builtin|gsap|anime)
# → /react/index.html    (components, hooks, groups, timeline adoption; StrictMode)
```

The **Recipes** section on the vanilla page pairs each effect with the exact
`annotate()` call that paints it — copy the snippet, drop in your own element.

The README GIFs above are generated from those same recipes by
`scripts/capture.mjs` (requires the dev server running plus `ffmpeg` and a
dev-only `playwright` install):

```bash
npm run dev &                                   # serve the capture page
BASE=http://localhost:5173 node scripts/capture.mjs
```

## License

MIT. Bundles p5.brush (MIT). Optional engine peers: GSAP (Webflow license —
see gsap.com/licensing) and Anime.js (MIT).
