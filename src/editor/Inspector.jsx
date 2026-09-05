import React, { useState } from "react";
import { Row, NumberField, TextField, TextArea, SelectField, BoolField, ColorField, ExprField } from "./fields.jsx";
import { schemaFor, HOST_STYLE_FIELDS, ANIMATED } from "./schema.js";
import { ancestors, animationOwner, propEntry, styleEntry, styleNum, propNum } from "./layoutTarget.js";

const OBJECT_DEFAULTS = {
  BrushReveal: { brush: { name: "marker", color: "#ffcc33" } },
  BrushText: { brush: { name: "marker", color: "#ffcc33", weight: 1.2 } },
};

// Read a (possibly dotted) prop from the AST summary.
function readProp(node, name) {
  const [head, key] = name.split(".");
  const p = propEntry(node, head);
  if (!p) return { value: undefined, editable: true, present: false };
  if (!p.editable) return { value: undefined, editable: false, raw: p.raw, present: true };
  if (!key) return { value: p.value, editable: true, present: true };
  if (p.kind !== "object") return { value: undefined, editable: false, raw: p.raw, present: true };
  return { value: p.value?.[key], editable: true, present: true, parent: p.value };
}

function writeProp(node, name, value) {
  const [head, key] = name.split(".");
  if (!key) return { [head]: value };
  const cur = readProp(node, name);
  const base = cur.parent || OBJECT_DEFAULTS[node.name]?.[head] || {};
  const next = { ...base };
  if (value === null || value === undefined) delete next[key];
  else next[key] = value;
  return { [head]: next };
}

function Field({ field, value, editable, raw, onCommit, onCommitAt, assets, node, onUpload, onDeclare }) {
  // Asset props are normally expressions (`src={assets.key}`); the picker
  // understands those, so it must not fall through to the read-only view.
  if (!editable && field.type !== "asset") return <ExprField raw={raw} />;
  const common = { value, onCommit, placeholder: field.placeholder ?? field.def, disabled: false };
  switch (field.type) {
    case "number":
      return <NumberField {...common} step={field.step} min={field.min} max={field.max} />;
    case "text":
      return <TextField {...common} />;
    case "textarea":
      return <TextArea value={value ?? ""} rows={field.rows} onCommit={onCommit} />;
    case "select":
      return <SelectField {...common} options={field.options} allowEmpty={field.allowEmpty || field.def === undefined} placeholder={field.placeholder ?? field.def} />;
    case "bool":
      return <BoolField value={value} onCommit={onCommit} def={!!field.def} />;
    case "color":
      return <ColorField {...common} hexOnly={field.hexOnly} allowEmpty={field.allowEmpty} live />;
    case "asset":
      return <AssetField field={field} node={node} assets={assets} onCommit={onCommit} onCommitAt={onCommitAt} onUpload={onUpload} onDeclare={onDeclare} />;
    default:
      return null;
  }
}

const ASSET_DIR = { image: "/assets/images/", svg: "/assets/icons/", video: "/assets/video/" };

function AssetField({ field, node, assets, onCommit, onCommitAt, onUpload, onDeclare }) {
  const p = propEntry(node, field.name);
  const current = p ? (p.kind === "expr" ? p.raw : String(p.value ?? "")) : "";
  const declared = (assets.declared || []).filter((a) => a.type === field.assetType || (field.assetType === "svg" && a.type === "image"));
  const files = (assets.files || []).filter((f) => f.path.startsWith(ASSET_DIR[field.assetType] || "/assets/"));
  const options = [
    ...declared.map((a) => ({ value: `assets.${a.key}`, label: `assets.${a.key} → ${a.path.replace(/^.*\//, "")}` })),
    ...files.map((f) => ({ value: f.path, label: f.path.replace("/assets/", "") })),
  ];
  const commit = async (v) => {
    if (v == null) return onCommit(null);
    if (v.startsWith("assets.")) return onCommit({ __expr: v });
    if (field.assetType === "svg") return onCommit(v); // icons are referenced by path (skill idiom)
    // Declare the file in meta.assets, then reference it. Declaring shifts
    // the element's loc (lines added above), so patch the remapped one.
    const dec = await onDeclare(v, field.assetType, node.loc);
    if (dec) onCommitAt(dec.loc, { __expr: `assets.${dec.key}` });
  };
  return (
    <span className="ed-control" style={{ flexDirection: "column", alignItems: "stretch", gap: 4 }}>
      <SelectField value={current || null} onCommit={commit} options={options} allowEmpty placeholder="none" />
      <label className="ed-btn small" style={{ textAlign: "center" }}>
        Upload…
        <input
          type="file"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const up = await onUpload(file, field.assetType, node.loc);
            if (!up) return;
            if (field.assetType === "svg") onCommitAt(up.loc, up.path);
            else onCommitAt(up.loc, { __expr: `assets.${up.key}` });
          }}
        />
      </label>
    </span>
  );
}

export default function Inspector({
  node,
  index,
  layout,
  rect,
  assets,
  onPatch,
  onSelect,
  onConvertAbsolute,
  onWrapAppear,
  onDelete,
  onUpload,
  onDeclare,
}) {
  const [addKey, setAddKey] = useState("");
  if (!node) {
    return (
      <div className="ed-empty">
        Click an element on the canvas or in the layers list to inspect it.
        <br />
        <br />
        Drag to move · <kbd>⌫</kbd> delete · <kbd>⌘Z</kbd> undo · arrows nudge · <kbd>Esc</kbd> select parent
      </div>
    );
  }

  const schema = schemaFor(node.name);
  const isHost = node.kind === "host";
  const patchProps = (props, opts) => onPatch(node.loc, { props }, opts);
  const patchStyle = (style, opts) => onPatch(node.loc, { style }, opts);
  const field = (f, target = node, patch = patchProps) => {
    const r = readProp(target, f.name);
    return (
      <Row key={f.name} label={f.label} hint={f.hint ? `${f.name} — ${f.hint}` : f.name} wide={!!f.wide}>
        <Field
          field={f}
          value={r.value}
          editable={r.editable}
          raw={r.raw}
          node={target}
          assets={assets}
          onUpload={onUpload}
          onDeclare={onDeclare}
          onCommit={(v) => patch(writeProp(target, f.name, v), { remount: f.type !== "color" })}
          onCommitAt={(loc, v) => onPatch(loc, { props: writeProp(target, f.name, v) }, { remount: true })}
        />
      </Row>
    );
  };

  const styleField = (f) => {
    const e = styleEntry(node, f.key || f.name);
    return (
      <Row key={f.name} label={f.label} hint={`style.${f.name}`}>
        <Field field={f} value={e?.editable ? e.value : undefined} editable={!e || e.editable} raw={e?.raw} node={node} onCommit={(v) => patchStyle({ [f.name]: v }, { remount: true })} />
      </Row>
    );
  };

  const crumbs = ancestors(index, node.loc);
  const owner = animationOwner(index, node.loc, ANIMATED);
  const target = layout?.target;
  const textEditable = node.text && node.text.editable && (schema?.text || isHost || node.name === "BrushReveal");

  // ---- layout section -------------------------------------------------
  const layoutSection = () => {
    if (!layout) return null;
    const t = target;
    const num = (label, key, value, onCommit, placeholder) => (
      <Row key={key} label={label}>
        <NumberField value={value} onCommit={onCommit} step={1} placeholder={placeholder} />
      </Row>
    );
    if (layout.kind === "props") {
      return (
        <>
          <div className="ed-pair">
            {num("X", "x", propNum(t, "x"), (v) => onPatch(t.loc, { props: { x: v } }), Math.round(rect?.x ?? 0))}
            {num("Y", "y", propNum(t, "y"), (v) => onPatch(t.loc, { props: { y: v } }), Math.round(rect?.y ?? 0))}
          </div>
          <div className="ed-pair">
            {num("W", "w", propNum(t, "width") ?? propNum(t, "size"), (v) => onPatch(t.loc, { props: { width: v } }, { remount: true }), Math.round(rect?.w ?? 0))}
            {num("H", "h", propNum(t, "height"), (v) => onPatch(t.loc, { props: { height: v } }, { remount: true }), Math.round(rect?.h ?? 0))}
          </div>
        </>
      );
    }
    if (layout.kind === "style") {
      const { h, v } = layout.anchors;
      const ws = (key, v2) => onPatch(t.loc, { style: { [key]: v2 } });
      return (
        <>
          {t.loc !== node.loc && (
            <div className="ed-note">
              Position lives on <button className="link" onClick={() => onSelect(t.loc)}>{`<${t.name}> ${t.loc}`}</button>
            </div>
          )}
          <div className="ed-pair">
            {h === "both"
              ? num("L", "left", styleNum(t, "left"), (x) => ws("left", x))
              : h === "right"
                ? num("R", "right", styleNum(t, "right"), (x) => ws("right", x))
                : num("X", "left", styleNum(t, "left"), (x) => ws("left", x), Math.round(rect?.x ?? 0))}
            {v === "both"
              ? num("T", "top", styleNum(t, "top"), (x) => ws("top", x))
              : v === "bottom"
                ? num("B", "bottom", styleNum(t, "bottom"), (x) => ws("bottom", x))
                : num("Y", "top", styleNum(t, "top"), (x) => ws("top", x), Math.round(rect?.y ?? 0))}
          </div>
          {h === "both" && num("R", "right", styleNum(t, "right"), (x) => ws("right", x))}
          {v === "both" && num("B", "bottom", styleNum(t, "bottom"), (x) => ws("bottom", x))}
          <div className="ed-pair">
            {num("W", "width", styleNum(t, "width"), (x) => onPatch(t.loc, { style: { width: x } }, { remount: true }), Math.round(rect?.w ?? 0))}
            {num("H", "height", styleNum(t, "height"), (x) => onPatch(t.loc, { style: { height: x } }, { remount: true }), Math.round(rect?.h ?? 0))}
          </div>
          {(h === "right" || v === "bottom") && (
            <div className="ed-note">
              Anchored to the {h === "right" ? "right" : ""}
              {h === "right" && v === "bottom" ? " / " : ""}
              {v === "bottom" ? "bottom" : ""} edge.{" "}
              <button
                className="link"
                onClick={() =>
                  onPatch(t.loc, {
                    style: {
                      ...(h === "right" ? { right: null, left: Math.round(rect?.x ?? 0) } : {}),
                      ...(v === "bottom" ? { bottom: null, top: Math.round(rect?.y ?? 0) } : {}),
                    },
                  })
                }
              >
                Anchor to top-left
              </button>
            </div>
          )}
          {layout.warnings.map((w) => (
            <div key={w} className="ed-note" style={{ color: "var(--accent)" }}>
              ⚠ {w}
            </div>
          ))}
        </>
      );
    }
    if (layout.kind === "flow") {
      return (
        <>
          <div className="ed-note">
            {layout.reason}. Measured at {Math.round(rect?.x ?? 0)}, {Math.round(rect?.y ?? 0)} ({Math.round(rect?.w ?? 0)}×{Math.round(rect?.h ?? 0)}).
          </div>
          {layout.container && layout.container.loc !== node.parentLoc && (
            <div className="ed-note">
              Container: <button className="link" onClick={() => onSelect(layout.container.loc)}>{`<${layout.container.name}> ${layout.container.loc}`}</button>
            </div>
          )}
          {layout.inline ? (
            <div className="ed-note">This is a run of words inside its paragraph — drag the paragraph's container instead.</div>
          ) : (
            <button
              className="ed-btn small"
              onClick={() => onConvertAbsolute(node, layout, rect)}
              disabled={!rect}
              title={layout.convertTargetLoc !== node.loc ? `positions the wrapper at ${layout.convertTargetLoc}` : undefined}
            >
              Convert to absolute position{layout.convertTargetLoc !== node.loc ? " (wrapper)" : ""}
            </button>
          )}
        </>
      );
    }
    return <div className="ed-note">Not movable: {layout.reason}</div>;
  };

  // ---- animation section -----------------------------------------------
  const animationSection = () => {
    if (schema?.animation?.length) return schema.animation.map((f) => field(f));
    if (owner && owner.loc !== node.loc) {
      const os = schemaFor(owner.name);
      return (
        <>
          <div className="ed-note">
            Animated by <button className="link" onClick={() => onSelect(owner.loc)}>{`<${owner.name}> ${owner.loc}`}</button>
          </div>
          {os?.animation?.map((f) => field(f, owner, (props, opts) => onPatch(owner.loc, { props }, opts)))}
        </>
      );
    }
    return (
      <>
        <div className="ed-note">No entrance animation — this element is visible from the start.</div>
        <button className="ed-btn small" onClick={() => onWrapAppear(node)}>
          Wrap in &lt;Appear&gt;
        </button>
      </>
    );
  };

  return (
    <>
      <div className="ed-insp-head">
        <span className="name">{node.name}</span>
        <span className="loc">{node.loc}</span>
        <div className="ed-crumbs">
          {crumbs.map((c, i) => (
            <React.Fragment key={c.loc}>
              {i > 0 && <span className="sep">›</span>}
              <button className={c.loc === node.loc ? "current" : ""} onClick={() => c.loc !== node.loc && onSelect(c.loc)}>
                {c.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="ed-badges">
          {node.repeated && <span className="ed-badge warn">repeated (loop)</span>}
          {node.conditional && <span className="ed-badge">conditional</span>}
          {node.hasSpreadProps && <span className="ed-badge">spread props</span>}
          {node.props.some((p) => !p.editable) && <span className="ed-badge">{node.props.filter((p) => !p.editable).length} expression prop(s)</span>}
        </div>
      </div>

      <div className="ed-section">
        <h3>Layout</h3>
        {layoutSection()}
      </div>

      {node.text && (
        <div className="ed-section">
          <h3>Content</h3>
          {textEditable ? (
            <TextArea value={node.text.value ?? ""} onCommit={(v) => onPatch(node.loc, { text: v }, { remount: true })} />
          ) : (
            <div className="ed-note">Mixed content (elements inside text) — edit the children individually.</div>
          )}
        </div>
      )}

      {(schema?.appearance?.length || isHost) && (
        <div className="ed-section">
          <h3>Appearance</h3>
          {schema?.appearance?.map((f) => field(f))}
          {isHost && HOST_STYLE_FIELDS.map(styleField)}
        </div>
      )}

      {node.style && node.style.editable && (
        <div className="ed-section">
          <h3>
            Style <span className="right">{node.style.hasSpread ? "(+ spread)" : ""}</span>
          </h3>
          <div className="ed-stylelist">
            {node.style.entries.map((e) => (
              <div key={e.key} className="entry">
                <span className="k" title={e.key}>
                  {e.key}
                </span>
                {e.editable ? (
                  e.kind === "number" ? (
                    <NumberField value={e.value} onCommit={(v) => patchStyle({ [e.key]: v }, { remount: true })} />
                  ) : (
                    <TextField value={String(e.value ?? "")} onCommit={(v) => patchStyle({ [e.key]: v }, { remount: true })} mono />
                  )
                ) : (
                  <ExprField raw={e.raw} />
                )}
                <button className="x" title="remove" onClick={() => patchStyle({ [e.key]: null }, { remount: true })}>
                  ×
                </button>
              </div>
            ))}
            <div className="entry">
              <input className="ed-input mono" placeholder="add key…" value={addKey} onChange={(e) => setAddKey(e.target.value)} />
              <button
                className="ed-btn small"
                disabled={!addKey.trim()}
                onClick={() => {
                  const k = addKey.trim();
                  setAddKey("");
                  patchStyle({ [k]: "" }, { remount: true });
                }}
              >
                add
              </button>
              <span />
            </div>
          </div>
        </div>
      )}

      <div className="ed-section">
        <h3>Animation</h3>
        {animationSection()}
      </div>

      <div className="ed-section">
        <button className="ed-btn danger" onClick={() => onDelete(node)}>
          Delete element
        </button>
      </div>
    </>
  );
}
