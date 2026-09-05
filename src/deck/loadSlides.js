import manifest from "../slides/manifest.json";

// Every .jsx file in src/slides/ is a slide. The manifest controls order; any
// slide on disk that is missing from the manifest still shows up (appended at
// the end) so a freshly generated slide is never invisible.
const modules = import.meta.glob("../slides/*.jsx", { eager: true });

const DEFAULT_TRANSITION = { kind: "fade", duration: 0.7 };

/**
 * Normalize a slide-shaped module (src/slides/ or src/templates/) into the
 * { id, meta, assets, Component } record the deck, admin and editor consume.
 */
export function normalizeSlideModule(id, mod, file = id) {
  const meta = mod.meta || {};
  if (meta.id && meta.id !== id) {
    console.warn(`[deck] ${file}: meta.id "${meta.id}" != filename "${id}" — using filename.`);
  }
  const slide = {
    id,
    meta: {
      title: id,
      ...meta,
      id,
      transition: { ...DEFAULT_TRANSITION, ...(meta.transition || {}) },
      assets: meta.assets || [],
    },
    assets: Object.fromEntries((meta.assets || []).map((a) => [a.key, a.path])),
    Component: mod.default,
  };
  if (!mod.default) {
    console.warn(`[deck] ${file} has no default export — slide will render empty.`);
    slide.Component = () => null;
  }
  return slide;
}

export function loadSlides() {
  const byId = {};
  for (const [file, mod] of Object.entries(modules)) {
    const id = file.match(/\/([^/]+)\.jsx$/)[1];
    byId[id] = normalizeSlideModule(id, mod, file);
  }

  const order = (manifest.order || []).filter((id) => byId[id]);
  const missing = (manifest.order || []).filter((id) => !byId[id]);
  if (missing.length) {
    console.warn("[deck] manifest lists slides that do not exist:", missing);
  }
  const orphans = Object.keys(byId)
    .filter((id) => !order.includes(id))
    .sort();
  if (orphans.length) {
    console.warn("[deck] slides missing from manifest.json, appended at end:", orphans);
  }
  return [...order, ...orphans].map((id) => byId[id]);
}
