// WGSL snippet library. Import chunks, compose them with a shader body:
//
//   import { compose, snoise2, strokeEdge } from "../shaders/lib/index.js";
//   export const myShader = compose(snoise2, strokeEdge, /* wgsl */ `
//     struct Params { time: f32 }
//     @group(0) @binding(0) var<uniform> params: Params;
//     @fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f { … }
//   `);
//
// Attributions: simplex noise (Ashima Arts / Stefan Gustavson, MIT) and the
// sine-free hashes (David Hoskins, MIT); everything else is original to
// draw-presenter. See THIRD_PARTY_NOTICES.md.
export { chunk, compose } from "./chunk.js";
export { random2, random22 } from "./hash.js";
export { snoise2, snoise3 } from "./simplex.js";
export { TAU, rotate2d, saturate, map } from "./math.js";
export { strokeEdge } from "./draw.js";
export { worley22 } from "./worley.js";
export { kaleidoscope_full } from "./kaleidoscope.js";
export { starSDF, flowerSDF, gearSDF, raysSDF } from "./sdf.js";
export { maxDist, endsFade, coverPhases, ease, along } from "./transition.js";
