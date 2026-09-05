import React, { useState } from "react";
import SlideThumb from "./SlideThumb.jsx";

export default function SlideList({ slides, selectedId, onSelect, onReorder, version }) {
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  const handleDrop = (targetId) => {
    setOverId(null);
    if (!dragId || dragId === targetId) return;
    const ids = slides.map((s) => s.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    onReorder(ids);
  };

  return (
    <div className="admin-slides">
      {slides.map((slide, i) => (
        <div
          key={`${slide.id}:${version}`}
          className={[
            "slide-card",
            selectedId === slide.id && "selected",
            overId === slide.id && dragId !== slide.id && "drag-over",
            dragId === slide.id && "dragging",
          ]
            .filter(Boolean)
            .join(" ")}
          draggable
          onClick={() => onSelect(slide.id)}
          onDoubleClick={() => {
            window.location.hash = `#/admin/edit/${slide.id}`;
          }}
          onDragStart={(e) => {
            setDragId(slide.id);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setOverId(slide.id);
          }}
          onDragLeave={() => setOverId((cur) => (cur === slide.id ? null : cur))}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(slide.id);
          }}
          title={`${slide.id}.jsx`}
        >
          <SlideThumb slide={slide} />
          <div className="caption">
            <span className="num">{i + 1}</span>
            <span className="title">{slide.meta.title}</span>
            <span className="kind">{slide.meta.transition.kind}</span>
            <a
              className="edit"
              href={`#/admin/edit/${slide.id}`}
              title="open in the visual editor"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            >
              Edit
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
