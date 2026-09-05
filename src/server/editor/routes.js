import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { json, readJson, readBody, safeId, insideDir, HttpError } from "./http.js";
import { parseSlide, collectElements, parseJsxSnippet, walkJsx, elementName, isComponentName } from "./slideAst.js";
import {
  patchElement,
  insertChild,
  deleteElement,
  wrapElement,
  ensureImports,
  ensureAssetsParam,
  addAssetEntry,
  patchMeta,
  instantiateTemplate,
  rewriteAssetPaths,
  shiftLoc,
} from "./slidePatch.js";
import { startBuild, getBuildStatus } from "./build.js";

// ---------------------------------------------------------------------------
// Editor endpoints (all under /__admin/api/). Every write goes through
// `commit()`: optimistic-concurrency check on a content hash, undo snapshot,
// single serialized write per slide. Nothing here runs in production builds.
// ---------------------------------------------------------------------------

const ASSET_DIRS = { image: "images", svg: "icons", icon: "icons", video: "video", model: "models" };
const MAX_UPLOAD = 200 * 1024 * 1024;

export function createEditorRoutes({ root, server }) {
  const slidesDir = path.join(root, "src", "slides");
  const publicDir = path.join(root, "public");
  const assetsDir = path.join(publicDir, "assets");
  const componentsDir = path.join(root, "src", "components");
  const templatesDir = path.join(root, "src", "templates");
  const manifestPath = path.join(slidesDir, "manifest.json");

  const slideFile = (id) => path.join(slidesDir, `${id}.jsx`);
  const templateFile = (id) => path.join(templatesDir, `${id}.jsx`);
  const version = (src) => crypto.createHash("sha1").update(src).digest("hex").slice(0, 12);
  const readSlide = (id) => {
    const f = slideFile(id);
    if (!fs.existsSync(f)) throw new HttpError(404, `slide ${id} not found`);
    return fs.readFileSync(f, "utf8");
  };
  const readManifest = () => {
    try {
      return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch {
      return { order: [] };
    }
  };
  const writeManifest = (m) => fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2) + "\n");
  const componentNames = () =>
    fs.existsSync(componentsDir)
      ? fs.readdirSync(componentsDir).filter((f) => f.endsWith(".jsx")).map((f) => f.slice(0, -4))
      : [];

  const fullReload = () => server.ws.send({ type: "full-reload", path: "*" });

  // Resolve once Vite's watcher has seen `file` (or after a short grace
  // period). Creating a slide adds a file to the import.meta.glob() directory:
  // reloading before the watcher invalidates that glob would serve the old
  // module list and the new slide would be missing from the deck/admin.
  const watcherSaw = (file) =>
    new Promise((resolve) => {
      const target = path.resolve(file);
      const done = () => {
        clearTimeout(timer);
        server.watcher.off("add", onEvent);
        server.watcher.off("change", onEvent);
        resolve();
      };
      const onEvent = (p) => {
        if (path.resolve(p) === target) done();
      };
      const timer = setTimeout(done, 750);
      server.watcher.on("add", onEvent);
      server.watcher.on("change", onEvent);
    });

  // ---- history + write serialization -------------------------------------
  const history = new Map(); // id → { undo: string[], redo: string[] }
  const hist = (id) => {
    if (!history.has(id)) history.set(id, { undo: [], redo: [] });
    return history.get(id);
  };
  const queues = new Map();
  const enqueue = (id, fn) => {
    const prev = queues.get(id) || Promise.resolve();
    const next = prev.catch(() => {}).then(fn);
    queues.set(id, next);
    return next;
  };

  const commit = (id, source, code, expectVersion) => {
    if (expectVersion && expectVersion !== version(source)) {
      throw new HttpError(409, "slide changed on disk since it was loaded", { version: version(source) });
    }
    if (code === source) return version(source);
    const h = hist(id);
    h.undo.push(source);
    if (h.undo.length > 100) h.undo.shift();
    h.redo = [];
    fs.writeFileSync(slideFile(id), code);
    return version(code);
  };

  // ---- helpers --------------------------------------------------------------
  const assertKnownComponents = (jsx) => {
    const known = new Set(componentNames());
    const el = parseJsxSnippet(jsx);
    const bad = [];
    walkJsx({ type: "File", program: { type: "Program", body: [{ type: "ExpressionStatement", expression: el }] } }, (e) => {
      const n = elementName(e);
      if (isComponentName(n) && !known.has(n)) bad.push(n);
    });
    if (bad.length) throw new HttpError(422, `unknown components in snippet: ${bad.join(", ")}`);
  };

  const sanitizeName = (name) => {
    const base = path.basename(name || "asset").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
    return base || "asset";
  };

  const uniquePath = (dir, filename) => {
    const ext = path.extname(filename);
    const stem = filename.slice(0, filename.length - ext.length);
    let candidate = path.join(dir, filename);
    let i = 2;
    while (fs.existsSync(candidate)) candidate = path.join(dir, `${stem}-${i++}${ext}`);
    return candidate;
  };

  const elementsPayload = (source) => {
    const ast = parseSlide(source);
    return { version: version(source), ...collectElements(ast, source) };
  };

  // ---- router ----------------------------------------------------------------
  /** Returns true when the request was handled. */
  return async function handle(url, req, res) {
    const rel = url.pathname.replace(/^\/__admin\/api\//, "");
    const m = rel.match(/^slide\/([^/]+)(?:\/([^/]+))?$/);

    if (rel === "components" && req.method === "GET") {
      json(res, 200, { components: componentNames() });
      return true;
    }

    if (rel === "build" && req.method === "POST") {
      const started = startBuild(root);
      json(res, started ? 202 : 409, getBuildStatus());
      return true;
    }
    if (rel === "build/status" && req.method === "GET") {
      json(res, 200, getBuildStatus());
      return true;
    }

    if (rel === "slides" && req.method === "POST") {
      const body = await readJson(req);
      const id = safeId(body.id);
      if (!id) throw new HttpError(400, "invalid slide id (letters, digits, - and _ only)");
      if (fs.existsSync(slideFile(id))) throw new HttpError(409, `slide ${id} already exists`);
      const templateId = safeId(body.template || "blank");
      if (!templateId || !fs.existsSync(templateFile(templateId))) {
        throw new HttpError(404, `template "${body.template || "blank"}" not found in src/templates/`);
      }
      const template = fs.readFileSync(templateFile(templateId), "utf8");
      const inst = instantiateTemplate(template, { id, title: String(body.title || id) });
      let code = inst.code;

      // Give the new slide its own copy of every placeholder asset: an
      // in-place swap in the admin (same extension) must never overwrite a
      // file the template — or another slide made from it — still uses.
      const pathByKey = {};
      for (const a of inst.assets) {
        if (!a || !safeId(a.key) || typeof a.path !== "string") continue;
        const src = path.join(publicDir, a.path.replace(/^\//, ""));
        if (!insideDir(assetsDir, src) || !fs.existsSync(src)) continue;
        const sub = ASSET_DIRS[a.type] || path.basename(path.dirname(src));
        const dir = path.join(assetsDir, sub);
        const dest = path.join(dir, `${id}-${a.key}${path.extname(src)}`);
        if (!insideDir(assetsDir, dest) || dest === src) continue;
        fs.mkdirSync(dir, { recursive: true });
        fs.copyFileSync(src, dest);
        pathByKey[a.key] = "/" + path.relative(publicDir, dest).split(path.sep).join("/");
      }
      if (Object.keys(pathByKey).length) code = rewriteAssetPaths(code, pathByKey).code;

      const seen = watcherSaw(slideFile(id));
      fs.writeFileSync(slideFile(id), code);
      const manifest = readManifest();
      const order = (manifest.order || []).filter((x) => x !== id);
      const after = safeId(body.after || "");
      const at = after ? order.indexOf(after) : -1;
      if (at >= 0) order.splice(at + 1, 0, id);
      else order.push(id);
      manifest.order = order;
      const manifestSeen = watcherSaw(manifestPath);
      writeManifest(manifest);
      await seen;
      await manifestSeen;
      fullReload();
      json(res, 200, { ok: true, id, template: templateId, assets: pathByKey });
      return true;
    }

    if (!m) return false;
    const id = safeId(m[1]);
    const action = m[2] || "";
    if (!id) throw new HttpError(400, "invalid slide id");

    if (!action && req.method === "DELETE") {
      const f = slideFile(id);
      if (!fs.existsSync(f)) throw new HttpError(404, `slide ${id} not found`);
      const trash = path.join(slidesDir, "_trash");
      fs.mkdirSync(trash, { recursive: true });
      fs.renameSync(f, path.join(trash, `${id}.${Date.now()}.jsx`));
      const manifest = readManifest();
      manifest.order = (manifest.order || []).filter((x) => x !== id);
      writeManifest(manifest);
      history.delete(id);
      fullReload();
      json(res, 200, { ok: true });
      return true;
    }

    if (action === "source" && req.method === "GET") {
      const source = readSlide(id);
      json(res, 200, { source, version: version(source) });
      return true;
    }

    if (action === "elements" && req.method === "GET") {
      json(res, 200, elementsPayload(readSlide(id)));
      return true;
    }

    if (req.method !== "POST") return false;

    if (action === "assets") {
      // Upload (raw body) or declare an existing public/assets file (JSON).
      const key = safeId(url.searchParams.get("key") || "");
      const type = url.searchParams.get("type") || "image";
      if (!key) throw new HttpError(400, "invalid asset key");
      const sub = ASSET_DIRS[type];
      if (!sub) throw new HttpError(400, `unknown asset type ${type}`);
      let assetPath = url.searchParams.get("path");
      if (assetPath) {
        const full = path.join(publicDir, assetPath.replace(/^\//, ""));
        if (!insideDir(assetsDir, full) || !fs.existsSync(full)) throw new HttpError(400, "asset path not found");
      } else {
        const body = await readBody(req);
        if (!body.length) throw new HttpError(400, "empty file body");
        if (body.length > MAX_UPLOAD) throw new HttpError(413, "file too large (200MB max)");
        const dir = path.join(assetsDir, sub);
        fs.mkdirSync(dir, { recursive: true });
        const full = uniquePath(dir, sanitizeName(url.searchParams.get("filename")));
        if (!insideDir(assetsDir, full)) throw new HttpError(400, "asset path escapes public/assets");
        fs.writeFileSync(full, body);
        assetPath = "/" + path.relative(publicDir, full).split(path.sep).join("/");
      }
      const result = await enqueue(id, () => {
        const source = readSlide(id);
        let code = addAssetEntry(source, { key, path: assetPath, type }).code;
        code = ensureAssetsParam(code).code;
        // Adding to meta.assets inserts lines above the JSX, so every element
        // loc the client holds is now stale. Report the shift so it can remap.
        const before = source.split("\n");
        const after = code.split("\n");
        let fromLine = 0;
        while (fromLine < before.length && before[fromLine] === after[fromLine]) fromLine++;
        const shift = { fromLine: fromLine + 1, lines: after.length - before.length };
        return { key, path: assetPath, shift, version: commit(id, source, code) };
      });
      json(res, 200, { ok: true, ...result });
      return true;
    }

    const body = await readJson(req);

    const run = (fn) =>
      enqueue(id, () => {
        const source = readSlide(id);
        return fn(source);
      });

    if (action === "patch") {
      const out = await run((source) => {
        const { code, loc } = patchElement(source, String(body.loc || ""), body.changes || {});
        return { loc, version: commit(id, source, code, body.expectVersion) };
      });
      json(res, 200, { ok: true, ...out });
      return true;
    }

    if (action === "insert") {
      const jsx = String(body.jsx || "");
      assertKnownComponents(jsx);
      const imports = Array.isArray(body.imports) ? body.imports.filter((n) => componentNames().includes(n)) : [];
      const out = await run((source) => {
        // Locate + insert on the untouched source first: adding imports above
        // would shift every "line:col" before we could find the parent.
        const ins = insertChild(source, { parentLoc: body.parentLoc || null, jsx });
        const imp = ensureImports(ins.code, imports);
        let code = imp.code;
        if (/\bassets\./.test(jsx)) code = ensureAssetsParam(code).code; // same-line edit, no shift
        return { loc: shiftLoc(ins.loc, imp.addedLines), version: commit(id, source, code, body.expectVersion) };
      });
      json(res, 200, { ok: true, ...out });
      return true;
    }

    if (action === "delete") {
      const out = await run((source) => {
        const { code, parentLoc } = deleteElement(source, String(body.loc || ""));
        return { parentLoc, version: commit(id, source, code, body.expectVersion) };
      });
      json(res, 200, { ok: true, ...out });
      return true;
    }

    if (action === "wrap") {
      const wrapperName = String(body.wrapperName || "");
      if (!componentNames().includes(wrapperName)) throw new HttpError(422, `unknown wrapper ${wrapperName}`);
      const out = await run((source) => {
        const w = wrapElement(source, String(body.loc || ""), { wrapperOpen: String(body.wrapperOpen || ""), wrapperName });
        const imp = ensureImports(w.code, [wrapperName]);
        return { loc: shiftLoc(w.loc, imp.addedLines), version: commit(id, source, imp.code, body.expectVersion) };
      });
      json(res, 200, { ok: true, ...out });
      return true;
    }

    if (action === "meta") {
      const out = await run((source) => {
        const { code } = patchMeta(source, body);
        return { version: commit(id, source, code, body.expectVersion) };
      });
      fullReload();
      json(res, 200, { ok: true, ...out });
      return true;
    }

    if (action === "undo" || action === "redo") {
      const out = await run((source) => {
        const h = hist(id);
        const from = action === "undo" ? h.undo : h.redo;
        const to = action === "undo" ? h.redo : h.undo;
        if (!from.length) throw new HttpError(409, `nothing to ${action}`);
        const target = from.pop();
        to.push(source);
        fs.writeFileSync(slideFile(id), target);
        return { version: version(target), canUndo: h.undo.length > 0, canRedo: h.redo.length > 0 };
      });
      json(res, 200, { ok: true, ...out });
      return true;
    }

    return false;
  };
}
