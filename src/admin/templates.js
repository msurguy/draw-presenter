import { normalizeSlideModule } from "../deck/loadSlides.js";

// Slide templates are real slide modules in src/templates/ (same contract as
// src/slides/) plus `export const template = { name, description, order }`.
// They are globbed eagerly so the "New slide" dialog can render live
// thumbnails; only the dev-only Admin chunk imports this file.
const modules = import.meta.glob("../templates/*.jsx", { eager: true });

export function loadTemplates() {
  return Object.entries(modules)
    .map(([file, mod]) => {
      const id = file.match(/\/([^/]+)\.jsx$/)[1];
      const t = mod.template || {};
      return {
        id,
        name: t.name || id,
        description: t.description || "",
        order: t.order ?? 100,
        slide: normalizeSlideModule(id, mod, file),
      };
    })
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}
