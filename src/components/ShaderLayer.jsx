import React, { useEffect, useRef } from "react";
import { effect as vgpuEffect, frame, surface } from "vgpu";
import { useSlide } from "../deck/SlideContext.jsx";
import { getGpu } from "../gpu/context.js";

// Fullscreen (or container-filling) vgpu WGSL layer.
//
//   <ShaderLayer shader={myWgsl} uniforms={{ params: { speed: 0.4 } }} />
//
// The WGSL fragment gets vgpu's injected top-origin `uv` varying. Uniform
// structs are addressed by their WGSL names. When `timeUniform` is set
// (default "params.time"), it is written every frame with seconds elapsed.
export default function ShaderLayer({
  shader,
  uniforms = {},
  timeUniform = "params.time",
  resolution = [960, 540], // render resolution; CSS stretches to fit
  opacity = 1,
  blend, // CSS mix-blend-mode, e.g. "screen"
  transparent = false, // premultiplied alpha surface for overlays
  className,
  style,
  ...rest // data-* attributes (the editor's data-loc) reach the DOM
}) {
  const canvasRef = useRef(null);
  const { isActive, isPreview } = useSlide();
  const runRef = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shader) return;
    let disposed = false;
    const run = runRef.current;
    let rafId = 0;
    let epoch = 0;

    (async () => {
      const gpu = await getGpu();
      if (!gpu || disposed) return;
      const [w, h] = resolution;
      canvas.width = w;
      canvas.height = h;
      let s, fx;
      try {
        s = surface(gpu, canvas, {
          size: [w, h],
          alphaMode: transparent ? "premultiplied" : "opaque",
        });
        fx = vgpuEffect(gpu, shader, { set: uniforms });
      } catch (err) {
        console.error("[deck] ShaderLayer failed to init shader:", err);
        return;
      }

      const draw = (now) => {
        if (disposed) return;
        if (timeUniform) {
          if (!epoch) epoch = now;
          fx.set(pathToObject(timeUniform, (now - epoch) / 1000));
        }
        frame(gpu, (f) => f.pass(s, fx));
      };

      const tick = (now) => {
        if (disposed || !run.running) return;
        draw(now);
        rafId = requestAnimationFrame(tick);
      };

      run.start = () => {
        if (run.running || disposed) return;
        run.running = true;
        rafId = requestAnimationFrame(tick);
      };
      run.stop = () => {
        run.running = false;
        cancelAnimationFrame(rafId);
      };
      draw(performance.now()); // first frame so the layer is never blank
      if (run.shouldRun) run.start();
    })();

    return () => {
      disposed = true;
      run.stop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shader]);

  useEffect(() => {
    const run = runRef.current;
    run.shouldRun = isActive && !isPreview;
    if (run.shouldRun) run.start?.();
    else run.stop?.();
  }, [isActive, isPreview]);

  return (
    <canvas
      {...rest}
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity,
        ...(blend ? { mixBlendMode: blend } : {}),
        ...style,
      }}
    />
  );
}

function pathToObject(path, value) {
  const parts = path.split(".");
  const root = {};
  let node = root;
  for (let i = 0; i < parts.length - 1; i++) {
    node = node[parts[i]] = {};
  }
  node[parts[parts.length - 1]] = value;
  return root;
}
