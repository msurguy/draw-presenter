import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../styles/editor.css";
import { loadSlides } from "../deck/loadSlides.js";
import * as api from "../admin/api.js";
import Canvas, { STAGE_W, STAGE_H } from "./Canvas.jsx";
import { measureLoc, measureRelative } from "./Overlay.jsx";
import Layers from "./Layers.jsx";
import Inspector from "./Inspector.jsx";
import Palette from "./Palette.jsx";
import StepBar from "./StepBar.jsx";
import BuildPanel from "./BuildPanel.jsx";
import MetaPanel from "./MetaPanel.jsx";
import { indexTree, layoutTarget, styleNum, propNum } from "./layoutTarget.js";
import { snippetFor, annotateWrapper, appearWrapper } from "./palette.js";
import { GRID } from "./useDrag.js";

// ---------------------------------------------------------------------------
// Visual slide editor (#/admin/edit/<id>). Every commit writes the slide's
// .jsx on the server; Vite hot-swaps the module and the canvas (and any open
// deck tab) re-renders. The AST summary is re-fetched after each write.
// ---------------------------------------------------------------------------

const storeKey = (id) => `editor:${id}`;
const loadState = (id) => {
  try {
    return JSON.parse(sessionStorage.getItem(storeKey(id)) || "{}");
  } catch {
    return {};
  }
};

const LAYOUT_AFFECTING = new Set(["text", "font", "size", "width", "height", "charSpacing", "lineHeight", "align", "src", "type", "as"]);

export default function Editor({ slideId }) {
  const allSlides = useMemo(() => loadSlides(), []);
  const slide = allSlides.find((s) => s.id === slideId);
  const restored = useMemo(() => loadState(slideId), [slideId]);

  const [data, setData] = useState(null);
  const [selectedLoc, setSelectedLoc] = useState(restored.selectedLoc || null);
  const [hoverLoc, setHoverLoc] = useState(null);
  const [mode, setMode] = useState(restored.mode || "final");
  const [step, setStep] = useState(restored.step || 0);
  const [mountKey, setMountKey] = useState(0);
  const [tick, setTick] = useState(0);
  const [snap, setSnap] = useState(restored.snap ?? true);
  const [toast, setToast] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [files, setFiles] = useState([]);
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });
  const [rect, setRect] = useState(null);
  const apiRef = useRef(null);
  const stageQuery = useRef(null);

  const index = useMemo(() => indexTree(data?.root), [data]);
  const node = selectedLoc ? index.get(selectedLoc) : null;
  const layout = useMemo(() => (node ? layoutTarget(index, node.loc) : null), [index, node]);
  // Steps come from literal `step` props in the source, plus whatever the
  // mounted slide actually registered (a <Mermaid reveal="steps"> adds one
  // implicit step per block that the AST cannot see).
  const astMaxStep = useMemo(() => Math.max(0, ...Object.keys(data?.maxOrderByStep || {}).map(Number)), [data]);
  const [runtimeMaxStep, setRuntimeMaxStep] = useState(0);
  useEffect(() => setRuntimeMaxStep(0), [slideId]);
  useEffect(() => {
    const poll = () => {
      const m = apiRef.current?.maxStep?.();
      if (typeof m === "number") setRuntimeMaxStep((cur) => (cur === m ? cur : m));
    };
    const t = setInterval(poll, 500);
    return () => clearInterval(t);
  }, [slideId]);
  const maxStep = Math.max(astMaxStep, runtimeMaxStep);
  const declaredAssets = Array.isArray(data?.meta?.assets) ? data.meta.assets : [];
  const assets = { declared: declaredAssets, files };
  const slideIndex = allSlides.findIndex((s) => s.id === slideId);

  const notify = useCallback((msg, kind = "info") => setToast({ msg, kind }), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ---- persistence -----------------------------------------------------
  useEffect(() => {
    try {
      sessionStorage.setItem(storeKey(slideId), JSON.stringify({ selectedLoc, mode, step, snap }));
    } catch {
      /* ignore */
    }
  }, [slideId, selectedLoc, mode, step, snap]);

  // ---- data ------------------------------------------------------------
  const versionRef = useRef(null); // latest known on-disk version (never stale like render-captured data.version)
  const dataRef = useRef(null); // latest fetched tree, for multi-step actions whose closure captured an older one
  const refresh = useCallback(async () => {
    const d = await api.getSlideElements(slideId);
    versionRef.current = d?.version ?? null;
    dataRef.current = d;
    setData(d);
    return d;
  }, [slideId]);

  useEffect(() => {
    refresh().catch((e) => notify(e.message, "error"));
    api.listAssets().then((r) => setFiles(r.files || [])).catch(() => {});
  }, [refresh, notify]);

  // Drop a selection that no longer exists after a refetch.
  useEffect(() => {
    if (data && selectedLoc && !index.has(selectedLoc)) setSelectedLoc(null);
  }, [data, index, selectedLoc]);

  // ---- HMR: other writers + post-update re-measure ----------------------
  const refreshTimer = useRef(0);
  useEffect(() => {
    const hot = import.meta.hot;
    if (!hot) return;
    const onChanged = (d) => {
      if (d?.id !== slideId) return;
      clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => refresh().catch(() => {}), 150);
    };
    const onAfter = () => setTimeout(() => setTick((t) => t + 1), 30);
    hot.on("deck:slide-changed", onChanged);
    hot.on("vite:afterUpdate", onAfter);
    return () => {
      hot.off?.("deck:slide-changed", onChanged);
      hot.off?.("vite:afterUpdate", onAfter);
    };
  }, [slideId, refresh]);

  // Measured rect of the layout target for the inspector, relative to its
  // CSS containing block (what left/top actually mean).
  useEffect(() => {
    const st = stageQuery.current?.();
    if (!st || !selectedLoc) return setRect(null);
    const { rel } = measureRelative(st.el, layout?.targetLoc || selectedLoc, st.scale);
    setRect(rel);
  }, [selectedLoc, layout, tick, data, mountKey]);

  // ---- writes ----------------------------------------------------------
  // Writes are serialized and each one sends the version returned by the
  // previous write, so rapid commits (a color-picker drag) never race each
  // other into 409s. A 409 now means someone else wrote the file: reload and
  // retry once against the fresh version before giving up.
  const queueRef = useRef(Promise.resolve());
  const mutate = useCallback(
    (op, { remount = false, selectAfter = null } = {}) => {
      const task = async () => {
        try {
          let res;
          try {
            res = await op(versionRef.current);
          } catch (err) {
            if (err.status !== 409) throw err;
            await refresh();
            res = await op(versionRef.current);
          }
          if (res?.version) versionRef.current = res.version;
          await refresh();
          setSavedAt(Date.now());
          setHistory({ canUndo: true, canRedo: false });
          if (selectAfter) setSelectedLoc(selectAfter(res));
          if (remount) setMountKey((k) => k + 1);
          setTimeout(() => setTick((t) => t + 1), 60);
          return res;
        } catch (err) {
          if (err.status === 409) {
            await refresh().catch(() => {});
            notify("Slide changed on disk — reloaded. Try again.", "error");
          } else {
            notify(err.message, "error");
          }
          throw err;
        }
      };
      const p = queueRef.current.then(task, task);
      queueRef.current = p.catch(() => {});
      return p;
    },
    [refresh, notify],
  );

  const patch = useCallback(
    (loc, changes, opts = {}) => {
      const touched = [...Object.keys(changes.props || {}), ...Object.keys(changes.style || {}), ...(changes.text != null ? ["text"] : [])];
      const remount = opts.remount ?? touched.some((k) => LAYOUT_AFFECTING.has(k));
      return mutate((v) => api.patchElement(slideId, { loc, changes, expectVersion: v }), { remount }).catch(() => {});
    },
    [mutate, slideId],
  );

  const onDragCommit = useCallback(
    (lay, result) => {
      const t = lay.target;
      if (result.kind === "move") {
        if (lay.kind === "props") return patch(t.loc, { props: result.values }, { remount: false });
        return patch(t.loc, { style: result.values }, { remount: false });
      }
      // resize
      if (t.name === "HersheyText" || t.name === "BrushText") {
        const cur = propNum(t, "size") ?? (t.name === "BrushText" ? 120 : 96);
        const next = Math.max(8, Math.round(cur * result.scaleFactor));
        if (next === cur) return;
        return patch(t.loc, { props: { size: next } }, { remount: true });
      }
      const pos = {};
      if (result.movedLeft) pos.left = result.left;
      if (result.movedTop) pos.top = result.top;
      if (lay.kind === "props" || t.name === "Img" || t.name === "SvgIcon") {
        const props = {};
        if (t.name === "SvgIcon" && propNum(t, "width") == null && propNum(t, "height") == null) props.size = Math.round(Math.max(result.w, result.h));
        else {
          if (result.axis !== "y") props.width = result.w;
          if (result.axis !== "x") props.height = result.h;
        }
        if (result.movedLeft) props.x = result.left;
        if (result.movedTop) props.y = result.top;
        return patch(t.loc, { props }, { remount: true });
      }
      const style = { ...pos };
      if (result.axis !== "y") style.width = result.w;
      if (result.axis !== "x") style.height = result.h;
      return patch(t.loc, { style }, { remount: true });
    },
    [patch],
  );

  const nudge = useCallback(
    (dx, dy) => {
      if (!node || !layout) return;
      const t = layout.target;
      const st = stageQuery.current?.();
      const r = st ? measureRelative(st.el, t.loc, st.scale).rel : null;
      if (layout.kind === "props") {
        return patch(t.loc, { props: { x: (propNum(t, "x") ?? Math.round(r?.x ?? 0)) + dx, y: (propNum(t, "y") ?? Math.round(r?.y ?? 0)) + dy } }, { remount: false });
      }
      if (layout.kind !== "style") return;
      const { h, v } = layout.anchors;
      const style = {};
      if (dx) {
        if (h === "right") style.right = (styleNum(t, "right") ?? 0) - dx;
        else if (h === "left") style.left = (styleNum(t, "left") ?? Math.round(r?.x ?? 0)) + dx;
      }
      if (dy) {
        if (v === "bottom") style.bottom = (styleNum(t, "bottom") ?? 0) - dy;
        else if (v === "top") style.top = (styleNum(t, "top") ?? Math.round(r?.y ?? 0)) + dy;
      }
      if (Object.keys(style).length) patch(t.loc, { style }, { remount: false });
    },
    [node, layout, patch],
  );

  const convertAbsolute = useCallback(
    (n, lay) => {
      const targetLoc = lay.convertTargetLoc || n.loc;
      const st = stageQuery.current?.();
      if (!st) return;
      // left/top are relative to the target's containing block, not the stage.
      const { rel } = measureRelative(st.el, targetLoc, st.scale);
      if (!rel || rel.empty) return notify("Element has no size yet — try again in a moment.", "error");
      // Margins still apply to absolute boxes and would double the offset the
      // measured rect already includes — drop literal ones.
      const t = index.get(targetLoc);
      const style = { position: "absolute", left: Math.round(rel.x), top: Math.round(rel.y) };
      for (const k of ["margin", "marginTop", "marginLeft", "marginRight", "marginBottom"]) {
        if (t?.style?.entries?.some((e) => e.key === k)) style[k] = null;
      }
      patch(targetLoc, { style }, { remount: true });
    },
    [patch, notify, index],
  );

  const deleteNode = useCallback(
    (n) => {
      if (!n) return;
      if (n.children.length && !window.confirm(`Delete <${n.name}> and its ${n.children.length} child element(s)?`)) return;
      mutate((v) => api.deleteElement(slideId, { loc: n.loc, expectVersion: v }), { remount: true, selectAfter: (res) => res.parentLoc || null }).catch(() => {});
    },
    [mutate, slideId],
  );

  const nextOrder = () => ((dataRef.current || data)?.maxOrderByStep?.[0] ?? -1) + 1;

  // Declaring/uploading an asset inserts lines into meta.assets, above the
  // JSX, so every element loc held by the caller moves down. The server
  // reports the shift; these helpers keep the selection on the same element
  // and hand back the caller's `forLoc` remapped, so a follow-up patch (e.g.
  // setting the src prop) targets the element where it now lives.
  const shiftLocBy = (loc, shift) => {
    if (!loc || !shift?.lines) return loc;
    const [l, c] = loc.split(":").map(Number);
    return l >= shift.fromLine ? `${l + shift.lines}:${c}` : loc;
  };
  const selectedLocRef = useRef(selectedLoc);
  selectedLocRef.current = selectedLoc;
  const afterAssetShift = (res) => shiftLocBy(selectedLocRef.current, res?.shift);

  const declareFile = useCallback(
    async (assetPath, type, forLoc = null) => {
      const key = assetPath.replace(/^.*\//, "").replace(/\.[^.]+$/, "").replace(/[^\w]+/g, "_").replace(/^(\d)/, "a$1") || "asset";
      const existing = declaredAssets.find((a) => a.path === assetPath);
      if (existing) return { key: existing.key, loc: forLoc };
      let finalKey = key;
      let i = 2;
      while (declaredAssets.some((a) => a.key === finalKey)) finalKey = `${key}${i++}`;
      try {
        const res = await mutate(() => api.declareAsset(slideId, { key: finalKey, type, path: assetPath }), { remount: false, selectAfter: afterAssetShift });
        return { key: res.key, loc: shiftLocBy(forLoc, res.shift) };
      } catch {
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [declaredAssets, mutate, slideId],
  );

  const uploadFile = useCallback(
    async (file, type, forLoc = null) => {
      const key = file.name.replace(/\.[^.]+$/, "").replace(/[^\w]+/g, "_").replace(/^(\d)/, "a$1") || "asset";
      let finalKey = key;
      let i = 2;
      while (declaredAssets.some((a) => a.key === finalKey)) finalKey = `${key}${i++}`;
      try {
        const res = await mutate(() => api.uploadAsset(slideId, { key: finalKey, type, file }), { remount: false, selectAfter: afterAssetShift });
        api.listAssets().then((r) => setFiles(r.files || [])).catch(() => {});
        notify(`Uploaded ${res.path}`);
        return { key: res.key, path: res.path, loc: shiftLocBy(forLoc, res.shift) };
      } catch {
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [declaredAssets, mutate, slideId, notify],
  );

  const addElement = useCallback(
    async (kind, { assetKey = null, assetPath = null, declare = false, upload = null, at = null } = {}) => {
      const type = kind === "video" ? "video" : kind === "icon" ? "svg" : "image";
      if (upload) {
        const up = await uploadFile(upload, type);
        if (!up) return;
        if (type === "svg") assetPath = up.path; // server-sanitized, de-duplicated name
        else assetKey = up.key;
      } else if (declare && assetPath) {
        const dec = await declareFile(assetPath, type);
        if (!dec) return;
        assetKey = dec.key;
      }
      const probe = snippetFor(kind, { x: 0, y: 0, order: nextOrder(), assetKey, assetPath });
      const x = at ? at.x - probe.size.w / 2 : (STAGE_W - probe.size.w) / 2;
      const y = at ? at.y - probe.size.h / 2 : (STAGE_H - probe.size.h) / 2;
      const s = snippetFor(kind, {
        x: Math.round(x / GRID) * GRID,
        y: Math.round(y / GRID) * GRID,
        order: nextOrder(),
        assetKey,
        assetPath,
      });
      // Uploading/declaring an asset above rewrote meta.assets, which shifts
      // every line below it — read the root's loc from the refreshed tree, not
      // the one this closure captured before the upload.
      const rootLoc = (dataRef.current || data)?.rootLoc || null;
      mutate((v) => api.insertElement(slideId, { parentLoc: rootLoc, jsx: s.jsx, imports: s.imports, expectVersion: v }), {
        remount: true,
        selectAfter: (res) => res.loc,
      }).catch(() => {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutate, slideId, data, uploadFile, declareFile],
  );

  const annotate = useCallback(() => {
    if (!node) return;
    const w = annotateWrapper({ order: nextOrder() });
    mutate((v) => api.wrapElement(slideId, { loc: node.loc, ...w, expectVersion: v }), { remount: true, selectAfter: (res) => res.loc }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, mutate, slideId, data]);

  const wrapAppear = useCallback(
    (n) => {
      const w = appearWrapper({ order: nextOrder() });
      mutate((v) => api.wrapElement(slideId, { loc: n.loc, ...w, expectVersion: v }), { remount: true, selectAfter: (res) => res.loc }).catch(() => {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutate, slideId, data],
  );

  const undo = useCallback(
    (redo = false) => {
      const call = redo ? api.redoSlide : api.undoSlide;
      call(slideId)
        .then(async (res) => {
          await refresh();
          setHistory({ canUndo: res.canUndo, canRedo: res.canRedo });
          setMountKey((k) => k + 1);
          setSavedAt(Date.now());
        })
        .catch((e) => notify(e.message, "error"));
    },
    [slideId, refresh, notify],
  );

  const patchMeta = useCallback(
    (changes) => {
      api.patchMeta(slideId, changes).then(() => setSavedAt(Date.now())).catch((e) => notify(e.message, "error"));
    },
    [slideId, notify],
  );

  const deleteSlide = useCallback(() => {
    if (!window.confirm(`Delete slide "${slide?.meta.title || slideId}"? The file is moved to src/slides/_trash/.`)) return;
    api
      .deleteSlide(slideId)
      .then(() => {
        window.location.hash = "#/admin";
      })
      .catch((e) => notify(e.message, "error"));
  }, [slideId, slide, notify]);

  // ---- step preview -----------------------------------------------------
  const stepRef = useRef(step);
  stepRef.current = step;
  useEffect(() => {
    if (mode !== "steps") return;
    const t = setTimeout(() => apiRef.current?.showStep?.(stepRef.current), 80);
    return () => clearTimeout(t);
  }, [mode, mountKey, step]);

  const changeMode = (m) => {
    setMode(m);
    setMountKey((k) => k + 1);
  };
  const changeStep = (k) => {
    setStep(Math.max(0, Math.min(maxStep, k)));
    setMountKey((x) => x + 1);
  };

  // ---- keyboard -----------------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo(e.shiftKey);
        return;
      }
      if (!node) {
        if (e.key === "[" || e.key === "]") {
          if (mode === "steps") changeStep(step + (e.key === "]" ? 1 : -1));
        }
        return;
      }
      const n = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case "Delete":
        case "Backspace":
          e.preventDefault();
          deleteNode(node);
          break;
        case "Escape":
          setSelectedLoc(node.parentLoc || null);
          break;
        case "ArrowLeft":
          e.preventDefault();
          nudge(-n, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          nudge(n, 0);
          break;
        case "ArrowUp":
          e.preventDefault();
          nudge(0, -n);
          break;
        case "ArrowDown":
          e.preventDefault();
          nudge(0, n);
          break;
        case "[":
        case "]":
          if (mode === "steps") changeStep(step + (e.key === "]" ? 1 : -1));
          break;
        default:
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, nudge, deleteNode, undo, mode, step, maxStep]);

  if (!slide) {
    return (
      <div className="ed-empty">
        Unknown slide “{slideId}”. <a href="#/admin">Back to admin</a>
      </div>
    );
  }

  const prevSlide = allSlides[slideIndex - 1];
  const nextSlide = allSlides[slideIndex + 1];

  return (
    <div className="editor">
      <header className="ed-header">
        <a href="#/admin">← Admin</a>
        <div className="ed-btngroup">
          <button className="ed-btn small" disabled={!prevSlide} onClick={() => (window.location.hash = `#/admin/edit/${prevSlide.id}`)}>
            ‹
          </button>
          <button className="ed-btn small" disabled={!nextSlide} onClick={() => (window.location.hash = `#/admin/edit/${nextSlide.id}`)}>
            ›
          </button>
        </div>
        <h1 title={`src/slides/${slideId}.jsx`}>
          {slideIndex + 1}. {slide.meta.title}
        </h1>
        <a href={`#/slide/${slideIndex}`} target="_blank" rel="noreferrer" title="open this slide in the deck (new tab)">
          Open in deck ↗
        </a>
        <span className="spacer" />
        <span className="ed-saved">{savedAt ? `saved ${new Date(savedAt).toLocaleTimeString()}` : "no changes yet"}</span>
        <div className="ed-btngroup">
          <button className="ed-btn small" onClick={() => undo(false)} disabled={!history.canUndo} title="⌘Z">
            Undo
          </button>
          <button className="ed-btn small" onClick={() => undo(true)} disabled={!history.canRedo} title="⇧⌘Z">
            Redo
          </button>
        </div>
        <BuildPanel notify={notify} />
      </header>

      <div className="ed-body">
        <aside className="ed-left">
          <div className="ed-section" style={{ padding: "8px 12px 4px" }}>
            <h3>Layers</h3>
          </div>
          <Layers root={data?.root} selectedLoc={selectedLoc} hoverLoc={hoverLoc} onSelect={setSelectedLoc} onHover={setHoverLoc} />
          <div className="ed-slidelist">
            {allSlides.map((s, i) => (
              <a key={s.id} href={`#/admin/edit/${s.id}`} className={s.id === slideId ? "current" : ""}>
                <span className="num">{i + 1}</span>
                {s.meta.title}
              </a>
            ))}
          </div>
        </aside>

        <div className="ed-center">
          <Palette
            assets={assets}
            hasSelection={!!node}
            onAdd={(kind, opts) => addElement(kind, opts)}
            onAnnotate={annotate}
            snap={snap}
            onToggleSnap={() => setSnap((v) => !v)}
            onRemount={() => setMountKey((k) => k + 1)}
          />
          <CanvasHost
            stageQuery={stageQuery}
            slide={slide}
            mountKey={mountKey}
            mode={mode}
            apiRef={apiRef}
            index={index}
            selectedLoc={selectedLoc}
            hoverLoc={hoverLoc}
            layout={layout}
            onSelect={setSelectedLoc}
            onHover={setHoverLoc}
            onDragCommit={onDragCommit}
            snap={snap}
            tick={tick}
            onDropAt={(kind, at) => addElement(kind, { at })}
            onFlowDrag={(lay) =>
              notify(
                lay.kind === "locked"
                  ? `Not movable: ${lay.reason}`
                  : "This element is positioned by flow — use “Convert to absolute position” in the inspector to drag it (corner handles still resize).",
              )
            }
          />
          <StepBar
            mode={mode}
            step={step}
            maxStep={maxStep}
            onMode={changeMode}
            onStep={changeStep}
            onPlay={() => apiRef.current?.showStep?.(step, { animate: true })}
          />
        </div>

        <aside className="ed-right">
          <Inspector
            key={node?.loc || "none"}
            node={node}
            index={index}
            layout={layout}
            rect={rect}
            assets={assets}
            onPatch={patch}
            onSelect={setSelectedLoc}
            onConvertAbsolute={convertAbsolute}
            onWrapAppear={wrapAppear}
            onDelete={deleteNode}
            onUpload={uploadFile}
            onDeclare={declareFile}
          />
          {!node && <MetaPanel meta={data?.meta} onPatchMeta={patchMeta} onDeleteSlide={deleteSlide} />}
        </aside>
      </div>

      {toast && <div className={`ed-toast${toast.kind === "error" ? " error" : ""}`}>{toast.msg}</div>}
    </div>
  );
}

// Thin wrapper exposing the stage element + scale to the editor for measuring.
function CanvasHost({ stageQuery, ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    stageQuery.current = () => {
      const el = ref.current?.querySelector(".ed-stage");
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { el, scale: r.width / STAGE_W };
    };
    return () => {
      stageQuery.current = null;
    };
  }, [stageQuery]);
  return (
    <div ref={ref} style={{ display: "contents" }}>
      <Canvas {...props} />
    </div>
  );
}
