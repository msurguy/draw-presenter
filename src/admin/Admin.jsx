import React, { useEffect, useMemo, useState } from "react";
import { loadSlides } from "../deck/loadSlides.js";
import { loadTemplates } from "./templates.js";
import { saveManifest, createSlide, deleteSlide } from "./api.js";
import SlideList from "./SlideList.jsx";
import AssetPanel from "./AssetPanel.jsx";
import NewSlideModal from "./NewSlideModal.jsx";
import BuildPanel from "../editor/BuildPanel.jsx";
import "../styles/editor.css";

export default function Admin() {
  // Slides come from the same client-side glob the deck uses. Local `order`
  // state gives instant reorder feedback; the server write makes it stick.
  const allSlides = useMemo(() => loadSlides(), []);
  const templates = useMemo(() => loadTemplates(), []);
  const [order, setOrder] = useState(() => allSlides.map((s) => s.id));
  const [selectedId, setSelectedId] = useState(null);
  const [version, setVersion] = useState(0); // bumps to remount thumbnails
  const [toast, setToast] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const slides = order
    .map((id) => allSlides.find((s) => s.id === id))
    .filter(Boolean);
  const selected = slides.find((s) => s.id === selectedId) || null;

  const notify = (msg) => {
    setToast(msg);
  };
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleReorder = async (ids) => {
    const prev = order;
    setOrder(ids);
    try {
      await saveManifest(ids);
      notify("Order saved to manifest.json");
    } catch (err) {
      setOrder(prev);
      notify(`Reorder failed: ${err.message}`);
    }
  };

  // The modal reports errors itself; on success the server triggers a full
  // reload and we jump straight into the editor for the new slide.
  const handleCreate = async ({ id, title, template }) => {
    await createSlide({ id, title, template, after: selectedId });
    window.location.hash = `#/admin/edit/${id}`;
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!window.confirm(`Delete slide "${selected.meta.title}"? The file is moved to src/slides/_trash/.`)) return;
    try {
      await deleteSlide(selected.id);
    } catch (err) {
      notify(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="admin">
      <header className="admin-header">
        <h1>Slides admin</h1>
        <span className="hint">
          drag cards to reorder · click a card for assets (a new slide lands after it) · double-click (or Edit) to open the visual editor
        </span>
        <button className="ed-btn primary small" onClick={() => setShowNew(true)}>
          + New slide
        </button>
        <BuildPanel notify={notify} />
        <a href="#/">← back to deck</a>
      </header>
      <div className="admin-body">
        <SlideList
          slides={slides}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
          onReorder={handleReorder}
          version={version}
        />
        <aside className="admin-side">
          <h2>{selected ? selected.meta.title : "Assets"}</h2>
          {selected && <div className="path">src/slides/{selected.id}.jsx</div>}
          {selected && (
            <div className="ed-btngroup" style={{ marginBottom: 16 }}>
              <a className="ed-btn primary small" href={`#/admin/edit/${selected.id}`}>
                Edit slide
              </a>
              <button className="ed-btn danger small" onClick={handleDelete}>
                Delete…
              </button>
            </div>
          )}
          <AssetPanel
            slide={selected}
            notify={notify}
            onSwapped={() => setVersion((v) => v + 1)}
          />
        </aside>
      </div>
      {showNew && (
        <NewSlideModal
          templates={templates}
          existingIds={allSlides.map((s) => s.id)}
          afterSlide={selected}
          onClose={() => setShowNew(false)}
          onCreate={handleCreate}
        />
      )}
      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}
