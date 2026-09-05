import fs from "node:fs";
import path from "node:path";
import { json, readBody, insideDir, HttpError } from "./editor/http.js";
import { createEditorRoutes } from "./editor/routes.js";

// Dev-only Vite middleware backing the admin panel (#/admin) and the visual
// slide editor (#/admin/edit/<id>).
//   POST /__admin/api/manifest        { order: [slideIds] } → rewrite manifest.json
//   POST /__admin/api/assets/swap?slideId=&assetKey=&filename=  (raw file body)
//   GET  /__admin/api/assets          → list files under public/assets/
//   …plus the editor endpoints in ./editor/routes.js (slide/:id/*, slides, build).
// All writes are confined to src/slides/ and public/assets/ inside the project.
export function adminApiPlugin() {
  let root = process.cwd();

  const slidesDir = () => path.join(root, "src", "slides");
  const assetsDir = () => path.join(root, "public", "assets");
  const publicDir = () => path.join(root, "public");

  return {
    name: "admin-api",
    apply: "serve",
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      const editor = createEditorRoutes({ root, server });

      // Tell open editors when a slide file changes on disk (any writer).
      server.watcher.on("all", (event, file) => {
        if (!file.startsWith(slidesDir() + path.sep) || !file.endsWith(".jsx")) return;
        const id = path.basename(file, ".jsx");
        server.ws.send({ type: "custom", event: "deck:slide-changed", data: { id, event } });
      });

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/__admin/api/")) return next();
        const url = new URL(req.url, "http://localhost");

        try {
          if (await editor(url, req, res)) return;

          // ------------------------------------------------ manifest write --
          if (url.pathname === "/__admin/api/manifest" && req.method === "POST") {
            const body = JSON.parse((await readBody(req)).toString("utf8"));
            const order = body.order;
            if (!Array.isArray(order) || !order.every((id) => typeof id === "string")) {
              return json(res, 400, { error: "order must be an array of slide ids" });
            }
            const bad = order.filter(
              (id) =>
                !/^[\w-]+$/.test(id) || !fs.existsSync(path.join(slidesDir(), `${id}.jsx`)),
            );
            if (bad.length) {
              return json(res, 400, { error: `unknown slide ids: ${bad.join(", ")}` });
            }
            const manifestPath = path.join(slidesDir(), "manifest.json");
            fs.writeFileSync(manifestPath, JSON.stringify({ order }, null, 2) + "\n");
            return json(res, 200, { ok: true, order });
          }

          // ---------------------------------------------------- asset list --
          if (url.pathname === "/__admin/api/assets" && req.method === "GET") {
            const files = [];
            const walk = (dir) => {
              if (!fs.existsSync(dir)) return;
              for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) walk(full);
                else {
                  files.push({
                    path: "/" + path.relative(publicDir(), full).split(path.sep).join("/"),
                    size: fs.statSync(full).size,
                  });
                }
              }
            };
            walk(assetsDir());
            return json(res, 200, { files });
          }

          // ---------------------------------------------------- asset swap --
          if (url.pathname === "/__admin/api/assets/swap" && req.method === "POST") {
            const slideId = url.searchParams.get("slideId") || "";
            const assetKey = url.searchParams.get("assetKey") || "";
            const filename = url.searchParams.get("filename") || "";
            if (!/^[\w-]+$/.test(slideId) || !/^[\w-]+$/.test(assetKey)) {
              return json(res, 400, { error: "invalid slideId or assetKey" });
            }
            const slideFile = path.join(slidesDir(), `${slideId}.jsx`);
            if (!fs.existsSync(slideFile)) {
              return json(res, 404, { error: `slide ${slideId} not found` });
            }
            const source = fs.readFileSync(slideFile, "utf8");

            // Locate the declared asset path for this key inside meta.assets.
            const entryRe = new RegExp(
              `\\{[^{}]*key\\s*:\\s*["']${assetKey}["'][^{}]*\\}`,
              "s",
            );
            const entryMatch = source.match(entryRe);
            const pathMatch = entryMatch?.[0].match(/path\s*:\s*["']([^"']+)["']/);
            if (!pathMatch) {
              return json(res, 404, {
                error: `asset key "${assetKey}" not found in ${slideId} meta.assets`,
              });
            }
            const oldPath = pathMatch[1]; // e.g. /assets/images/hero.png
            const oldFull = path.join(publicDir(), oldPath.replace(/^\//, ""));
            if (!insideDir(assetsDir(), oldFull)) {
              return json(res, 400, { error: "asset path escapes public/assets" });
            }

            const body = await readBody(req);
            if (!body.length) return json(res, 400, { error: "empty file body" });
            if (body.length > 200 * 1024 * 1024) {
              return json(res, 413, { error: "file too large (200MB max)" });
            }

            const newExt = path.extname(filename || oldPath).toLowerCase();
            const oldExt = path.extname(oldPath).toLowerCase();

            if (!newExt || newExt === oldExt) {
              // Same type → overwrite in place; no code changes needed.
              fs.mkdirSync(path.dirname(oldFull), { recursive: true });
              fs.writeFileSync(oldFull, body);
              return json(res, 200, { ok: true, path: oldPath, replaced: true });
            }

            // Different extension → write alongside and update the slide source.
            const newPath = oldPath.slice(0, -oldExt.length) + newExt;
            const newFull = path.join(publicDir(), newPath.replace(/^\//, ""));
            if (!insideDir(assetsDir(), newFull)) {
              return json(res, 400, { error: "asset path escapes public/assets" });
            }
            fs.mkdirSync(path.dirname(newFull), { recursive: true });
            fs.writeFileSync(newFull, body);
            fs.writeFileSync(slideFile, source.split(oldPath).join(newPath));
            return json(res, 200, { ok: true, path: newPath, replaced: false });
          }

          return json(res, 404, { error: "unknown admin endpoint" });
        } catch (err) {
          if (err instanceof HttpError) {
            return json(res, err.status, { error: err.message, ...err.extra });
          }
          console.error("[admin-api]", err);
          return json(res, 500, { error: String(err?.message || err) });
        }
      });
    },
  };
}
