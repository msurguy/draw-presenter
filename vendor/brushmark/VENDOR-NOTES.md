# Vendored copy of brushmark

Copied 2026-08-31 from the brushmark repository (https://github.com/msurguy/brushmark)
(v0.1.1) and installed as a file dependency (`npm i ./vendor/brushmark`).

## Local patch (candidate for upstream)

`placeOverlay()` mapped viewport-CSS-px geometry 1:1 into the overlay canvas's
CSS box. Inside an ancestor with a CSS `transform: scale(...)` (this deck's
1920×1080 stage is scaled to fit the window) that double-applies the scale:
strokes render at the wrong size and offset. The patch measures the actual
accumulated scale from the canvas's own `getBoundingClientRect()` (rendered
size ÷ style size) and divides it back out of the CSS width/height/left/top.
The canvas *bitmap* stays sized in viewport px × dpr, which is exactly
on-screen resolution, so sharpness is unaffected.

Patched in both places (keep in sync):

- `src/dom/overlay.ts` → `placeOverlay()` (authoritative; survives rebuilds)
- `dist/group-ZfSWLnUM.js` → function `Ai` (what this project actually imports)

If you upgrade this vendored copy from the upstream repo, re-apply the patch
or land it upstream first — without it, brush strokes will drift/shrink
whenever the stage is not at exactly 1:1 scale.

## Local patch 2: annotation type `"path"` (candidate for upstream)

New annotation type that paints caller-supplied gestures instead of derived
geometry: `annotate(el, { type: "path", paths: { strokes, jitter?, resample?,
curvature? } })`, where `strokes` is an array of polylines (`[x, y,
pressure?][]`) in element-local CSS px. Each polyline becomes its own reveal
group in array order, so the brush visibly retraces the paths one after
another — this powers the deck's BrushText component (the brush follows
Hershey font pen strokes). Spatially overlapping strokes are packed onto
separate snapshot layers (greedy bbox packing, capped at 8) so a stroke's
reveal mask can't uncover paint a later stroke hasn't laid down yet.

Patched in (keep in sync):

- `src/types.ts` — `"path"` in AnnotationType, `PathsConfig`, `AnnotationConfig.paths`
- `src/geometry/paths.ts` — `buildCustomPaths()` + switch case + `BuildContext.pathTransform`
- `src/core/annotation.ts` — computes `pathTransform` (element-local → annotation-local,
  recovering ancestor CSS transform scale via rect/offsetWidth ratio)
- `dist/group-ZfSWLnUM.js` — function `Vp`, the switch case in `mi`, and the
  `pathTransform` block in `build()` (what this project actually imports)

## Local patch 3: adaptive paper for light inks (candidate for upstream)

The renderer painted every job on white paper and keyed the white out with
`alpha = 255 - min(r,g,b)`. A light ink (e.g. `#fcfcfc`, or the deck's
`--ink-bright`) barely darkens white paper, so it keyed out to almost fully
transparent — invisible on a dark stage. Mid/saturated inks also came out
partly translucent (gold `#ffcc33` capped at alpha 204).

Now `choosePaper(job)` picks white or black paper, whichever contrasts most
with the job's inks (stroke, wash fill, hatch colors), and `keyOutPaper()`
normalizes the recovered alpha by that ink's achievable contrast, then
un-composites the color against the chosen paper. Dark inks on white paper
behave exactly as before.

Patched in (keep in sync):

- `src/core/renderer.ts` — `choosePaper()`, `parseCssColor()`, `keyOutPaper()`
- `dist/group-ZfSWLnUM.js` — `bmPaper`, `bmParseColor`, `ba` (= keyOutPaper), and
  the `Rs(P.value, …)` clear inside `render()`
