// Resolve a root-relative public path ("/assets/…", "/fonts/…") against Vite's
// configured base so the static build also works when hosted under a
// sub-path (e.g. GitHub Pages at /draw-presenter/). Slides keep writing plain
// "/assets/…" paths; only the loaders call this. Absolute URLs, data: and
// blob: URIs pass through untouched.
const BASE = import.meta.env.BASE_URL || "/";

export function publicUrl(path) {
  if (typeof path !== "string" || BASE === "/") return path;
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  return BASE.replace(/\/$/, "") + path;
}
