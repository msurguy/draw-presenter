import React, { useLayoutEffect, useRef, useState } from "react";
import { useSlide } from "../deck/SlideContext.jsx";

// Inlines an external SVG so its strokes can be animated. With `draw`, every
// stroked shape animates on with a dashoffset tween (like HersheyText).
//
// The SVG markup is injected manually (not via dangerouslySetInnerHTML) so the
// animated child nodes are fully owned by this component — React re-renders
// never recreate them and wipe the dash state.
//
//   <SvgIcon src="/assets/icons/bolt.svg" size={140} draw color="var(--accent)" />
const svgCache = new Map(); // src → Promise<string>

function fetchSvg(src) {
  if (!svgCache.has(src)) {
    svgCache.set(
      src,
      fetch(src).then((r) => {
        if (!r.ok) throw new Error(`SVG fetch failed: ${r.status}`);
        return r.text();
      }),
    );
  }
  return svgCache.get(src);
}

export default function SvgIcon({
  src,
  size,
  width,
  height,
  color, // overrides stroke on all shapes when set
  strokeWidth, // overrides stroke-width on all shapes when set
  draw = false,
  drawDuration = 1,
  stagger = 0.08,
  delay = 0,
  order = 0,
  step = 0,
  ease = "power2.inOut",
  x,
  y,
  className,
  style,
  ...rest // data-* attributes (the editor's data-loc) reach the DOM
}) {
  const hostRef = useRef(null);
  const { register, requestRebuild } = useSlide();
  const [markup, setMarkup] = useState(null);

  useLayoutEffect(() => {
    let cancelled = false;
    fetchSvg(src)
      .then((text) => !cancelled && setMarkup(text))
      .catch((err) => console.error(`[deck] SvgIcon failed to load ${src}:`, err));
    return () => {
      cancelled = true;
    };
  }, [src]);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host || !markup) return;
    host.innerHTML = markup;
    const svg = host.querySelector("svg");
    if (!svg) return;

    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const shapes = Array.from(
      svg.querySelectorAll("path, line, polyline, polygon, circle, ellipse, rect"),
    );
    for (const s of shapes) {
      if (color) s.setAttribute("stroke", color);
      if (strokeWidth != null) s.setAttribute("stroke-width", strokeWidth);
    }

    if (!draw) return () => { host.innerHTML = ""; };
    const drawable = shapes.filter((s) => typeof s.getTotalLength === "function");
    for (const s of drawable) {
      const len = s.getTotalLength();
      s.style.strokeDasharray = `${len}`;
      s.style.strokeDashoffset = `${len}`;
      // Draw-on only makes sense for stroked outlines; hide fills during draw.
      if (s.getAttribute("fill") && s.getAttribute("fill") !== "none") {
        s.setAttribute("fill", "none");
      }
    }
    const unregister = register({
      step,
      order,
      delay,
      targets: () => drawable,
      final: { strokeDashoffset: 0 },
      custom: (tl, targets, at) => {
        tl.to(targets, { strokeDashoffset: 0, duration: drawDuration, ease, stagger }, at);
      },
    });
    requestRebuild();
    return () => {
      unregister();
      host.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markup, draw, color, strokeWidth, drawDuration, stagger, delay, order, step, ease]);

  const positioned = x != null || y != null;
  return (
    <div
      {...rest}
      ref={hostRef}
      className={className}
      style={{
        ...(positioned ? { position: "absolute", left: x ?? 0, top: y ?? 0 } : {}),
        width: width ?? size ?? 120,
        height: height ?? size ?? 120,
        ...style,
      }}
    />
  );
}
