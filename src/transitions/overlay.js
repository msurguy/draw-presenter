import { effect, frame, surface } from "vgpu";
import { getGpu } from "../gpu/context.js";

// One reusable fullscreen WGSL overlay canvas that lives inside the stage,
// above the slide layers (pointer-events: none, transparent). Shader
// transitions bind an effect to it and drive a `progress` uniform.

const OVERLAY_W = 1280;
const OVERLAY_H = 720;
export const OVERLAY_ASPECT = OVERLAY_W / OVERLAY_H;

let state = null; // { canvas, surface, gpu, effects: Map<wgsl, effect> }
let statePromise = null;

async function ensureOverlay(stageEl) {
  if (state) {
    if (state.canvas.parentElement !== stageEl) stageEl.appendChild(state.canvas);
    return state;
  }
  if (statePromise) return statePromise;
  statePromise = (async () => {
    const gpu = await getGpu();
    if (!gpu) return null;
    const canvas = document.createElement("canvas");
    canvas.width = OVERLAY_W;
    canvas.height = OVERLAY_H;
    canvas.className = "transition-overlay-canvas";
    canvas.style.display = "none";
    stageEl.appendChild(canvas);
    try {
      const s = surface(gpu, canvas, {
        size: [OVERLAY_W, OVERLAY_H],
        alphaMode: "premultiplied",
      });
      state = { canvas, surface: s, gpu, effects: new Map() };
      return state;
    } catch (err) {
      console.warn("[transitions] overlay surface failed — shader overlays disabled.", err);
      canvas.remove();
      return null;
    }
  })();
  return statePromise;
}

/**
 * Attach a WGSL overlay to a running transition.
 * Returns { setProgress(p), end() } immediately; the effect starts drawing as
 * soon as the async GPU setup resolves (a few frames in, which is fine).
 * If WebGPU is unavailable this is a silent no-op — the DOM base still runs.
 */
export function shaderOverlay(stageEl, wgsl, uniforms = {}) {
  let ready = null;
  let ended = false;
  let lastProgress = 0;

  ensureOverlay(stageEl).then((st) => {
    if (!st || ended) return;
    let fx = st.effects.get(wgsl);
    if (!fx) {
      try {
        fx = effect(st.gpu, wgsl);
        st.effects.set(wgsl, fx);
      } catch (err) {
        console.warn("[transitions] overlay shader failed to compile.", err);
        return;
      }
    }
    ready = { st, fx };
    st.canvas.style.display = "block";
    draw(lastProgress);
  });

  function draw(p) {
    if (!ready || ended) return;
    const { st, fx } = ready;
    try {
      fx.set({ params: { ...uniforms, progress: p } });
      frame(st.gpu, (f) => f.pass(st.surface, fx));
    } catch (err) {
      console.warn("[transitions] overlay draw failed.", err);
      ready = null;
    }
  }

  return {
    setProgress(p) {
      lastProgress = p;
      draw(p);
    },
    end() {
      ended = true;
      if (ready) ready.st.canvas.style.display = "none";
      else if (state) state.canvas.style.display = "none";
    },
  };
}
