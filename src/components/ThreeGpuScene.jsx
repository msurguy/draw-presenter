import React, { useEffect, useRef, useState } from "react";
import { useSlide } from "../deck/SlideContext.jsx";
import { getGpu } from "../gpu/context.js";

// Three.js' WebGPU renderer running on vgpu's GPUDevice. Because both
// libraries share one device and one queue, a vgpu compute shader can write
// straight into a Three.js storage buffer (or a vgpu target can be sampled
// as a Three.js texture) with zero copies. Same contract as <ThreeScene>:
//
//   <ThreeGpuScene camera={{ fov: 40, position: [0, 0, 5] }}
//     setup={({ scene, camera, renderer, gpu, THREE, TSL }) => ({
//       update(t, dt) {}, dispose() {},
//     })} />
//
// `setup` may be async and only runs when WebGPU is available; otherwise the
// `fallback` node is rendered instead (design slides to still read without it).
export default function ThreeGpuScene({
  setup,
  camera = {},
  background = null,
  fallback = null,
  className,
  style,
  ...rest
}) {
  const hostRef = useRef(null);
  const { isActive, isPreview } = useSlide();
  const stateRef = useRef({ running: false, api: null });
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !setup) return;
    let disposed = false;
    let renderer = null;
    let canvas = null;
    const st = stateRef.current;
    let rafId = 0;
    let epoch = 0;
    let last = 0;

    const w = host.clientWidth || 1920;
    const h = host.clientHeight || 1080;
    let scene = null;
    let cam = null;

    const tick = (now) => {
      if (disposed || !st.running) return;
      if (!epoch) {
        epoch = now;
        last = now;
      }
      const t = (now - epoch) / 1000;
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      st.api?.update?.(t, dt);
      renderer.render(scene, cam);
      rafId = requestAnimationFrame(tick);
    };
    st.start = () => {
      if (st.running || disposed || !renderer) return;
      st.running = true;
      rafId = requestAnimationFrame((now) => {
        last = now;
        tick(now);
      });
    };
    st.stop = () => {
      st.running = false;
      cancelAnimationFrame(rafId);
    };

    (async () => {
      const gpu = await getGpu();
      if (disposed) return;
      if (!gpu) {
        setUnsupported(true);
        return;
      }
      // The WebGPU build of Three + TSL is ~700 kB: load it only for slides
      // that use this component.
      const [THREE, TSL] = await Promise.all([import("three/webgpu"), import("three/tsl")]);
      if (disposed) return;

      scene = new THREE.Scene();
      if (background) scene.background = new THREE.Color(background);
      cam = new THREE.PerspectiveCamera(camera.fov ?? 45, w / h, camera.near ?? 0.1, camera.far ?? 100);
      cam.position.set(...(camera.position ?? [0, 0, 5]));
      cam.lookAt(...(camera.lookAt ?? [0, 0, 0]));

      canvas = document.createElement("canvas");
      canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
      host.appendChild(canvas);
      try {
        renderer = new THREE.WebGPURenderer({
          canvas,
          device: gpu.gpu, // share vgpu's device + queue
          antialias: true,
          alpha: !background,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(w, h, false);
        await renderer.init();
        if (disposed) return;
        const api = await setup({ scene, camera: cam, renderer, canvas, gpu, THREE, TSL });
        if (disposed) {
          api?.dispose?.();
          return;
        }
        st.api = api || {};
        st.api.update?.(0, 0);
        renderer.render(scene, cam);
        if (st.shouldRun) st.start();
      } catch (err) {
        console.error("[deck] ThreeGpuScene setup failed:", err);
        setUnsupported(true);
      }
    })();

    return () => {
      disposed = true;
      st.stop();
      st.api?.dispose?.();
      st.api = null;
      // Three must not destroy the device it borrowed from vgpu; dispose() only
      // releases the renderer's own resources.
      renderer?.dispose();
      canvas?.remove();
    };
    // Setup runs once per mount — slides are remounted on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const st = stateRef.current;
    st.shouldRun = isActive && !isPreview;
    if (st.shouldRun) st.start?.();
    else st.stop?.();
  }, [isActive, isPreview]);

  return (
    <div
      {...rest}
      ref={hostRef}
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}
    >
      {unsupported ? fallback : null}
    </div>
  );
}
