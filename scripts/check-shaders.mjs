// Validate every shader offline: imports each `*.wgsl.js` module (transition
// overlays and slide backdrops), dumps the composed WGSL string, and runs
// `vgpu check --require-validation` on it. Usage: npm run check:shaders
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const dirs = ["src/transitions/shaders", "src/shaders"];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "deck-shaders-"));
const entries = [];
for (const rel of dirs) {
  const dir = path.resolve(rel);
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith(".wgsl.js")) continue;
    const mod = await import(path.join(dir, f));
    const str = Object.values(mod).find((v) => typeof v === "string" && /@fragment|@compute/.test(v));
    if (str) entries.push({ name: `${rel.replace(/^src\//, "")}/${f}`, wgsl: str });
  }
}
// Call the vgpu CLI directly (npx inside an npm script swallows its stdout).
const vgpuBin = path.resolve("node_modules/vgpu/bin/vgpu.js");
let failed = 0;
for (const e of entries) {
  const out = path.join(tmp, e.name.replace(/\//g, "__").replace(/\.wgsl\.js$/, ".wgsl"));
  fs.writeFileSync(out, e.wgsl);
  const r = spawnSync(process.execPath, [vgpuBin, "check", out, "--require-validation"], { encoding: "utf8" });
  const text = r.stdout + r.stderr;
  let ok = false, msg = "";
  try {
    const j = JSON.parse(text.slice(text.indexOf("{")));
    ok = !!j.validation?.ok && !j.diagnostics.some((d) => d.severity === "error");
    const err = j.validation?.error || j.diagnostics.find((d) => d.severity === "error");
    if (err) msg = `${err.line}:${err.column} ${err.message}`;
  } catch {
    msg = text.trim().split("\n").pop();
  }
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "FAIL"} ${e.name}${msg ? "  — " + msg : ""}`);
}
console.log(`${entries.length - failed}/${entries.length} shaders valid`);
process.exit(failed ? 1 : 0);
