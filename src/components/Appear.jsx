import React, { useLayoutEffect, useRef } from "react";
import { useSlide } from "../deck/SlideContext.jsx";

// Declarative entrance animation. Wrap any slide content:
//   <Appear effect="fade-up" order={1} step={0} delay={0.2}>…</Appear>
// `step` gates content behind build steps (Space/→ reveals the next step).
// `order` sequences entrances within a step. `stagger` animates direct
// children one by one instead of the wrapper as a whole.
const EFFECTS = {
  fade: { from: { autoAlpha: 0 }, to: { autoAlpha: 1 } },
  "fade-up": { from: { autoAlpha: 0, y: 48 }, to: { autoAlpha: 1, y: 0 } },
  "fade-down": { from: { autoAlpha: 0, y: -48 }, to: { autoAlpha: 1, y: 0 } },
  "fade-left": { from: { autoAlpha: 0, x: 64 }, to: { autoAlpha: 1, x: 0 } },
  "fade-right": { from: { autoAlpha: 0, x: -64 }, to: { autoAlpha: 1, x: 0 } },
  scale: { from: { autoAlpha: 0, scale: 0.82 }, to: { autoAlpha: 1, scale: 1 } },
  blur: {
    from: { autoAlpha: 0, filter: "blur(16px)" },
    to: { autoAlpha: 1, filter: "blur(0px)" },
  },
  "mask-reveal": {
    from: { clipPath: "inset(0 100% 0 0)" },
    to: { clipPath: "inset(0 0% 0 0)" },
  },
  none: { from: { autoAlpha: 0 }, to: { autoAlpha: 1 }, duration: 0 },
};

export default function Appear({
  effect = "fade-up",
  order = 0,
  step = 0,
  delay = 0,
  duration,
  stagger = 0,
  ease,
  custom, // (tl, targets, at, entry) => void — full escape hatch
  className,
  style,
  children,
  ...rest // data-* attributes (the editor's data-loc) reach the DOM
}) {
  const ref = useRef(null);
  const { register } = useSlide();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const def = EFFECTS[effect] || EFFECTS.fade;
    if (!EFFECTS[effect]) console.warn(`[deck] unknown Appear effect "${effect}" — using fade.`);
    const targets = () => (stagger ? Array.from(el.children) : [el]);
    return register({
      step,
      order,
      delay,
      duration: duration ?? def.duration ?? 0.6,
      stagger,
      ease,
      from: def.from,
      to: def.to,
      final: def.to,
      targets,
      custom,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, order, step, delay, duration, stagger, ease]);

  return (
    <div {...rest} ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
