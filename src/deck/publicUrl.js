// Resolve a root-relative public path ("/assets/…", "/fonts/…") against Vite's
// configured base so the static build also works when hosted under a
// sub-path (e.g. GitHub Pages at /draw-presenter/). Slides keep writing plain
// "/assets/…" paths; only the loaders call this. Absolute URLs, data: and
// blob: URIs pass through untouched. Idempotent: a path that already carries
// the base (e.g. the slide loader resolved it before <Img> sees it) is
// returned as-is, so loaders and components can both call it safely.
const BASE = import.meta.env.BASE_URL || "/";
const PREFIX = BASE.replace(/\/$/, "");

export function publicUrl(path) {
  if (typeof path !== "string" || BASE === "/") return path;
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (path === PREFIX || path.startsWith(PREFIX + "/")) return path;
  return PREFIX + path;
}
