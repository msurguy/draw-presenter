import React, { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useSlide } from "../deck/SlideContext.jsx";
import { loadFont } from "../hershey/fontLoader.js";
import { measureLineWidths, createTextPaths } from "../hershey/textLayout.js";
import { DEFAULT_FONT } from "../hershey/fonts.js";

// Animated single-stroke text. Each glyph is one <path>, drawn on with a
// stroke-dashoffset tween registered in the slide's entrance timeline.
//
// Two draw modes:
//   mode="sequential" (default) — handwriting order: one glyph at a time, in
//     text order (left→right, line by line). `drawDuration` is the TOTAL time
//     for the whole text; every glyph gets a slice proportional to its path
//     length so the pen moves at a constant speed. `stagger` is ignored.
//   mode="overlap" — every glyph tweens together for `drawDuration` seconds,
//     offset by `stagger` seconds each (the pre-sequential behaviour).
//
// Easing:
//   ease     — whole-animation pace. Sequential: warps the timing of the whole
//              writing sequence. Overlap: the stagger distribution ease.
//   charEase — each glyph's own draw-on ease (both modes).
//
//   <HersheyText font="HersheyScript1" size={140} color="var(--accent)"
//                drawDuration={2} ease="power1.inOut" charEase="sine.inOut">
//     Hello{"\n"}world
//   </HersheyText>
export default function HersheyText({
  children,
  font = DEFAULT_FONT,
  size = 96,
  align = "center",
  color = "var(--ink-bright)",
  strokeWidth = 2.5,
  charSpacing = 0,
  lineHeight = 1.25,
  mode = "sequential", // "sequential" | "overlap"
  drawDuration = 1.6,
  stagger = 0.04,
  delay = 0,
  order = 0,
  step = 0,
  ease = "none",
  charEase = "sine.inOut",
  className,
  style,
  ...rest // data-* attributes (the editor's data-loc) reach the DOM
}) {
  const text = typeof children === "string" ? children : React.Children.toArray(children).join("");
  const svgRef = useRef(null);
  const innerRef = useRef(null); // sequential-mode nested timeline (owned here, not by the slide)
  const { register, requestRebuild } = useSlide();
  const [layout, setLayout] = useState(null);

  // Load + lay out the text whenever inputs change.
  useLayoutEffect(() => {
    let cancelled = false;
    loadFont(font, size)
      .then((fontData) => {
        if (cancelled) return;
        const paths = createTextPaths(text, fontData, {
          alignment: align,
          charSpacing,
          lineHeight,
        });
        const { maxLineWidth } = measureLineWidths(text, fontData, charSpacing);
        const lines = text.split("\n").length;
        const pad = Math.max(strokeWidth * 2, size * 0.08);
        const minX = align === "center" ? -maxLineWidth / 2 : align === "right" ? -maxLineWidth : 0;
        const height = size + (lines - 1) * size * lineHeight + size * 0.3;
        setLayout({
          paths,
          viewBox: `${minX - pad} ${-pad} ${maxLineWidth + pad * 2} ${height + pad * 2}`,
          width: maxLineWidth + pad * 2,
          height: height + pad * 2,
        });
      })
      .catch(() => {
        /* logged by loader */
      });
    return () => {
      cancelled = true;
    };
  }, [text, font, size, align, charSpacing, lineHeight, strokeWidth]);

  // Once paths exist in the DOM: prime dash state and register the draw-on.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || !layout || !layout.paths.length) return;
    const pathEls = Array.from(svg.querySelectorAll("path"));
    const lengths = pathEls.map((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
      return len;
    });
    const totalLen = lengths.reduce((a, b) => a + b, 0) || 1;

    const killInner = () => {
      if (innerRef.current) {
        innerRef.current.kill();
        innerRef.current = null;
      }
    };

    const unregister = register({
      step,
      order,
      delay,
      targets: () => pathEls,
      final: { strokeDashoffset: 0 },
      custom: (tl, targets, at) => {
        // The slide timeline is rebuilt often (late font load, step scrubber),
        // so this runs more than once — always start from a clean nested timeline.
        killInner();
        if (mode === "overlap") {
          tl.to(
            targets,
            { strokeDashoffset: 0, duration: drawDuration, ease: charEase, stagger: { each: stagger, ease } },
            at,
          );
          return;
        }
        // Sequential: contiguous per-glyph slices proportional to path length,
        // then the whole sequence is driven (and eased) via its progress.
        const inner = gsap.timeline({ paused: true });
        let t = 0;
        targets.forEach((el, i) => {
          const d = drawDuration * (lengths[i] / totalLen);
          inner.to(el, { strokeDashoffset: 0, duration: d, ease: charEase }, t);
          t += d;
        });
        innerRef.current = inner;
        tl.to(inner, { progress: 1, duration: drawDuration, ease }, at);
      },
    });
    requestRebuild();
    return () => {
      unregister();
      killInner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, step, order, delay, mode, drawDuration, stagger, ease, charEase]);

  if (!layout) return <div {...rest} className={className} style={style} />;

  return (
    <svg
      {...rest}
      ref={svgRef}
      className={className}
      style={style}
      width={layout.width}
      height={layout.height}
      viewBox={layout.viewBox}
      fill="none"
      aria-label={text}
      role="img"
    >
      {layout.paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
