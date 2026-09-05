import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useSlide } from "../deck/SlideContext.jsx";
import { getGpu } from "../gpu/context.js";

// A Three.js scene inside a slide. The author writes an imperative `setup`
// function; the component owns the renderer, sizing, the RAF loop (which runs
// only while the slide is active) and disposal.
//
//   <ThreeScene
//     camera={{ fov: 45, position: [2.6, 2, 3.4] }}
//     setup={({ scene, camera, renderer, canvas, gpu }) => {
//       const cube = new THREE.Mesh(geo, mat);
//       scene.add(cube);
//       return {
//         update(t, dt) { cube.rotation.y = t * 0.5; },
//         dispose() { geo.dispose(); mat.dispose(); },
//       };
//     }}
//   />
export default function ThreeScene({ setup, camera = {}, background = null, className, style, ...rest }) {
  const hostRef = useRef(null);
  const { isActive, isPreview } = useSlide();
  const stateRef = useRef({ running: false, api: null, renderOnce: null });

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !setup) return;
    let disposed = false;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
    host.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: !background,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const scene = new THREE.Scene();
    if (background) scene.background = new THREE.Color(background);

    const w = host.clientWidth || 1920;
    const h = host.clientHeight || 1080;
    renderer.setSize(w, h, false);

    const cam = new THREE.PerspectiveCamera(
      camera.fov ?? 45,
      w / h,
      camera.near ?? 0.1,
      camera.far ?? 100,
    );
    cam.position.set(...(camera.position ?? [0, 0, 5]));
    cam.lookAt(...(camera.lookAt ?? [0, 0, 0]));

    const st = stateRef.current;
    let rafId = 0;
    let epoch = 0;
    let last = 0;

    const tick = (now) => {
      if (disposed || !st.running) return;
      if (!epoch) {
        epoch = now;
        last = now;
      }
      const t = (now - epoch) / 1000;
      const dt = (now - last) / 1000;
      last = now;
      st.api?.update?.(t, dt);
      renderer.render(scene, cam);
      rafId = requestAnimationFrame(tick);
    };

    st.start = () => {
      if (st.running || disposed) return;
      st.running = true;
      last = 0;
      rafId = requestAnimationFrame((now) => {
        last = now;
        tick(now);
      });
    };
    st.stop = () => {
      st.running = false;
      cancelAnimationFrame(rafId);
    };
    st.renderOnce = () => {
      st.api?.update?.(0, 0);
      renderer.render(scene, cam);
    };

    (async () => {
      const gpu = await getGpu(); // may be null — authors should handle it
      if (disposed) return;
      try {
        const api = await setup({ scene, camera: cam, renderer, canvas, gpu, THREE });
        if (disposed) {
          api?.dispose?.();
          return;
        }
        st.api = api || {};
        st.renderOnce();
        if (st.shouldRun) st.start();
      } catch (err) {
        console.error("[deck] ThreeScene setup failed:", err);
      }
    })();

    return () => {
      disposed = true;
      st.stop();
      st.api?.dispose?.();
      st.api = null;
      renderer.dispose();
      canvas.remove();
    };
    // Setup runs once per mount — slides are remounted on entry, so this is
    // the natural lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const st = stateRef.current;
    st.shouldRun = isActive && !isPreview;
    if (st.shouldRun) st.start?.();
    else {
      st.stop?.();
      // Keep the last frame visible (frozen) for transitions/thumbnails.
    }
  }, [isActive, isPreview]);

  return (
    <div
      {...rest}
      ref={hostRef}
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}
    />
  );
}
