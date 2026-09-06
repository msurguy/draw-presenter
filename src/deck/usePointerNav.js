import { useEffect, useRef } from "react";

// Touch / mouse navigation on the stage viewport:
//   tap on the left third            previous slide
//   tap anywhere else                next (advances builds, then slides)
//   horizontal swipe left / right    next / previous
//
// A press that moves more than SWIPE_MIN px is a swipe; less than TAP_MAX px
// is a tap; anything in between (or a mostly-vertical drag) is ignored. Taps
// on interactive children (buttons, links, inputs) are left alone. `onInput`
// fires on every recognised gesture so the hint toast can dismiss itself.
const TAP_MAX = 10;
const SWIPE_MIN = 40;

export function usePointerNav(viewportRef, { next, prev, onInput }) {
  const handlers = useRef({});
  handlers.current = { next, prev, onInput };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let start = null; // { id, x, y, t }

    const isInteractive = (t) =>
      !!t?.closest?.("button, a, input, textarea, select, [contenteditable], [data-no-nav]");

    const onDown = (e) => {
      if (!e.isPrimary || e.button !== 0 || isInteractive(e.target)) return;
      start = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
    };

    const onUp = (e) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const dt = performance.now() - start.t;
      start = null;
      const h = handlers.current;

      if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 800) {
        h.onInput?.();
        if (dx < 0) h.next();
        else h.prev();
        return;
      }
      if (Math.hypot(dx, dy) <= TAP_MAX && dt < 500) {
        h.onInput?.();
        const rect = el.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        if (ratio < 1 / 3) h.prev();
        else h.next();
      }
    };

    const onCancel = () => {
      start = null;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onCancel);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onCancel);
    };
  }, [viewportRef]);
}
