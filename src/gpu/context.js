import { init } from "vgpu";

// One vgpu context for the whole app (ShaderLayer, ThreeScene interop, the
// transition overlay). Never call vgpu's init() directly — use getGpu().
let gpuPromise = null;
let unavailable = false;

export function isWebGpuSupported() {
  return typeof navigator !== "undefined" && !!navigator.gpu && !unavailable;
}

/** Resolves to the shared gpu context, or null when WebGPU is unavailable. */
export function getGpu() {
  if (!gpuPromise) {
    if (typeof navigator === "undefined" || !navigator.gpu) {
      unavailable = true;
      gpuPromise = Promise.resolve(null);
    } else {
      gpuPromise = init().catch((err) => {
        unavailable = true;
        console.warn("[gpu] WebGPU unavailable — shader features disabled.", err);
        return null;
      });
    }
  }
  return gpuPromise;
}
