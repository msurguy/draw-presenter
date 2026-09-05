import React, { useState } from "react";
import { swapAsset } from "./api.js";

// Lists the selected slide's declared assets. Drop a replacement file onto an
// entry to swap it on disk.
export default function AssetPanel({ slide, onSwapped, notify }) {
  const [overKey, setOverKey] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [bust, setBust] = useState(0);

  if (!slide) return <div className="empty">Select a slide to see its assets.</div>;
  const assets = slide.meta.assets || [];
  if (!assets.length) {
    return (
      <div className="empty">
        This slide declares no assets. Add entries to <code>meta.assets</code> to make media
        swappable here.
      </div>
    );
  }

  const handleDrop = async (asset, e) => {
    e.preventDefault();
    setOverKey(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setBusyKey(asset.key);
    try {
      const result = await swapAsset({ slideId: slide.id, assetKey: asset.key, file });
      setBust((b) => b + 1);
      notify(
        result.replaced
          ? `Replaced ${result.path}`
          : `Saved ${result.path} and updated ${slide.id}.jsx`,
      );
      onSwapped();
    } catch (err) {
      notify(`Swap failed: ${err.message}`);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <>
      {assets.map((asset) => {
        const url = `${asset.path}?v=${bust}`;
        return (
          <div
            key={asset.key}
            className={`asset-row${overKey === asset.key ? " drag-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverKey(asset.key);
            }}
            onDragLeave={() => setOverKey((cur) => (cur === asset.key ? null : cur))}
            onDrop={(e) => handleDrop(asset, e)}
          >
            <div className="asset-head">
              <span className="key">{asset.key}</span>
              <span className="type">{asset.type}</span>
            </div>
            <div className="asset-path">{asset.path}</div>
            <div className="asset-preview">
              {asset.type === "video" ? (
                <video src={url} muted loop autoPlay playsInline />
              ) : asset.type === "model" ? (
                <span style={{ color: "var(--muted)", fontSize: 12, padding: 12 }}>3D model</span>
              ) : (
                <img src={url} alt={asset.key} />
              )}
            </div>
            <div className="drop-hint">
              {busyKey === asset.key ? "Uploading…" : "Drop a file here to replace"}
            </div>
          </div>
        );
      })}
    </>
  );
}
