import React, { useEffect, useRef, useState } from "react";
import { COLOR_TOKENS } from "./schema.js";

// Small controlled inputs. Text/number commit on blur or Enter; selects and
// checkboxes commit immediately. `value === undefined` shows the placeholder
// (prop absent → component default).

export function Row({ label, children, hint, wide = false }) {
  return (
    <label className={wide ? "ed-row wide" : "ed-row"} title={hint || undefined}>
      <span className="ed-label">{label}</span>
      <span className="ed-control">{children}</span>
    </label>
  );
}

function useDraft(value) {
  const [draft, setDraft] = useState(value ?? "");
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value ?? "");
  }, [value]);
  return [draft, setDraft, focused];
}

export function NumberField({ value, onCommit, step = 1, min, max, placeholder, disabled }) {
  const [draft, setDraft, focused] = useDraft(value);
  const commit = () => {
    const raw = String(draft).trim();
    if (raw === "") {
      if (value !== undefined && value !== null) onCommit(null);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      setDraft(value ?? "");
      return;
    }
    if (n !== value) onCommit(n);
  };
  return (
    <input
      type="number"
      className="ed-input"
      value={draft}
      step={step}
      min={min}
      max={max}
      placeholder={placeholder != null ? String(placeholder) : ""}
      disabled={disabled}
      onFocus={() => (focused.current = true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        focused.current = false;
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.target.blur();
        if (e.key === "Escape") {
          setDraft(value ?? "");
          e.target.blur();
        }
      }}
    />
  );
}

export function TextField({ value, onCommit, placeholder, disabled, mono }) {
  const [draft, setDraft, focused] = useDraft(value);
  const commit = () => {
    const v = String(draft);
    if (v === "" && (value === undefined || value === null)) return;
    if (v === "" ) return onCommit(null);
    if (v !== value) onCommit(v);
  };
  return (
    <input
      type="text"
      className={`ed-input${mono ? " mono" : ""}`}
      value={draft}
      placeholder={placeholder || ""}
      disabled={disabled}
      onFocus={() => (focused.current = true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        focused.current = false;
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.target.blur();
        if (e.key === "Escape") {
          setDraft(value ?? "");
          e.target.blur();
        }
      }}
    />
  );
}

export function TextArea({ value, onCommit, disabled, rows = 3 }) {
  const [draft, setDraft, focused] = useDraft(value);
  return (
    <textarea
      className="ed-input ed-textarea"
      rows={rows}
      value={draft}
      disabled={disabled}
      onFocus={() => (focused.current = true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        focused.current = false;
        if (draft !== value) onCommit(draft);
      }}
      onKeyDown={(e) => {
        // Enter commits (like the other fields); Shift+Enter inserts a newline.
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          e.target.blur();
        }
        if (e.key === "Escape") {
          setDraft(value ?? "");
          e.target.blur();
        }
      }}
    />
  );
}

export function SelectField({ value, onCommit, options, allowEmpty, placeholder, disabled }) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const known = opts.some((o) => o.value === value);
  return (
    <select
      className="ed-input"
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onCommit(e.target.value === "" ? null : e.target.value)}
    >
      {(allowEmpty || value == null) && <option value="">{placeholder ? `(${placeholder})` : "(default)"}</option>}
      {!known && value != null && <option value={value}>{String(value)}</option>}
      {opts.some((o) => o.group)
        ? [...new Set(opts.map((o) => o.group || ""))].map((g) => (
            <optgroup key={g || "_"} label={g}>
              {opts
                .filter((o) => (o.group || "") === g)
                .map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
            </optgroup>
          ))
        : opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
    </select>
  );
}

export function BoolField({ value, onCommit, disabled, def = false }) {
  const checked = value == null ? def : !!value;
  return (
    <input
      type="checkbox"
      className="ed-check"
      checked={checked}
      disabled={disabled}
      onChange={(e) => {
        const next = e.target.checked;
        // Writing the default → drop the prop; else write true / false.
        onCommit(next === def ? null : next);
      }}
    />
  );
}

function resolveCss(value) {
  if (!value) return "";
  const m = String(value).match(/^var\((--[\w-]+)\)$/);
  if (!m) return value;
  return getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() || "";
}

// Color swatches fire `input` on every drag tick. Committing each tick floods
// the server (stale-version 409s, dropped final value) and, for slide meta,
// reloads the page mid-drag. So: the native `change` event (picker closed /
// value confirmed) is the one commit that always lands; `live` additionally
// commits a debounced preview while dragging (element props only).
export function ColorField({ value, onCommit, hexOnly, allowEmpty, disabled, placeholder, live = false }) {
  const [draft, setDraft, focused] = useDraft(value);
  const swatchRef = useRef(null);
  const timer = useRef(0);
  const lastSent = useRef(value);
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;
  useEffect(() => {
    lastSent.current = value;
  }, [value]);

  const send = (v) => {
    clearTimeout(timer.current);
    timer.current = 0;
    if (v === lastSent.current) return;
    lastSent.current = v;
    commitRef.current(v);
  };

  useEffect(() => {
    const el = swatchRef.current;
    if (!el) return;
    const onChange = (e) => {
      focused.current = false;
      send(e.target.value);
    };
    el.addEventListener("change", onChange);
    return () => {
      el.removeEventListener("change", onChange);
      clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolved = resolveCss(draft || placeholder);
  const isToken = COLOR_TOKENS.some((t) => t.value === draft);
  const commitText = () => {
    const v = String(draft).trim();
    if (v === "") {
      if (value != null) onCommit(null);
      return;
    }
    if (v !== value) onCommit(v);
  };
  return (
    <span className="ed-color">
      <input
        ref={swatchRef}
        type="color"
        className="ed-swatch"
        value={/^#[0-9a-f]{6}$/i.test(resolved) ? resolved : "#000000"}
        disabled={disabled}
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false;
          if (timer.current) send(draft);
        }}
        onChange={(e) => {
          const v = e.target.value;
          focused.current = true; // keep prop refreshes from snapping the draft back mid-drag
          setDraft(v);
          if (!live) return;
          clearTimeout(timer.current);
          timer.current = setTimeout(() => send(v), 200);
        }}
        title={resolved || "pick a color"}
      />
      {!hexOnly && (
        <select
          className="ed-input ed-token"
          value={isToken ? draft : ""}
          disabled={disabled}
          title="palette token"
          onChange={(e) => {
            if (!e.target.value) return;
            setDraft(e.target.value);
            onCommit(e.target.value);
          }}
        >
          <option value="">{isToken ? "token" : "custom"}</option>
          {COLOR_TOKENS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      )}
      <input
        type="text"
        className="ed-input mono"
        value={draft}
        placeholder={placeholder || (allowEmpty ? "inherit" : "#hex or var(--x)")}
        disabled={disabled}
        onFocus={() => (focused.current = true)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          focused.current = false;
          commitText();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.target.blur();
        }}
      />
    </span>
  );
}

export function ExprField({ raw }) {
  return (
    <code className="ed-expr" title="expression — edit in code">
      {raw}
    </code>
  );
}
