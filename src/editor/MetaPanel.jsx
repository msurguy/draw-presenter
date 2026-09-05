import React from "react";
import { Row, TextField, NumberField, SelectField, ColorField } from "./fields.jsx";
import { transitionOptions, transitionParamFields, pruneParams } from "../transitions/registry.js";

// Slide-level settings from `export const meta`. Saving triggers a full
// reload (meta is not hot-swapped), so edits here are deliberate.
export default function MetaPanel({ meta, onPatchMeta, onDeleteSlide }) {
  if (!meta) return null;
  const t = meta.transition && !meta.transition.__expr ? meta.transition : {};
  const kind = t.kind ?? "fade";
  const params = t.params && !t.params.__expr && typeof t.params === "object" ? t.params : {};
  const paramsLocked = !!(t.params && t.params.__expr);
  const fields = transitionParamFields(kind);
  const titleValue = typeof meta.title === "string" ? meta.title : "";
  const bg = typeof meta.background === "string" ? meta.background : undefined;

  const patchTransition = (changes) => {
    const next = { ...t, kind: t.kind || "fade", ...changes };
    if (next.duration == null) delete next.duration;
    if (!next.params || !Object.keys(next.params).length) delete next.params;
    onPatchMeta({ transition: next });
  };
  const setKind = (v) => {
    const nextKind = v || "fade";
    patchTransition({ kind: nextKind, params: paramsLocked ? t.params : pruneParams(nextKind, params) });
  };
  const setParam = (key, v) => {
    const next = { ...params };
    if (v === null || v === undefined || v === "") delete next[key];
    else next[key] = v;
    patchTransition({ params: next });
  };

  return (
    <div className="ed-section">
      <h3>Slide</h3>
      <Row label="Title">
        <TextField value={titleValue} onCommit={(v) => onPatchMeta({ title: v ?? "" })} />
      </Row>
      <Row label="Background">
        <ColorField value={bg} allowEmpty placeholder="var(--bg)" onCommit={(v) => onPatchMeta({ background: v })} />
      </Row>
      <Row label="Transition out" hint="Plays when leaving this slide for the next one. Coming back to this slide plays it in reverse.">
        <SelectField value={kind} options={transitionOptions()} onCommit={setKind} />
      </Row>
      <Row label="Duration (s)">
        <NumberField value={t.duration} step={0.1} min={0} placeholder="0.7" onCommit={(v) => patchTransition({ duration: v ?? undefined })} />
      </Row>
      {paramsLocked && <div className="ed-note">Transition params are an expression — edit in code.</div>}
      {!paramsLocked &&
        fields.map((f) => (
          <Row key={f.key} label={f.label} hint={f.hint}>
            {f.type === "number" && (
              <NumberField
                value={typeof params[f.key] === "number" ? params[f.key] : undefined}
                step={f.step}
                min={f.min}
                max={f.max}
                placeholder={f.def}
                onCommit={(v) => setParam(f.key, v)}
              />
            )}
            {f.type === "select" && (
              <SelectField
                value={params[f.key] ?? null}
                options={f.options}
                allowEmpty
                placeholder={String(f.def)}
                onCommit={(v) => setParam(f.key, v)}
              />
            )}
            {f.type === "color" && (
              <ColorField
                value={typeof params[f.key] === "string" ? params[f.key] : undefined}
                allowEmpty
                placeholder={f.def}
                onCommit={(v) => setParam(f.key, v)}
              />
            )}
          </Row>
        ))}
      <div className="ed-note">Plays going to the next slide; reversed when returning here. The last slide's transition is never used.</div>
      {kind.endsWith("-shader") && <div className="ed-note">Shader transitions need WebGPU; they fall back to a DOM crossfade/clip without it.</div>}
      <div className="ed-note">Saving slide settings reloads the page.</div>
      <button className="ed-btn danger small" onClick={onDeleteSlide}>
        Delete slide…
      </button>
    </div>
  );
}
