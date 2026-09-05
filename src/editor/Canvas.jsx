import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SlideProvider } from "../deck/SlideContext.jsx";
import Overlay, { measureLoc, measureRelative } from "./Overlay.jsx";
import { useDrag } from "./useDrag.js";
import { layoutTarget } from "./layoutTarget.js";

// The editing surface: the real slide component mounted inert inside a
// 1920×1080 stage scaled to fit, plus the selection overlay. Clicks are hit
// tested against `data-loc` (deepest element wins) and can start a drag of
// that element's layout target immediately.

export const STAGE_W = 1920;
export const STAGE_H = 1080;

const isTextual = (node) => !!node && (node.name === "HersheyText" || node.name === "BrushText");

export default function Canvas({
  slide,
  mountKey,
  mode,
  apiRef,
  index,
  selectedLoc,
  hoverLoc,
  layout,
  onSelect,
  onHover,
  onDragCommit,
  snap,
  tick,
  onDropAt,
  onFlowDrag,
}) {
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [guides, setGuides] = useState([]);

  // Fit the stage into the available area.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const pad = 32;
      const w = el.clientWidth - pad * 2;
      const h = el.clientHeight - pad * 2;
      const s = Math.max(0.05, Math.min(w / STAGE_W, h / STAGE_H));
      setScale(s);
      setOffset({ x: (el.clientWidth - STAGE_W * s) / 2, y: (el.clientHeight - STAGE_H * s) / 2 });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const drag = useDrag({
    scale,
    snap,
    onCommit: (lay, result, st) => {
      setGuides([]);
      onDragCommit(lay, result, st);
    },
  });

  const commitActiveField = () => {
    const a = document.activeElement;
    if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA")) a.blur();
  };

  const hitLoc = (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return null;
    if (t.closest(".ed-overlay")) return null;
    const el = t.closest("[data-loc]");
    if (!el || !stageRef.current?.contains(el)) return null;
    return el.getAttribute("data-loc");
  };

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const loc = hitLoc(e);
    // preventDefault on pointerdown stops Chrome from moving focus, so an
    // inspector field being edited would never blur (and never commit).
    // Blur it explicitly so the pending edit lands before the selection moves.
    commitActiveField();
    e.preventDefault();
    if (!loc) {
      onSelect(null);
      return;
    }
    onSelect(loc);
    const lay = layoutTarget(index, loc);
    if (!(lay.kind === "style" || lay.kind === "props")) {
      flowHint.current = { loc, x: e.clientX, y: e.clientY };
      return;
    }
    const { rel, cb, nodes } = measureRelative(stageRef.current, lay.targetLoc, scale);
    if (!rel || !nodes.length) return;
    drag.begin(e, { layout: lay, nodes, rect: rel, cb });
  };

  const onHandleDown = (e, handle) => {
    if (!layout || !selectedLoc) return;
    commitActiveField();
    const node = index.get(selectedLoc);
    const textual = isTextual(node);
    // Text scales through its `size` prop (works even when flow-positioned);
    // anything else resizes the layout target's width/height.
    const lay = textual || layout.targetLoc === selectedLoc ? { ...layout, targetLoc: selectedLoc, target: node } : layout;
    const { rel, cb, nodes } = measureRelative(stageRef.current, lay.targetLoc, scale);
    if (!rel || !nodes.length || rel.empty) return;
    drag.begin(e, { layout: lay, nodes, rect: rel, cb, handle, sizeMode: textual ? "size" : null });
  };

  const flowHint = useRef(null);
  const onPointerMove = (e) => {
    // Dragging a flow-positioned element: explain once instead of ignoring it.
    if (flowHint.current && e.buttons === 1 && Math.hypot(e.clientX - flowHint.current.x, e.clientY - flowHint.current.y) > 8) {
      const lay = layoutTarget(index, flowHint.current.loc);
      flowHint.current = null;
      onFlowDrag?.(lay);
    }
    if (drag.dragging) {
      drag.move(e);
      // center guides
      const { rect } = measureLoc(stageRef.current, layout?.targetLoc || selectedLoc, scale);
      if (rect) {
        const g = [];
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        if (Math.abs(cx - STAGE_W / 2) < 6) g.push({ axis: "x", at: STAGE_W / 2 });
        if (Math.abs(cy - STAGE_H / 2) < 6) g.push({ axis: "y", at: STAGE_H / 2 });
        setGuides(g);
      }
      return;
    }
    const loc = hitLoc(e);
    onHover(loc);
  };

  const onPointerUp = (e) => {
    flowHint.current = null;
    if (drag.dragging) drag.end(e);
  };

  useEffect(() => {
    if (!drag.dragging) setGuides([]);
  }, [drag.dragging]);

  // Palette drop (from the toolbar): compute stage coords.
  const onDrop = useCallback(
    (e) => {
      const kind = e.dataTransfer.getData("text/x-palette");
      if (!kind || !stageRef.current) return;
      e.preventDefault();
      const base = stageRef.current.getBoundingClientRect();
      onDropAt?.(kind, { x: (e.clientX - base.left) / scale, y: (e.clientY - base.top) / scale });
    },
    [onDropAt, scale],
  );

  const resizable = (() => {
    if (!layout || !selectedLoc) return false;
    // Text: corner handles only (edge handles would sit on the first/last
    // glyph and hijack a plain drag), scaling `size` — positioned or not.
    if (isTextual(index.get(selectedLoc))) return "corners";
    if (layout.kind === "locked" || layout.kind === "flow") return false;
    return true;
  })();

  const node = selectedLoc ? index.get(selectedLoc) : null;
  const label = node ? `${node.name}${layout?.via ? ` · moves <${layout.via}>` : layout?.kind === "flow" ? " · flow" : ""}` : null;

  return (
    <div
      className="ed-canvas"
      ref={wrapRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => !drag.dragging && onHover(null)}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("text/x-palette")) e.preventDefault();
      }}
      onDrop={onDrop}
    >
      <div
        className="ed-stage"
        ref={stageRef}
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          background: slide.meta.background || "var(--bg)",
        }}
      >
        <SlideBoundary key={mountKey}>
          <SlideProvider isActive={mode === "steps"} isPreview={mode === "final"} revealAll={mode === "final"} apiRef={apiRef}>
            <div className="slide-root">
              <slide.Component assets={slide.assets} />
            </div>
          </SlideProvider>
        </SlideBoundary>
        <Overlay
          stageRef={stageRef}
          scale={scale}
          selectedLoc={selectedLoc}
          hoverLoc={hoverLoc}
          targetLoc={layout?.targetLoc}
          layout={layout}
          resizable={resizable}
          onHandleDown={onHandleDown}
          tick={tick}
          guides={guides}
          label={label}
        />
      </div>
    </div>
  );
}

export class SlideBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidUpdate(prev) {
    if (prev.children !== this.props.children && this.state.error) this.setState({ error: null });
  }
  render() {
    if (this.state.error) {
      return (
        <div className="ed-error">
          slide failed to render
          <small>{String(this.state.error?.message || this.state.error)}</small>
        </div>
      );
    }
    return this.props.children;
  }
}
