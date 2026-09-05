---
name: slide-author
description: Author a new slide (or edit an existing one) for draw-presenter, a React presentation system with single-stroke Hershey text, brush strokes and WGSL transitions. Use whenever the user asks to create, add, or modify a presentation slide, scene, or deck content. Covers the slide file contract, HersheyText / BrushText / BrushReveal / Appear / VideoLayer / Mermaid / ThreeScene / ShaderLayer components, transitions, build steps, assets, templates, and the WGSL snippet library.
---

# Slide Author

Each slide is ONE self-contained `.jsx` file in `src/slides/`. Slides render on a
fixed **1920×1080 stage** (author in absolute pixels; the deck scales to fit any
screen). Starter files live in `src/templates/` (see "Templates" below);
`src/templates/blank.jsx` is the minimal one. The bundled demo deck in
`src/slides/` exercises every component — the worked examples referenced below
live there.

## Checklist for a new slide

1. Create `src/slides/<NN-name>.jsx` (kebab-case, numeric prefix by convention) —
   copy the closest template from `src/templates/` and delete its `template` export.
2. Export `meta` (see contract) and a default React component.
3. Add the slide id to `src/slides/manifest.json` `order` array (position = slide order).
   A slide missing from the manifest still shows up appended at the end, with a console warning.
4. Put media files in `public/assets/{images,video,icons,models}/` and declare them
   in `meta.assets` so the admin panel (#/admin) can list and hot-swap them.
5. Verify with `npm run dev` — arrow keys navigate, F = fullscreen, A = admin.

## Slide contract

```jsx
import React from "react";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";

export const meta = {
  id: "05-my-slide",              // MUST equal the filename without .jsx
  title: "Human-readable title",  // shown in the admin panel
  background: "#202020",          // optional; defaults to var(--bg) #2d2d2d
  transition: { kind: "fade", duration: 0.8, params: {} }, // transition OUT of this slide (to the next; reversed coming back)
  assets: [                       // optional; enables admin asset swapping
    { key: "hero", path: "/assets/images/hero.svg", type: "image" }, // image|video|svg|model
  ],
};

export default function Slide({ assets }) {
  // assets = { hero: "/assets/images/hero.svg" } — always reference media via
  // assets.<key>, never hardcode paths in JSX, so admin swaps keep working.
  return <div style={{ position: "absolute", inset: 0 }}>…</div>;
}
```

## Templates (`src/templates/`)

The admin panel's **+ New slide** dialog lists every file in `src/templates/`
with a live thumbnail. A template is a normal slide module (same contract as
above, `meta.id` = filename) plus a descriptor:

```jsx
export const template = { name: "Statement", description: "One centered line", order: 1 };
```

Creating a slide copies the file to `src/slides/<id>.jsx`, rewrites
`meta.id`/`meta.title`, removes the `template` export, and copies every
`meta.assets` placeholder to `public/assets/<dir>/<id>-<key>.<ext>` (so
swapping an asset in the admin never touches the template's file). Keep
templates editor-friendly: literal props, absolute px on wrappers, no `.map()`.

Available (18): `blank`, `statement` (one centered line), `big-word` (one huge
word + caption), `section-divider` (one word + small caption), `crossed-out`
(a line draws, gets struck through, replacement appears), `brush-word`
(painted headline + pencil subtitle), `painted-list` (title + three crayon
words, one per keypress), `diagonal-list` (four numbered lines stepping down,
one per keypress), `two-column` (title, two columns, right one on keypress),
`image-sequence` (title + 3 images, one per keypress), `hero-image` (title +
one large image), `spotlight` (three dimmed exhibits, each keypress circles
one), `brush-notes` (paragraph with painted highlights, icons circled on
keypress), `diagram` (title + Mermaid flowchart, one block per keypress),
`video` (title + large video card), `fullscreen-video` (edge-to-edge loop +
lower-third caption), `shader-backdrop` (live WGSL aurora behind text),
`three-scene` (Three.js cube skinned by a WGSL texture). Add a new template by
dropping a file here — no registration needed; see `src/templates/README.md`.

## Entrance animations & build steps

The deck builds ONE paused GSAP timeline per slide. Components register
entrances into it; you never write your own timelines/RAF loops.

- `step` (default 0): fragment builds. Space/→ reveals step 1, then 2, …
  before moving to the next slide. ← always shows the previous slide fully built.
- `order` (default 0): sequencing within a step — each higher order group starts
  0.15 s later. `delay` adds seconds on top.

### `<Appear>` — wrap anything

```jsx
<Appear effect="fade-up" order={1} step={0} delay={0.2} duration={0.6}
        stagger={0.12}  /* animates direct children one-by-one */
        style={{ position: "absolute", left: 120, top: 300 }}>
  …content…
</Appear>
```

Effects: `fade` `fade-up` `fade-down` `fade-left` `fade-right` `scale` `blur`
`mask-reveal` `none`. Escape hatch: `custom={(tl, targets, at) => tl.to(...)}`.

**CRITICAL positioning rule**: GSAP transforms the Appear wrapper, so the wrapper
becomes the containing block. NEVER put `position:absolute` on a child of Appear
expecting it to anchor to the slide — put the absolute position on the
`<Appear style={…}>` itself.

### `<HersheyText>` — animated single-stroke text

```jsx
<HersheyText font="HersheyScript1" size={160} align="center"      // left|center|right
             color="var(--ink-bright)" strokeWidth={3}
             mode="sequential"                                     // sequential (default) | overlap
             drawDuration={2}                                      // sequential: TOTAL time; overlap: per glyph
             ease="none" charEase="sine.inOut"                     // whole-animation / per-letter ease
             order={0} step={0} delay={0} lineHeight={1.25} charSpacing={0}>
  Line one{"\n"}line two
</HersheyText>
```

Draw modes: `sequential` writes one glyph at a time in text order (left→right,
line by line; each letter finishes before the next starts, time split by path
length so pen speed is constant). `overlap` tweens every glyph together for
`drawDuration` seconds, offset by `stagger={0.04}` each (stagger is ignored in
sequential mode). `ease` is the pace of the whole reveal (sequential: warps the
writing sequence; overlap: the stagger distribution); `charEase` eases each
letter's own draw-on. Any GSAP ease string works: `none`, `power1-4.in/out/inOut`,
`sine.*`, `expo.*`, `circ.*`, `back.out(1.7)`, `elastic.out(1, 0.3)`, `bounce.out`.

Fonts (registry: `src/hershey/fonts.js`, 67 bundled single-line fonts grouped
in `FONT_GROUPS`; licenses in THIRD_PARTY_NOTICES.md):
- **Hershey** — `HersheySans1` (clean sans, default), `HersheySansMed`,
  `HersheySansBold`, `HersheySerifMed`, `HersheySerifMedItalic`, `HersheySerifBold`,
  `HersheySerifBoldItalic`, `HersheyScript1`, `HersheyScript1StrokeAlt`,
  `HersheyScriptMed`, `HersheyGothEnglish`, `HersheyGothGerman`, `HersheyGothItalian`,
  plus symbol/script sets (`HersheyCyrillic`, `HersheyGreek1Stroke`, `HersheyGreekMedium`,
  `HersheyJapanese`, `HersheyMathLower`, `HersheyMathUpper`, `HersheySymbolic`,
  `HersheyAstrology`, `HersheyMeteorology`, `HersheyMusic`, `HersheyMarkers`).
- **EMS** — `EMSReadability`, `EMSReadabilityItalic`, `EMSTech`, `EMSCasualHand`,
  `EMSAllure`, `EMSBird`, `EMSBirdSwashCaps`, `EMSBrush`, `EMSCapitol`,
  `EMSDecorousScript`, `EMSDelight`, `EMSDelightSwashCaps`, `EMSElfin`, `EMSFelix`,
  `EMSHerculean`, `EMSInvite`, `EMSLeague`, `EMSLittlePrincess`, `EMSMistyNight`,
  `EMSNeato`, `EMSNixish`, `EMSNixishItalic`, `EMSOsmotron`, `EMSPancakes`, `EMSPepita`,
  `EMSQwandry`, `EMSSociety`, `EMSSpaceRocks`, `EMSSwiss`.
- **Cutlings** — `CutlingsGeometric`, `CutlingsGeometricRound`, `CutlingsSingularis`,
  `CutlingsDualis`, `CutlingsPluralis`, `EMSAllureSmooth`, `EMSElfinSmooth`,
  `HersheyScript1Smooth`.
- **Relief / Shriinivas / other** — `ReliefSingleLine`, `ReliefSingleLineOrnament`,
  `ShriinivasScript`, `ShriinivasSquareItalic`, `ShriinivasSquareNormal`, `RoutedGothic`.
The SVG element sizes itself; position it with a wrapper div (plain div is fine —
HersheyText registers its own entrance, no Appear needed).

### `<VideoLayer>` — muted looping video

```jsx
<VideoLayer src={assets.loop} fit="cover" opacity={0.85} />  // fills its nearest
// positioned ancestor; plays only while the slide is active. During an outgoing
// transition it freezes on its current frame; re-entering the slide remounts it
// fresh from frame 0. Videos must be silent (element is always muted).
```

### `<Img>` and `<SvgIcon>`

```jsx
<Img src={assets.hero} x={120} y={340} width={600} />          // stage pixels
<SvgIcon src="/assets/icons/bolt.svg" size={130} draw          // draw = animate strokes on
         drawDuration={0.9} step={1} order={1} color="var(--accent)" strokeWidth={3} />
```

`SvgIcon` inlines the SVG; with `draw` every stroked shape animates like
HersheyText. Icons should be stroke-only (fill="none") line art.

### `<Mermaid>` — diagrams that build block by block

```jsx
<Mermaid
  chart={`flowchart LR
  A[Research] --> B[Sketch]
  B --> C[Ship]`}
  reveal="steps"        // steps: node i (+ edges completed by it) on step+i, in
                        //   first-mention order | stagger: all in one step,
                        //   `stagger` s apart | none: whole diagram at once
  step={1} order={0} delay={0}
  draw                  // dash-draw strokes (default); false = fade blocks in
  drawDuration={0.8} stagger={0.35} ease="power2.inOut"
  handDrawn             // rough.js sketch look (default); seed={7} fixes the wobble
  fontSize={28}
  color="#f0efec" lineColor="#cccccb" fill="#363636"   // HEX ONLY — mermaid
                        // derives its palette from them, CSS vars won't work
  style={{ position: "absolute", left: 120, top: 300, width: 1680, height: 640 }}
/>
```

Rendered with `mermaid` (lazy-loaded, code-split); the SVG scales to fit the
`style` box, so size the box and let the diagram fill it. Per-block reveals
work for the flowchart/state family (`g.nodes`/`g.edgePaths` structure); other
diagram types reveal as one block. Node order = the order ids are first
mentioned in the chart. Don't put `%%{init}%%` directives in `chart` — the
component prepends its own theme directive. Arrowheads appear when their edge
finishes drawing.

### `<BrushReveal>` — hand-painted brush strokes (brushmark)

Paints a real brush stroke (graphite, marker, watercolor, spray, charcoal…)
over, around, or under its children at its step. Works on DOM text,
HersheyText, SvgIcon, and images.

```jsx
<BrushReveal
  type="circle"            // underline | highlight | box | circle | contour |
                           // strike-through | crossed-off | bracket
  brush={{ name: "2B", color: "#c93030", weight: 1.6 }}
  // brushes: pen, rotring, 2B, HB, 2H, cpencil, pastel, crayon, charcoal, spray, marker
  duration={1} step={1} order={0} delay={0}
  options={{               // extra brushmark annotate() options:
    iterations: 2,         //   extra jittered passes (rough-notation style)
    padding: 14,           //   px around the target
    stagger: { by: "word" }, // word-by-word reveal (underline/highlight on text)
    highlightStyle: "watercolor", // wash instead of marker (type="highlight")
    contour: { inflate: 14, roundness: 0.8 },
    brackets: ["left", "right"],
    seed: 42,              //   deterministic art
  }}
  dim                      // spotlight mode: children start dimmed (dimOpacity,
                           // default 0.22) and brighten as the stroke draws
  hideOn={2}               // step at which the stroke un-paints itself (reverse)
  as="div"                 // wrapper tag, default "span" (display: inline-block)
>…children…</BrushReveal>
```

Reveal recipes that work well:
- **Emphasis on live text**: watercolor `highlight` or word-staggered `underline`
  on a key phrase inside a paragraph (wrap just the phrase, inline).
- **Annotate SVG/images**: `circle`/`contour`/`box` around an SvgIcon or Img.
- **Spotlight tour**: several `dim` BrushReveals on ascending steps — each
  keypress circles the next exhibit and brightens it (see src/slides/07-spotlight.jsx).
- **Rhetorical cross-out**: `crossed-off` on the old idea at step N, plus an
  `<Appear>` replacement at the same step (see src/slides/06-brush-notes.jsx).
- **Temporary emphasis**: `hideOn` un-draws the stroke at a later step.

Notes: strokes read best in saturated colors on the dark stage (gold #ffcc33,
red #c93030, brand blues); very light strokes render dim, like real paint on
dark paper. Don't wrap a BrushReveal inside an Appear whose transform animates
while the stroke draws. Content that loads async (HersheyText) is handled —
the annotation waits for the element to gain size.

### `<BrushText>` — the brush writes the font

Single-stroke Hershey text where a real brush retraces every pen stroke of
the glyphs in pen order — the painterly sibling of HersheyText (crisp SVG
draw-on). Use it for expressive headlines; use HersheyText for clean body
lines.

```jsx
<BrushText font="HersheyScript1" size={210} align="center"
           brush={{ name: "marker", color: "#ffcc33", weight: 0.42 }}
           duration={3.4} jitter={0.4}       // px of hand tremor
           step={0} order={0} delay={0}
           overlap={0.25}                    // 0–1 stroke overlap (looser, faster feel)
           curvature={0.3}                   // lower = sharper corners
           hideOn={2}>                       // optional un-write at a later step
  Painted by hand
</BrushText>
```

**Weight is the critical knob** — it scales with `size` (weight × size/16), so
big text needs SMALL weights: marker ≈ 0.4 at size 200, 2B/pencil ≈ 1 at size
55, charcoal ≈ 0.55 at size 110. Too heavy and letterforms blur into blobs.
Avoid near-white/gray pigments (paint is keyed from a white-paper render and
washes out) — use gold #ffcc33, brand blues, red #c93030. See
src/slides/04-brush-word.jsx for a tuned example.

### `<ThreeScene>` — imperative Three.js

```jsx
import * as THREE from "three";
<ThreeScene background="#08080c" camera={{ fov: 45, position: [2.6, 2, 3.4], lookAt: [0,0,0] }}
  setup={({ scene, camera, renderer, canvas, gpu }) => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x1c76e1 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    return {
      update(t, dt) { mesh.rotation.y = t * 0.5; },   // called every frame while active
      dispose() { geo.dispose(); mat.dispose(); },     // called on unmount
    };
  }} />
```

The component owns the renderer, sizing and the RAF loop (runs only while the
slide is active). `gpu` is the shared vgpu context (may be `null` — always
handle that with a non-WebGPU fallback). To feed a WGSL shader into a texture,
see `src/slides/13-three-scene.jsx` (offscreen canvas + `THREE.CanvasTexture`).

### `<ShaderLayer>` — fullscreen vgpu/WGSL layer

```jsx
import { myShader } from "../shaders/my-shader.wgsl.js"; // a WGSL string
<ShaderLayer shader={myShader}
             uniforms={{ params: { speed: 0.4, glow: 1 } }}   // initial uniform values
             timeUniform="params.time"                        // written every frame (seconds)
             resolution={[960, 540]} opacity={0.6} blend="screen"
             transparent={false} />                           // true = premultiplied alpha
```

Renders nothing when WebGPU is unavailable (design slides to still read without it).

## WGSL conventions (vgpu)

- Fragment shaders get an injected varying: `@location(0) uv: vec2f`, top-origin
  ((0,0) = top-left).
- Declare uniforms as a struct bound at `@group(0) @binding(0)`; address them by
  WGSL name from JS: `uniforms={{ params: { speed: 1 } }}` matches
  `var<uniform> params: Params`.
- Entry point must be `@fragment fn fs_main(...)`.
- Reusable snippets (simplex noise, hashes, worley, SDFs, stroke helpers) live
  in `src/shaders/lib/` — see "Writing shaders" below.
- Example shaders to copy: `src/shaders/dream.wgsl.js` (backdrop),
  `src/slides/13-three-scene.jsx` (texture), `src/transitions/shaders/*.wgsl.js`.

## Transitions (meta.transition)

| kind | params | notes |
|---|---|---|
| `none` | — | hard cut |
| `fade` | — | crossfade |
| `slide` | `direction: "left"\|"right"\|"up"\|"down"` | push with parallax |
| `wipe` | `direction` | clip-path reveal |
| `zoom` | — | scale + fade |
| `dissolve-shader` | `intensity` 0–1, `scale`, `color` | WGSL grain dissolve over crossfade |
| `sweep-shader` | `direction`, `width` ~0.06, `color` | glowing WGSL bar riding a wipe |
| `iris-shader` | `x`,`y` 0–1 center, `width` ~0.05, `color` | circular reveal with a glowing rim |
| `ripple-shader` | `x`,`y`, `rings`, `intensity`, `color` | circular reveal with water rings trailing the front |
| `light-leak-shader` | `intensity`, `color` | warm light-leak blobs washing over a crossfade |
| `glitch-shader` | `intensity` 0–1, `bands`, `color` | slabs/scanlines/static; slides flicker into each other |
| `ink-shader` | `x`,`y`, `scale`, `color` | ink blot floods from a point, then drains (cover-swap) |
| `burn-shader` | `direction` (+`diagonal`), `scale`, `color` ember | ember front burns to ash, ash flakes away (cover-swap) |
| `blinds-shader` | `direction` `horizontal`\|`vertical`, `count`, `stagger` 0–0.9, `color` | venetian slats close then open (cover-swap) |
| `mosaic-shader` | `size` tiles across, `color` | random tiles fill then clear (cover-swap) |
| `shatter-shader` | `cells`, `tint` 0–1, `seed`, `color` seams | Voronoi stained-glass shards fill then drop (worley) |
| `flow-shader` | `direction` (+`diagonal`), `turbulence`, `color` | curl-advected smoke rolls across (simplex noise) |
| `mandala-shader` | `x`,`y`, `segments`, `rings`, `color` disk, `lineColor` | kaleidoscopic line-art disk blooms (kaleidoscope + SDFs) |
| `halftone-shader` | `direction`, `pitch`, `angle` °, `color` | print dot screen grows to solid (simplex noise) |
| `hatch-shader` | `spacing`, `angle1`/`angle2` °, `weight`, `wobble`, `color` | plotter crosshatch draws in, floods, un-hatches (stroke helper) |

Semantics are Keynote-style: slide N's transition plays when moving forward
N→N+1 (the incoming slide enters on top). Moving back N+1→N plays slide N's
transition in reverse (the slide being left un-enters). The last slide's
transition is never used.

`duration` is seconds (default 0.7). Colors accept `#hex` or `var(--token)`.
Shader kinds degrade automatically to their DOM base when WebGPU is missing;
cover-swap kinds (which hide the stage at the midpoint and hard-swap slides)
fall back to a crossfade. Param schema lives in `src/transitions/params.js`
and drives the editor's Slide panel — add an entry there for any new kind.

### Writing shaders (snippet library)

A shader is a JS module exporting one WGSL string. Reusable pieces live in
`src/shaders/lib/` as **chunks** and are glued together with `compose()`,
which emits every chunk once (dependencies first) and appends your body:

```js
// src/shaders/ripples.wgsl.js
import { compose, snoise2, random2, strokeEdge } from "./lib/index.js";

export const ripplesShader = compose(snoise2, random2, strokeEdge, /* wgsl */ `
struct Params { time: f32, aspect: f32 }
@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let q = vec2f(uv.x * params.aspect, uv.y);
  let n = snoise2(q * 4.0 + params.time * 0.2);
  let line = strokeEdge(fract(n * 6.0), 0.5, 0.08, 0.03);
  return vec4f(vec3f(0.94, 0.94, 0.93) * line, 1.0);
}
`);
```

Available chunks: `snoise2`, `snoise3` (simplex noise, MIT), `random2`,
`random22` (sine-free hashes, MIT), `worley22` (F1/F2 cellular), `rotate2d`,
`saturate`, `map`, `TAU`, `strokeEdge` (draw a level set as a line),
`kaleidoscope_full`, `starSDF`/`flowerSDF`/`gearSDF`/`raysSDF` (0.5 level set =
outline), and the transition helpers `coverPhases`, `along`, `maxDist`,
`endsFade`, `ease`. Add your own with `chunk(name, deps, wgsl)` in a new
`lib/*.js` file and re-export it from `lib/index.js` — never put `@fragment`
in a chunk (the checker treats any string with `@fragment` as an entry).

Transition overlays follow the same contract with a `Params` struct that
starts with `progress: f32` (0→1) and usually `aspect`; they output
**premultiplied** color (`vec4f(col * alpha, alpha)`). Two families:
*veils* decorate a DOM crossfade/clip; *cover-swaps* fully cover the stage at
`progress = 0.5` (use `coverPhases(p)`: `.x` = cover 0..1, `.y` = clear 0..1)
while the DOM hard-swaps slides underneath. To add a kind: drop the module in
`src/transitions/shaders/`, register it in `src/transitions/shaderTransitions.js`
(copy an existing entry — `shaderOverlay(stageEl, shader, uniforms)` +
`coverSwap(args, overlay)`), add its params to `src/transitions/params.js`,
and document it in the table above.

Run `npm run check:shaders` to validate every shader offline (vgpu + naga)
before opening the deck. Shaders must degrade gracefully: ShaderLayer renders
nothing without WebGPU and shader transitions fall back to their DOM base.

## Palette (CSS vars)

`--bg` #2d2d2d · `--bg-darker` #202020 · `--panel` #1e1e1e · `--ink-bright` #f0efec ·
`--ink-dim` #cccccb · `--line` #c5c5c5 · `--accent` #ffcc33 (gold — sparingly, ~one
element per slide) · `--brand` #1c76e1 · `--brand-2` #8fb6e8 · `--text` #f3f3f3 ·
`--muted` #9ba3ad. JS mirror: `import { tokens, hex } from "../theme/tokens.js"`
(`hex.brand` → `0x1c76e1` for Three.js).

House style: dark stage, thin bright line-work (strokeWidth 2–3), generous
whitespace, one gold accent.

## Do NOT

- Do not call vgpu `init()` — use the provided `gpu` (ThreeScene/ShaderLayer) or
  `getGpu()` from `src/gpu/context.js`.
- Do not create your own `requestAnimationFrame` loops — ThreeScene/ShaderLayer
  own frame loops; everything else animates via the slide timeline.
- Do not use CSS transitions/animations for entrances — register via Appear &
  friends so build steps, replay, and previews work.
- Do not add window resize listeners — the stage handles scaling.
- Do not position absolute children inside `<Appear>` (see positioning rule).
- Do not call brushmark's `annotate()` directly — use `<BrushReveal>` so strokes
  join the slide timeline (steps, replays, thumbnails).
- Do not hardcode asset paths in JSX when the asset is declared in `meta.assets`
  — use the `assets` prop.
- Do not write `data-loc` attributes — a dev-only Vite transform adds them so
  the visual editor (#/admin/edit/<id>) can map DOM nodes back to source.

## Visual editor compatibility

The admin's visual editor rewrites slide files in place (Babel + magic-string,
comments and formatting preserved). Keep it effective:

- Prefer literal prop values (`size={96}`, `color="var(--accent)"`, inline
  `style={{ … }}` objects with numbers) — expressions are shown read-only.
- Keep the standard idioms: absolute px on the `<Appear style>` wrapper (or a
  positioned `<div>` around HersheyText), `x`/`y` props on `Img`/`SvgIcon`,
  absolute px + `width`/`height` in `style` on `Mermaid`.
- Elements created in `.map()` loops are editable but not draggable.
- Multi-line string props (e.g. `chart`) may be expression-free template
  literals; the inspector edits them in a textarea and writes them back as
  `{"…\n…"}` strings.
