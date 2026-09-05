import React, { useLayoutEffect, useState } from "react";
import SvgPath from "svgpath";
import BrushReveal from "./BrushReveal.jsx";
import { loadFont } from "../hershey/fontLoader.js";
import { measureLineWidths, createTextPaths } from "../hershey/textLayout.js";
import { DEFAULT_FONT } from "../hershey/fonts.js";

// Single-stroke (Hershey) text painted by a real brush: the glyph pen strokes
// are sampled into polylines and handed to brushmark's "path" annotation type
// (vendor patch), so the brush visibly retraces every stroke of the font in
// pen order — graphite, marker, charcoal… — with pressure and tremor.
//
//   <BrushText font="HersheyScript1" size={200} duration={3}
//              brush={{ name: "marker", color: "#ffcc33", weight: 1.3 }}>
//     Painted by hand
//   </BrushText>
//
// Same slide wiring as every entrance: step / order / delay, prev-nav and
// admin thumbnails show the finished paint. Compare HersheyText (crisp SVG
// line draw-on) with this (painterly brush retrace) and pick per moment.
export default function BrushText({
  children,
  font = DEFAULT_FONT,
  size = 120,
  align = "left",
  brush = { name: "marker", color: "#ffcc33", weight: 1.2 },
  duration = 2.5,
  step = 0,
  order = 0,
  delay = 0,
  charSpacing = 0,
  lineHeight = 1.25,
  jitter = 0.5, // px of hand tremor along the strokes (0 = trace exactly)
  curvature = 0.3, // spline smoothing; lower keeps corners sharper
  overlap, // 0–1: overlap consecutive strokes for a faster, looser feel
  resample, // sample spacing in px (default scales with size)
  options = {}, // extra brushmark annotate() options (ease, seed, iterations…)
  hideOn = null,
  className,
  style,
  ...rest
}) {
  const text = typeof children === "string" ? children : React.Children.toArray(children).join("");
  const [built, setBuilt] = useState(null);

  const spacing = resample ?? Math.min(8, Math.max(3, size / 26));

  useLayoutEffect(() => {
    let cancelled = false;
    loadFont(font, size)
      .then((fontData) => {
        if (cancelled) return;
        const glyphPaths = createTextPaths(text, fontData, {
          alignment: align,
          charSpacing,
          lineHeight,
        });
        const { maxLineWidth } = measureLineWidths(text, fontData, charSpacing);
        const lines = text.split("\n").length;
        const pad = Math.max(10, size * 0.12); // room for paint spill
        const minX = align === "center" ? -maxLineWidth / 2 : align === "right" ? -maxLineWidth : 0;
        const strokes = samplePenStrokes(
          glyphPaths.map((p) => p.d),
          pad - minX,
          pad,
          spacing,
        );
        setBuilt({
          strokes,
          width: maxLineWidth + pad * 2,
          height: size + (lines - 1) * size * lineHeight + size * 0.3 + pad * 2,
        });
      })
      .catch(() => {
        /* logged by the font loader */
      });
    return () => {
      cancelled = true;
    };
  }, [text, font, size, align, charSpacing, lineHeight, spacing]);

  if (!built) {
    return <div {...rest} className={className} style={style} aria-label={text} role="img" />;
  }

  return (
    <BrushReveal
      type="path"
      as="div"
      brush={{ pressure: [1.15, 0.82], ...brush }}
      duration={duration}
      step={step}
      order={order}
      delay={delay}
      hideOn={hideOn}
      options={{
        paths: { strokes: built.strokes, jitter, resample: spacing, curvature },
        ease: "power1.inOut", // per-stroke pen rhythm
        ...(overlap != null ? { stagger: { by: "stroke", overlap } } : {}),
        ...options,
      }}
      className={className}
      // fontSize drives brushmark's weight scaling (weight × size/16).
      style={{ width: built.width, height: built.height, fontSize: size, ...style }}
      role="img"
      aria-label={text}
      {...rest}
    />
  );
}

// ------------------------------------------------------------------ helpers

// Split a glyph's path data into its pen strokes (one per `M` subpath — that
// is how single-stroke fonts encode pen lifts) and sample each into a
// polyline of element-local points via SVG path geometry.
function samplePenStrokes(ds, offsetX, offsetY, spacing) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;";
  const path = document.createElementNS(svgNS, "path");
  svg.appendChild(path);
  document.body.appendChild(svg);

  const strokes = [];
  try {
    for (const d of ds) {
      if (!d) continue;
      const abs = new SvgPath(d).abs().toString();
      for (const sub of abs.split(/(?=M)/)) {
        const trimmed = sub.trim();
        if (!trimmed) continue;
        path.setAttribute("d", trimmed);
        let len = 0;
        try {
          len = path.getTotalLength();
        } catch {
          continue;
        }
        if (!isFinite(len)) continue;
        if (len < 0.75) {
          // Dot strokes (i-dots, punctuation): give the brush a tiny dab.
          const p = path.getPointAtLength(0);
          strokes.push([
            [p.x + offsetX, p.y + offsetY],
            [p.x + offsetX + 0.8, p.y + offsetY + 0.4],
          ]);
          continue;
        }
        const n = Math.max(2, Math.ceil(len / spacing) + 1);
        const pts = [];
        for (let i = 0; i < n; i++) {
          const p = path.getPointAtLength((len * i) / (n - 1));
          pts.push([p.x + offsetX, p.y + offsetY]);
        }
        strokes.push(pts);
      }
    }
  } finally {
    svg.remove();
  }
  return strokes;
}
