import React, { useEffect, useState } from "react";
import SlideThumb from "./SlideThumb.jsx";

const ID_RE = /^[\w-]+$/;

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

/** `NN-slug`, numbered after the last slide and de-duplicated against disk. */
function suggestId(title, existingIds) {
  const n = String(existingIds.length + 1).padStart(2, "0");
  const base = `${n}-${slugify(title) || "slide"}`;
  let id = base;
  let i = 2;
  while (existingIds.includes(id)) id = `${base}-${i++}`;
  return id;
}

// "New slide" dialog: pick a template (live thumbnails of src/templates/),
// name it, and hand off to the visual editor.
export default function NewSlideModal({ templates, existingIds, afterSlide, onClose, onCreate }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "blank");
  const [title, setTitle] = useState("");
  const [idDraft, setIdDraft] = useState(null); // null → follows the title
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const tpl = templates.find((t) => t.id === templateId);
  const effectiveTitle = title.trim() || tpl?.name || "New slide";
  const id = idDraft ?? suggestId(effectiveTitle, existingIds);
  const idValid = ID_RE.test(id);
  const idTaken = existingIds.includes(id);
  const canCreate = idValid && !idTaken && !busy;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!canCreate) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate({ id, title: effectiveTitle, template: templateId });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div
      className="admin-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="admin-modal" onSubmit={submit}>
        <header>
          <h2>New slide</h2>
          <span className="hint">pick a template, name it, then fine-tune it in the visual editor</span>
          <button type="button" className="ed-btn small" onClick={onClose} title="close (Esc)">
            ✕
          </button>
        </header>

        <div className="tpl-grid">
          {templates.map((t) => (
            <button
              type="button"
              key={t.id}
              className={`tpl-card${t.id === templateId ? " selected" : ""}`}
              onClick={() => setTemplateId(t.id)}
              onDoubleClick={submit}
              title={`src/templates/${t.id}.jsx`}
            >
              <SlideThumb slide={t.slide} />
              <div className="caption">
                <span className="title">{t.name}</span>
                <span className="desc">{t.description}</span>
              </div>
            </button>
          ))}
          {!templates.length && <div className="admin-form-note">no templates found in src/templates/</div>}
        </div>

        <div className="admin-form">
          <label className="ed-row">
            <span className="ed-label">Title</span>
            <span className="ed-control">
              <input
                className="ed-input"
                autoFocus
                value={title}
                placeholder={tpl?.name || "New slide"}
                onChange={(e) => setTitle(e.target.value)}
              />
            </span>
          </label>
          <label className="ed-row">
            <span className="ed-label">File id</span>
            <span className="ed-control">
              <input className="ed-input mono" value={id} onChange={(e) => setIdDraft(e.target.value)} spellCheck={false} />
              <span className="suffix">.jsx</span>
            </span>
          </label>
          <div className="admin-form-note">
            {!idValid
              ? "id may only contain letters, digits, - and _"
              : idTaken
                ? `src/slides/${id}.jsx already exists`
                : afterSlide
                  ? <>Inserted after <b>{afterSlide.meta.title}</b> (deselect the card to append at the end)</>
                  : "Appended at the end of the deck (select a card first to insert after it)"}
          </div>
          {error && <div className="admin-form-error">{error}</div>}
        </div>

        <footer className="actions">
          <button type="button" className="ed-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="ed-btn primary" disabled={!canCreate}>
            {busy ? "Creating…" : "Create & edit"}
          </button>
        </footer>
      </form>
    </div>
  );
}
