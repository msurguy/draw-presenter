# Vendored p5.brush (standalone build)

Snapshot of [p5.brush](https://github.com/acamposuribe/p5.brush) v2.2
(standalone entry only — the p5 adapter is not included), MIT licensed, see
[LICENSE.md](./LICENSE.md).

Vendored on 2026-07-07 so brushmark is self-contained and publishable, and
carries local fixes that are not (yet) in an upstream release:

- `adapters/standalone/target.js` — `load()` reuses the Renderer object for
  the same canvas, so compositor caches (blend shader, mask framebuffers)
  survive repeated loads instead of being recompiled/reallocated and leaked.
- `core/color.js` — `Mix.load()` latches `Renderer.loaded` so `isMixReady()`
  stops re-running it on every blend flush.
- `stroke/stroke.js` — custom tips default to a black fill (documented
  "draw in dark tones" behavior); `imageToWhite` measures the tip's ink
  extent (`uvFit`); brushes registered without `pressure` get a neutral
  default instead of crashing.
- `stroke/image.vert` / `stroke/gl_draw.js` — stamps sample only the tip's
  inked region (`u_uvScale`) and tip textures are mipmapped, so small tip
  drawings are visible instead of collapsing to sub-pixel dots.

Shader files (`.vert` / `.frag`) are plain GLSL imported as strings by the
`glslRaw` plugin in `vite.config.ts`.

Upstream's unit-test suite for this code ships alongside it in
[test/unit/](./test/unit/) — run it from the brushmark root:

```sh
npm run test:p5brush
```

To update from a newer upstream p5.brush, copy its `src/` here excluding
`adapters/p5` and `index.p5.js`, then re-apply/verify the local fixes above
and re-run the tests.
