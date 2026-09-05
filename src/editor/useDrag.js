import { useCallback, useRef, useState } from "react";
import { styleNum, propNum } from "./layoutTarget.js";

// Pointer-driven move/resize of the layout target. The DOM is updated live for
// feedback; one commit (integers, in stage px) fires on pointer-up.

export const GRID = 8;

const snapTo = (v, on) => (on ? Math.round(v / GRID) * GRID : Math.round(v));

/**
 * Start values for a move: literal anchors, falling back to the measured rect
 * (which must be relative to the element's containing block, see
 * measureRelative) — `cb` is that block's size for right/bottom fallbacks.
 */
function moveStart(layout, rect, cb = { w: 1920, h: 1080 }) {
  const t = layout.target;
  if (layout.kind === "props") {
    return { mode: "props", x: propNum(t, "x") ?? rect.x, y: propNum(t, "y") ?? rect.y };
  }
  const { h, v } = layout.anchors || { h: "left", v: "top" };
  return {
    mode: "style",
    h,
    v,
    left: styleNum(t, "left") ?? rect.x,
    right: styleNum(t, "right") ?? Math.round(cb.w - rect.x - rect.w),
    top: styleNum(t, "top") ?? rect.y,
    bottom: styleNum(t, "bottom") ?? Math.round(cb.h - rect.y - rect.h),
  };
}

export function useDrag({ scale, snap, onCommit }) {
  const [dragging, setDragging] = useState(null); // { kind: "move"|"resize" }
  const stateRef = useRef(null);

  const begin = useCallback(
    (e, { layout, nodes, rect, cb, handle = null, sizeMode = null }) => {
      if (!layout) return false;
      // Text elements resize through their `size` prop, which needs no
      // position — allow that even for flow-positioned text.
      const positioned = layout.kind === "style" || layout.kind === "props";
      if (!positioned && !(handle && sizeMode === "size")) return false;
      const start = moveStart(layout, rect, cb || undefined);
      const startSize =
        sizeMode === "size"
          ? { w: Math.max(1, rect.w), h: Math.max(1, rect.h) } // measured text box, not the font size
          : {
              w: styleNum(layout.target, "width") ?? propNum(layout.target, "width") ?? propNum(layout.target, "size") ?? rect.w,
              h: styleNum(layout.target, "height") ?? propNum(layout.target, "height") ?? propNum(layout.target, "size") ?? rect.h,
            };
      const st = {
        layout,
        nodes,
        rect,
        start,
        startSize,
        handle,
        sizeMode, // null | "size" (HersheyText/BrushText: scale `size` prop)
        x0: e.clientX,
        y0: e.clientY,
        moved: false,
        pointerId: e.pointerId,
        el: e.currentTarget,
        alt: e.altKey,
        shift: e.shiftKey,
        result: null,
      };
      stateRef.current = st;
      try {
        st.el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setDragging({ kind: handle ? "resize" : "move" });
      return true;
    },
    [],
  );

  const move = useCallback(
    (e) => {
      const st = stateRef.current;
      if (!st) return;
      const dx = (e.clientX - st.x0) / scale;
      const dy = (e.clientY - st.y0) / scale;
      if (!st.moved && Math.abs(dx) * scale < 3 && Math.abs(dy) * scale < 3) return;
      st.moved = true;
      st.alt = e.altKey;
      st.shift = e.shiftKey;
      const doSnap = snap && !st.alt;

      if (!st.handle) {
        // ---- move
        const out = {};
        if (st.start.mode === "props") {
          out.x = snapTo(st.start.x + dx, doSnap);
          out.y = snapTo(st.start.y + dy, doSnap);
          for (const n of st.nodes) {
            n.style.left = `${out.x}px`;
            n.style.top = `${out.y}px`;
          }
        } else {
          if (st.start.h === "left") out.left = snapTo(st.start.left + dx, doSnap);
          else if (st.start.h === "right") out.right = snapTo(st.start.right - dx, doSnap);
          if (st.start.v === "top") out.top = snapTo(st.start.top + dy, doSnap);
          else if (st.start.v === "bottom") out.bottom = snapTo(st.start.bottom - dy, doSnap);
          for (const n of st.nodes) {
            if ("left" in out) n.style.left = `${out.left}px`;
            if ("right" in out) n.style.right = `${out.right}px`;
            if ("top" in out) n.style.top = `${out.top}px`;
            if ("bottom" in out) n.style.bottom = `${out.bottom}px`;
          }
        }
        st.result = { kind: "move", values: out };
        return;
      }

      // ---- resize
      const hnd = st.handle; // n, s, e, w, ne, nw, se, sw
      let w = st.startSize.w;
      let h = st.startSize.h;
      let left = st.start.left ?? st.start.x;
      let top = st.start.top ?? st.start.y;
      const aspect = st.startSize.w / Math.max(1, st.startSize.h);
      if (hnd.includes("e")) w = st.startSize.w + dx;
      if (hnd.includes("w")) {
        w = st.startSize.w - dx;
        left = (st.start.left ?? st.start.x) + dx;
      }
      if (hnd.includes("s")) h = st.startSize.h + dy;
      if (hnd.includes("n")) {
        h = st.startSize.h - dy;
        top = (st.start.top ?? st.start.y) + dy;
      }
      const corner = hnd.length === 2;
      if (st.sizeMode === "size" || (corner && st.shift)) {
        // keep aspect from the dominant axis
        if (Math.abs(dx) >= Math.abs(dy)) h = w / aspect;
        else w = h * aspect;
      }
      w = Math.max(8, snapTo(w, doSnap));
      h = Math.max(8, snapTo(h, doSnap));
      left = snapTo(left, doSnap);
      top = snapTo(top, doSnap);
      if (st.sizeMode === "size") {
        // Live preview: scale the text box from its top-left corner; the real
        // `size` prop is written on release and the transform removed.
        const f = w / st.startSize.w;
        for (const n of st.nodes) {
          n.style.transformOrigin = "0 0";
          n.style.transform = `scale(${f})`;
        }
        st.result = { kind: "resize", w, h, left, top, movedLeft: false, movedTop: false, axis: "xy", scaleFactor: f };
        return;
      }
      for (const n of st.nodes) {
        n.style.width = `${w}px`;
        if (!(hnd === "e" || hnd === "w")) n.style.height = `${h}px`;
        if (hnd.includes("w")) n.style.left = `${left}px`;
        if (hnd.includes("n")) n.style.top = `${top}px`;
      }
      st.result = {
        kind: "resize",
        w,
        h,
        left,
        top,
        movedLeft: hnd.includes("w"),
        movedTop: hnd.includes("n"),
        axis: hnd === "e" || hnd === "w" ? "x" : hnd === "n" || hnd === "s" ? "y" : "xy",
        scaleFactor: w / Math.max(1, st.startSize.w),
      };
    },
    [scale, snap],
  );

  const end = useCallback(
    (e) => {
      const st = stateRef.current;
      if (!st) return;
      stateRef.current = null;
      setDragging(null);
      try {
        st.el.releasePointerCapture(st.pointerId);
      } catch {
        /* ignore */
      }
      if (st.sizeMode === "size") {
        for (const n of st.nodes) {
          n.style.transform = "";
          n.style.transformOrigin = "";
        }
      }
      if (st.moved && st.result) onCommit(st.layout, st.result, st);
    },
    [onCommit],
  );

  return { begin, move, end, dragging };
}
