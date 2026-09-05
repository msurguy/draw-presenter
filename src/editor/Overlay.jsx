import React, { useEffect, useLayoutEffect, useState } from "react";

// Selection chrome drawn INSIDE the scaled stage, so all coordinates are stage
// pixels. Measures the DOM nodes carrying a data-loc on every layout change.

export function measureLoc(stageEl, loc, scale) {
  if (!stageEl || !loc) return { rect: null, nodes: [] };
  const nodes = Array.from(stageEl.querySelectorAll(`[data-loc="${loc}"]`));
  if (!nodes.length) return { rect: null, nodes };
  const base = stageEl.getBoundingClientRect();
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const n of nodes) {
    const r = n.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    x1 = Math.min(x1, (r.left - base.left) / scale);
    y1 = Math.min(y1, (r.top - base.top) / scale);
    x2 = Math.max(x2, (r.right - base.left) / scale);
    y2 = Math.max(y2, (r.bottom - base.top) / scale);
  }
  if (!Number.isFinite(x1)) return { rect: { x: 0, y: 0, w: 0, h: 0, empty: true }, nodes };
  return { rect: { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }, nodes };
}

/**
 * Stage-px origin of the CSS containing block for `el` (nearest positioned or
 * transformed ancestor, else the stage). `left`/`top` values are relative to
 * this, NOT to the stage — converting or dragging must subtract it.
 */
export function containingBlock(stageEl, el, scale) {
  const base = stageEl.getBoundingClientRect();
  let p = el?.parentElement;
  while (p && p !== stageEl) {
    const cs = getComputedStyle(p);
    if (cs.position !== "static" || cs.transform !== "none") break;
    p = p.parentElement;
  }
  if (!p || p === stageEl) return { x: 0, y: 0, w: 1920, h: 1080 };
  const r = p.getBoundingClientRect();
  const cs = getComputedStyle(p);
  const bl = parseFloat(cs.borderLeftWidth) || 0;
  const bt = parseFloat(cs.borderTopWidth) || 0;
  return {
    x: (r.left - base.left) / scale + bl,
    y: (r.top - base.top) / scale + bt,
    w: r.width / scale - bl - (parseFloat(cs.borderRightWidth) || 0),
    h: r.height / scale - bt - (parseFloat(cs.borderBottomWidth) || 0),
  };
}

/** measureLoc + the rect expressed relative to the element's containing block. */
export function measureRelative(stageEl, loc, scale) {
  const m = measureLoc(stageEl, loc, scale);
  if (!m.rect || !m.nodes.length) return { ...m, rel: null, cb: null };
  const cb = containingBlock(stageEl, m.nodes[0], scale);
  return { ...m, cb, rel: { x: m.rect.x - cb.x, y: m.rect.y - cb.y, w: m.rect.w, h: m.rect.h, empty: m.rect.empty } };
}

const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const CURSORS = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize" };

export default function Overlay({
  stageRef,
  scale,
  selectedLoc,
  hoverLoc,
  targetLoc,
  layout,
  resizable,
  onHandleDown,
  tick,
  guides,
  label,
}) {
  const [sel, setSel] = useState(null);
  const [hov, setHov] = useState(null);
  const [tgt, setTgt] = useState(null);

  const measure = () => {
    const st = stageRef.current;
    setSel(measureLoc(st, selectedLoc, scale).rect);
    setHov(hoverLoc && hoverLoc !== selectedLoc ? measureLoc(st, hoverLoc, scale).rect : null);
    setTgt(targetLoc && targetLoc !== selectedLoc ? measureLoc(st, targetLoc, scale).rect : null);
  };

  useLayoutEffect(measure, [selectedLoc, hoverLoc, targetLoc, scale, tick]);

  // Re-measure whenever the slide DOM changes (font loads, HMR re-renders…).
  useEffect(() => {
    const st = stageRef.current;
    if (!st) return;
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    const mo = new MutationObserver(schedule);
    mo.observe(st, { subtree: true, childList: true, attributes: true, characterData: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(st);
    const iv = setInterval(schedule, 800); // cheap safety net for late layout
    return () => {
      mo.disconnect();
      ro.disconnect();
      clearInterval(iv);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageRef, selectedLoc, hoverLoc, targetLoc, scale]);

  const px = 1 / scale; // one screen pixel in stage units
  const box = (r, cls, extra) =>
    r ? (
      <div
        key={cls}
        className={`ed-box ${cls}`}
        style={{ left: r.x, top: r.y, width: r.w, height: r.h, outlineWidth: (cls.includes("selected") ? 2 : 1) * px, ...extra }}
      />
    ) : null;

  const hs = 9 * px; // handle size
  return (
    <div className="ed-overlay">
      {guides?.map((g, i) => (
        <div
          key={i}
          className="ed-guide"
          style={g.axis === "x" ? { left: g.at, top: 0, width: px, height: 1080 } : { top: g.at, left: 0, height: px, width: 1920 }}
        />
      ))}
      {box(hov, "hover")}
      {box(tgt, "target")}
      {box(sel, `selected${layout?.kind === "locked" || layout?.kind === "flow" ? " locked" : ""}`)}
      {sel && label && (
        <div className="ed-tag" style={{ left: sel.x, top: sel.y - 18 * px, fontSize: 11 * px, padding: `${2 * px}px ${5 * px}px`, borderRadius: 3 * px }}>
          {label}
        </div>
      )}
      {sel && resizable &&
        HANDLES.map((h) => {
          if (resizable === "corners" && h.length !== 2) return null;
          // Text handles sit just outside the box so they never cover a glyph
          // stroke (grabbing the text must always start a move, not a resize).
          const off = resizable === "corners" ? hs * 0.6 : 0;
          const cx = h.includes("w") ? sel.x - off : h.includes("e") ? sel.x + sel.w + off : sel.x + sel.w / 2;
          const cy = h.includes("n") ? sel.y - off : h.includes("s") ? sel.y + sel.h + off : sel.y + sel.h / 2;
          return (
            <div
              key={h}
              className="ed-handle"
              data-handle={h}
              style={{ left: cx - hs / 2, top: cy - hs / 2, width: hs, height: hs, cursor: CURSORS[h], borderWidth: px }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onHandleDown?.(e, h, sel);
              }}
            />
          );
        })}
    </div>
  );
}
