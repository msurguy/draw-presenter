// Fetch wrappers for the dev-only admin/editor API (src/server/adminApiPlugin.js
// + src/server/editor/routes.js). Errors carry the server's message and status.

async function handle(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

const post = (url, body) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then(handle);

const get = (url) => fetch(url).then(handle);

// ---- existing admin ---------------------------------------------------------

export function saveManifest(order) {
  return post("/__admin/api/manifest", { order });
}

export function swapAsset({ slideId, assetKey, file }) {
  const params = new URLSearchParams({ slideId, assetKey, filename: file.name });
  return fetch(`/__admin/api/assets/swap?${params}`, { method: "POST", body: file }).then(handle);
}

export function listAssets() {
  return get("/__admin/api/assets");
}

// ---- editor -----------------------------------------------------------------

const slideUrl = (id, action) => `/__admin/api/slide/${encodeURIComponent(id)}${action ? `/${action}` : ""}`;

export const getSlideSource = (id) => get(slideUrl(id, "source"));
export const getSlideElements = (id) => get(slideUrl(id, "elements"));
export const listComponents = () => get("/__admin/api/components");

/** changes = { props?: {name: value|null}, style?: {key: value|null}, text?: string } */
export const patchElement = (id, { loc, changes, expectVersion }) =>
  post(slideUrl(id, "patch"), { loc, changes, expectVersion });

export const insertElement = (id, { parentLoc = null, jsx, imports = [], expectVersion }) =>
  post(slideUrl(id, "insert"), { parentLoc, jsx, imports, expectVersion });

export const deleteElement = (id, { loc, expectVersion }) =>
  post(slideUrl(id, "delete"), { loc, expectVersion });

export const wrapElement = (id, { loc, wrapperOpen, wrapperName, expectVersion }) =>
  post(slideUrl(id, "wrap"), { loc, wrapperOpen, wrapperName, expectVersion });

export const patchMeta = (id, changes) => post(slideUrl(id, "meta"), changes);

export const undoSlide = (id) => post(slideUrl(id, "undo"));
export const redoSlide = (id) => post(slideUrl(id, "redo"));

/** Upload a file into public/assets/<type dir>/ and declare it in meta.assets. */
export function uploadAsset(id, { key, type, file }) {
  const params = new URLSearchParams({ key, type, filename: file.name });
  return fetch(`${slideUrl(id, "assets")}?${params}`, { method: "POST", body: file }).then(handle);
}

/** Declare an existing public/assets file in meta.assets. */
export function declareAsset(id, { key, type, path }) {
  const params = new URLSearchParams({ key, type, path });
  return fetch(`${slideUrl(id, "assets")}?${params}`, { method: "POST" }).then(handle);
}

/** Create src/slides/<id>.jsx from src/templates/<template>.jsx, placed after `after` (or last). */
export const createSlide = ({ id, title, template = "blank", after = null }) =>
  post("/__admin/api/slides", { id, title, template, after });
export const deleteSlide = (id) => fetch(slideUrl(id), { method: "DELETE" }).then(handle);

export const startBuild = () => post("/__admin/api/build");
export const getBuildStatus = () => get("/__admin/api/build/status");
