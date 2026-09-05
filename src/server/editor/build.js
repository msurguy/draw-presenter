import { spawn } from "node:child_process";
import path from "node:path";

// Production build runner for the admin "Build" button. Runs `vite build` in a
// child process (clean log, no interference with the dev server) and lazily
// starts a Vite preview server for dist/ once a build has succeeded.

const MAX_LOG_LINES = 200;

const state = {
  state: "idle", // idle | running | ok | error
  startedAt: null,
  finishedAt: null,
  durationMs: null,
  exitCode: null,
  log: [],
  previewUrl: null,
  previewError: null,
};

let child = null;
let previewPromise = null;

const pushLog = (chunk) => {
  for (const line of String(chunk).split(/\r?\n/)) {
    if (!line.trim()) continue;
    state.log.push(line);
    if (state.log.length > MAX_LOG_LINES) state.log.shift();
  }
};

export function getBuildStatus() {
  return { ...state, log: state.log.join("\n") };
}

export function startBuild(root) {
  if (state.state === "running") return false;
  state.state = "running";
  state.startedAt = Date.now();
  state.finishedAt = null;
  state.durationMs = null;
  state.exitCode = null;
  state.log = [];

  const bin = path.join(root, "node_modules", "vite", "bin", "vite.js");
  child = spawn(process.execPath, [bin, "build"], {
    cwd: root,
    env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
  });
  child.stdout.on("data", pushLog);
  child.stderr.on("data", pushLog);
  child.on("error", (err) => {
    pushLog(`spawn failed: ${err.message}`);
    finish(1);
  });
  child.on("close", (code) => finish(code ?? 1));

  const finish = (code) => {
    if (state.state !== "running") return;
    child = null;
    state.exitCode = code;
    state.finishedAt = Date.now();
    state.durationMs = state.finishedAt - state.startedAt;
    state.state = code === 0 ? "ok" : "error";
    if (code === 0) {
      ensurePreview(root).catch((err) => {
        state.previewError = String(err?.message || err);
      });
    }
  };
  return true;
}

/** Start (once) a Vite preview server for dist/ and return its URL. */
export function ensurePreview(root) {
  if (state.previewUrl) return Promise.resolve(state.previewUrl);
  if (previewPromise) return previewPromise;
  previewPromise = (async () => {
    try {
      const { preview } = await import("vite");
      const server = await preview({
        root,
        logLevel: "warn",
        preview: { port: 4173, strictPort: false, open: false },
      });
      const url = server.resolvedUrls?.local?.[0] || `http://localhost:${server.config.preview.port}/`;
      state.previewUrl = url;
      return url;
    } catch (err) {
      // Fallback: a detached `vite preview` process on the default port.
      const bin = path.join(root, "node_modules", "vite", "bin", "vite.js");
      const p = spawn(process.execPath, [bin, "preview", "--port", "4173"], {
        cwd: root,
        env: { ...process.env, FORCE_COLOR: "0" },
        stdio: "ignore",
      });
      p.unref();
      state.previewUrl = "http://localhost:4173/";
      state.previewError = `in-process preview failed (${err?.message || err}); spawned vite preview instead`;
      return state.previewUrl;
    }
  })();
  return previewPromise;
}
