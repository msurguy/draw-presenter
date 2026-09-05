import React, { useLayoutEffect, useRef } from "react";
import { annotate } from "brushmark";
import { useSlide } from "../deck/SlideContext.jsx";

// Hand-painted brush annotation (brushmark) as a slide entrance. Wraps any
// content — DOM text, HersheyText, SvgIcon, images — and paints a real brush
// stroke over/around/under it at its step, driven by the slide timeline
// (so build steps, prev-nav reveal, admin thumbnails and replays all work).
//
//   <BrushReveal type="circle" brush={{ name: "2B", color: "#c93030" }} step={1}>
//     <SvgIcon src="/assets/icons/bolt.svg" size={120} />
//   </BrushReveal>
//
// Types: underline | highlight | box | circle | contour | strike-through |
//        crossed-off | bracket
// Brushes: pen, rotring, 2B, HB, 2H, cpencil, pastel, crayon, charcoal,
//          spray, marker.
//
// Extras beyond raw brushmark:
//   dim        — spotlight mode: content starts dimmed and brightens as the
//                stroke draws (great for "circle the important thing").
//   hideOn     — step at which the stroke un-paints itself (reverse scrub),
//                for temporary emphasis.
//
// The annotation's own timeline stays standalone; the slide timeline scrubs
// its progress through a proxy tween, so slide-timeline rebuilds never kill
// the brush art. The proxy is a property SETTER (not an onUpdate callback):
// when the deck jumps the timeline past this entrance — a keypress landing
// mid-stroke, an editor scrub — GSAP still writes the final value even though
// callbacks are suppressed, so the paint always lands fully drawn.
export default function BrushReveal({
  type = "underline",
  brush = { name: "marker", color: "#ffcc33" },
  duration = 1,
  step = 0,
  order = 0,
  delay = 0,
  options = {}, // extra annotate() options: stagger, iterations, highlightStyle,
  // padding, contour, brackets, direction, seed, multiline, ease…
  dim = false,
  dimOpacity = 0.22,
  hideOn = null,
  as: Tag = "span",
  className,
  style,
  children,
  ...rest
}) {
  const ref = useRef(null);
  const annotationRef = useRef(null);
  const { register, requestRebuild, isPreview } = useSlide();

  // Serialize object props so effects don't re-run on identical inline literals.
  const brushKey = JSON.stringify(brush);
  const optionsKey = JSON.stringify(options);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;
    let annotation = null;
    let sizeObserver = null;
    const unregisters = [];

    // Dimmed (spotlight) content must be dim from the first paint, even
    // though registration waits for the element to gain size. Previews and
    // reveal-all builds brighten it via finalize().
    if (dim && !isPreview) el.style.opacity = String(dimOpacity);

    // Async content (HersheyText fonts, fetched SVGs) can mean the element is
    // still 0×0 here; annotating an empty box builds no geometry. Wait for
    // real size before creating the annotation.
    const start = () => {
      if (cancelled || annotation) return;
      try {
        annotation = annotate(el, {
          type,
          brush,
          duration, // internal stagger/segment proportions follow the real duration
          animate: true,
          ...options,
        });
        annotation.prepare(); // build geometry + art without playing
      } catch (err) {
        console.error("[deck] BrushReveal failed to create annotation:", err);
        return;
      }
      annotationRef.current = annotation;
      registerEntrances();
      requestRebuild();
    };

    const box = el.getBoundingClientRect();
    if (box.width > 4 && box.height > 4) {
      start();
    } else {
      sizeObserver = new ResizeObserver(() => {
        const b = el.getBoundingClientRect();
        if (b.width > 4 && b.height > 4) {
          sizeObserver?.disconnect();
          sizeObserver = null;
          start();
        }
      });
      sizeObserver.observe(el);
    }

    function registerEntrances() {

    // Draw-on at `step`.
    unregisters.push(
      register({
        step,
        order,
        delay,
        targets: () => [el],
        from: dim ? { opacity: dimOpacity } : null, // pre-set before first paint
        custom: (tl, targets, at) => {
          tl.fromTo(
            progressProxy(annotation),
            { p: 0 },
            {
              p: 1,
              duration,
              ease: "none", // brushmark applies its own easing internally
            },
            at,
          );
          if (dim) {
            tl.to(el, { opacity: 1, duration: Math.min(duration, 0.6), ease: "power2.out" }, at);
          }
        },
        finalize: () => {
          annotation.timeline.progress(1);
          if (dim) el.style.opacity = "1";
        },
      }),
    );

    // Optional un-draw at `hideOn`.
    if (hideOn != null && hideOn > step) {
      unregisters.push(
        register({
          step: hideOn,
          order,
          delay,
          targets: () => [el],
          custom: (tl, targets, at) => {
            tl.fromTo(
              progressProxy(annotation),
              { p: 1 },
              {
                p: 0,
                duration: duration * 0.6,
                ease: "none",
              },
              at,
            );
          },
          finalize: () => annotation.timeline.progress(0),
        }),
      );
      }
    }

    return () => {
      cancelled = true;
      sizeObserver?.disconnect();
      unregisters.forEach((fn) => fn());
      annotationRef.current = null;
      annotation?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, brushKey, optionsKey, duration, step, order, delay, dim, dimOpacity, hideOn]);

  return (
    <Tag ref={ref} className={className} style={{ display: "inline-block", ...style }} {...rest}>
      {children}
    </Tag>
  );
}

// Tween target whose `p` setter scrubs the brushmark timeline directly.
function progressProxy(annotation) {
  let value = annotation.timeline.progress();
  return {
    get p() {
      return value;
    },
    set p(v) {
      value = v;
      annotation.timeline.progress(v);
    },
  };
}
