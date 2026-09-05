// Tiny composition layer for WGSL snippets. A chunk is a named block of WGSL
// (one or more `fn` / `const` declarations) plus the chunks it depends on.
// `compose()` flattens a shader body and its chunks into a single WGSL
// string, emitting every chunk exactly once, dependencies first — so a shader
// can ask for both `snoise2` and `snoise3` without duplicating their shared
// helpers.

/**
 * @param {string} name   WGSL-level identity (usually the main fn name)
 * @param {object[]} deps chunks this one calls into
 * @param {string} code   the WGSL source
 */
export function chunk(name, deps, code) {
  return { name, deps, code };
}

/**
 * compose(...items) → WGSL string. Items are chunks (deduped by identity and
 * by name) or raw strings (appended verbatim, in order). Put the shader body —
 * the `Params` struct and `@fragment fn fs_main` — last.
 */
export function compose(...items) {
  const seen = new Set();
  const names = new Set();
  const out = [];
  const visit = (item) => {
    if (typeof item === "string") {
      out.push(item);
      return;
    }
    if (seen.has(item) || names.has(item.name)) return;
    seen.add(item);
    names.add(item.name);
    for (const dep of item.deps) visit(dep);
    out.push(item.code);
  };
  for (const item of items) visit(item);
  return out.join("\n");
}
