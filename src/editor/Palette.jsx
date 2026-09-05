import React, { useState } from "react";
import { PALETTE } from "./palette.js";

const DIR = { image: "/assets/images/", svg: "/assets/icons/", video: "/assets/video/" };

// Toolbar of addable elements. Kinds that need media open a chooser listing
// declared assets, files already in public/assets, or an upload.
export default function Palette({ assets, hasSelection, onAdd, onAnnotate, snap, onToggleSnap, onRemount }) {
  const [chooser, setChooser] = useState(null); // { kind, assetType }

  const pick = (item) => {
    if (item.kind === "annotate") return onAnnotate();
    if (item.needsAsset) return setChooser({ kind: item.kind, assetType: item.needsAsset });
    onAdd(item.kind, {});
  };

  const declared = (assets.declared || []).filter((a) => chooser && (a.type === chooser.assetType || (chooser.assetType === "svg" && a.type === "image")));
  const files = (assets.files || []).filter((f) => chooser && f.path.startsWith(DIR[chooser.assetType] || "/assets/"));

  return (
    <div className="ed-palette">
      <span className="label">Add</span>
      {PALETTE.map((item) => (
        <button
          key={item.kind}
          className="ed-btn"
          title={item.hint}
          disabled={item.needsSelection && !hasSelection}
          draggable={!item.needsAsset && !item.needsSelection}
          onDragStart={(e) => e.dataTransfer.setData("text/x-palette", item.kind)}
          onClick={() => pick(item)}
        >
          <span className="icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
      <span style={{ flex: 1 }} />
      <button className={`ed-btn small${snap ? " active" : ""}`} onClick={onToggleSnap} title="snap to 8px grid (hold Alt to bypass)">
        Snap {snap ? "on" : "off"}
      </button>
      <button className="ed-btn small" onClick={onRemount} title="remount the slide preview">
        Remount
      </button>

      {chooser && (
        <div className="ed-chooser">
          <h4>Choose {chooser.assetType === "svg" ? "an icon" : `a ${chooser.assetType}`}</h4>
          <div className="list">
            {declared.map((a) => (
              <div
                key={`d:${a.key}`}
                className="item"
                onClick={() => {
                  onAdd(chooser.kind, { assetKey: a.key, assetPath: a.path });
                  setChooser(null);
                }}
              >
                <span className="tag">declared</span>
                assets.{a.key} → {a.path.replace(/^.*\//, "")}
              </div>
            ))}
            {files.map((f) => (
              <div
                key={`f:${f.path}`}
                className="item"
                onClick={() => {
                  onAdd(chooser.kind, { assetPath: f.path, declare: chooser.assetType !== "svg" });
                  setChooser(null);
                }}
              >
                <span className="tag">file</span>
                {f.path.replace("/assets/", "")}
              </div>
            ))}
            {!declared.length && !files.length && <div className="item">no files yet — upload one</div>}
          </div>
          <div className="actions">
            <label className="ed-btn primary">
              Upload file…
              <input
                type="file"
                hidden
                accept={chooser.assetType === "video" ? "video/*" : chooser.assetType === "svg" ? ".svg" : "image/*"}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  onAdd(chooser.kind, { upload: file });
                  setChooser(null);
                }}
              />
            </label>
            <button className="ed-btn" onClick={() => setChooser(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
