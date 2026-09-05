import MagicString from "magic-string";
import { HttpError } from "./http.js";
import {
  parseSlide,
  parseJsxSnippet,
  validateExpression,
  getElement,
  indexElements,
  findAttr,
  findMeta,
  findProp,
  findSlideRoot,
  findSlideFunction,
  isEditableAttr,
  elementName,
  keyName,
  locKey,
  listImports,
  literalValue,
} from "./slideAst.js";

// ---------------------------------------------------------------------------
// Lossless source edits. Every function takes the current source text and
// returns { code, … }; nothing is written here. Edits are applied with
// magic-string on exact Babel ranges so untouched code, comments and
// formatting survive byte-for-byte. Results are re-parsed before returning.
// ---------------------------------------------------------------------------

const IDENT_RE = /^[A-Za-z_$][\w$]*$/;

export const isExprValue = (v) => v && typeof v === "object" && typeof v.__expr === "string";

/** JS expression text for a JSON-ish value. */
export function toJsExpr(v) {
  if (isExprValue(v)) {
    validateExpression(v.__expr);
    return v.__expr;
  }
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "0";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.map(toJsExpr).join(", ")}]`;
  if (typeof v === "object") {
    const entries = Object.entries(v).filter(([, val]) => val !== undefined);
    if (!entries.length) return "{}";
    return `{ ${entries.map(([k, val]) => `${IDENT_RE.test(k) ? k : JSON.stringify(k)}: ${toJsExpr(val)}`).join(", ")} }`;
  }
  throw new HttpError(422, `cannot serialize value of type ${typeof v}`);
}

/** `name` + serialized JSX attribute value (no leading space). */
export function serializeAttr(name, v) {
  if (v === true) return name;
  if (typeof v === "string" && !v.includes('"') && !v.includes("\n")) return `${name}="${v}"`;
  return `${name}={${toJsExpr(v)}}`;
}

// ------------------------------------------------------------------ text utils

const lineStartOf = (source, idx) => {
  let i = idx;
  while (i > 0 && source[i - 1] !== "\n") i--;
  return i;
};

const indentAt = (source, idx) => {
  const ls = lineStartOf(source, idx);
  const m = source.slice(ls, idx).match(/^[ \t]*/);
  return m ? m[0] : "";
};

/** Indent of the line a node starts on. */
const indentOf = (source, node) => indentAt(source, node.start);

const aloneOnLine = (source, node) => {
  const ls = lineStartOf(source, node.start);
  return source.slice(ls, node.start).trim() === "";
};

const wsStart = (source, idx) => {
  let i = idx;
  while (i > 0 && /[ \t\r\n]/.test(source[i - 1])) i--;
  return i;
};

const skipSpaces = (source, idx) => {
  let i = idx;
  while (i < source.length && (source[i] === " " || source[i] === "\t")) i++;
  return i;
};

const reindent = (snippet, indent) =>
  snippet
    .trim()
    .split("\n")
    .map((l, i) => (i === 0 ? l : indent + l))
    .join("\n");

function assertParses(code) {
  try {
    parseSlide(code);
  } catch (err) {
    throw new HttpError(500, `edit produced invalid source; nothing written (${err.message})`);
  }
  return code;
}

// ------------------------------------------------------------- attributes

function insertAttr(s, source, oe, text) {
  const attrs = oe.attributes;
  const anchor = attrs.length ? attrs[attrs.length - 1].end : oe.name.end;
  const multiLine = oe.loc.start.line !== oe.loc.end.line;
  if (multiLine && attrs.length) {
    const indent = indentAt(source, attrs[attrs.length - 1].start);
    s.appendLeft(anchor, `\n${indent}${text}`);
  } else if (multiLine) {
    const indent = indentAt(source, oe.start) + "  ";
    s.appendLeft(anchor, `\n${indent}${text}`);
  } else {
    s.appendLeft(anchor, ` ${text}`);
  }
}

function removeAttr(s, source, attr) {
  s.remove(wsStart(source, attr.start), attr.end);
}

/**
 * Edit keys of an object literal in place. `changes[key] = null` removes.
 */
export function patchObjectLiteral(s, source, obj, changes) {
  const props = obj.properties;
  const multiLine = obj.loc.start.line !== obj.loc.end.line;
  const adds = [];
  for (const [key, value] of Object.entries(changes)) {
    const prop = findProp(obj, key);
    if (value === null || value === undefined) {
      if (!prop) continue;
      let start = wsStart(source, prop.start);
      let end = prop.end;
      const afterEnd = skipSpaces(source, end);
      if (source[afterEnd] === ",") {
        end = afterEnd + 1;
      } else if (source[start - 1] === ",") {
        start -= 1;
      }
      s.remove(start, end);
    } else if (prop) {
      if (prop.shorthand) s.overwrite(prop.start, prop.end, `${key}: ${toJsExpr(value)}`);
      else s.overwrite(prop.value.start, prop.value.end, toJsExpr(value));
    } else {
      adds.push([key, value]);
    }
  }
  if (!adds.length) return;
  const keyText = (k) => (IDENT_RE.test(k) ? k : JSON.stringify(k));
  if (!props.length) {
    s.overwrite(obj.start, obj.end, toJsExpr(Object.fromEntries(adds)));
    return;
  }
  const last = props[props.length - 1];
  if (multiLine) {
    const indent = indentOf(source, last);
    const afterLast = skipSpaces(source, last.end);
    if (source[afterLast] === ",") {
      s.appendLeft(afterLast + 1, adds.map(([k, v]) => `\n${indent}${keyText(k)}: ${toJsExpr(v)},`).join(""));
    } else {
      s.appendLeft(last.end, adds.map(([k, v]) => `,\n${indent}${keyText(k)}: ${toJsExpr(v)}`).join(""));
    }
  } else {
    s.appendLeft(last.end, adds.map(([k, v]) => `, ${keyText(k)}: ${toJsExpr(v)}`).join(""));
  }
}

// ------------------------------------------------------------------- text

function encodeJsxText(text) {
  const lines = text.split("\n");
  return lines
    .map((line) => {
      if (/^\s|\s$/.test(line) || /[{}<>]/.test(line)) return `{${JSON.stringify(line)}}`;
      return line;
    })
    .join('{"\\n"}');
}

function setText(s, source, el, text) {
  const oe = el.openingElement;
  const name = elementName(el);
  const encoded = encodeJsxText(text);
  if (oe.selfClosing) {
    let i = oe.end - 2; // "/>"
    while (i > 0 && /[ \t\n]/.test(source[i - 1])) i--;
    s.overwrite(i, oe.end, `>${encoded}</${name}>`);
    return;
  }
  const isComment = (n) => n.type === "JSXExpressionContainer" && n.expression.type === "JSXEmptyExpression";
  const kids = el.children.filter((c) => !(c.type === "JSXText" && c.value.trim() === "") && !isComment(c));
  if (!kids.length) {
    const closing = el.closingElement;
    const block = source.slice(oe.end, closing.start).includes("\n");
    if (block) {
      const tagIndent = indentOf(source, el);
      s.overwrite(oe.end, closing.start, `\n${tagIndent}  ${encoded}\n${tagIndent}`);
    } else {
      s.overwrite(oe.end, closing.start, encoded);
    }
    return;
  }
  const first = kids[0];
  const last = kids[kids.length - 1];
  // JSXText nodes start right at the tag end and carry their own leading
  // whitespace, so detect block form from the text itself.
  const leadingWs =
    first.type === "JSXText" ? first.value.match(/^[ \t]*\n([ \t]*)/) : source.slice(oe.end, first.start).match(/\n([ \t]*)$/);
  const block = !!leadingWs;
  if (block) {
    const childIndent = leadingWs[1];
    const tagIndent = indentOf(source, el.closingElement);
    s.overwrite(oe.end, last.end, `\n${childIndent}${encoded}`);
    // Keep whatever trailing whitespace/comment run exists after `last`.
    const trailing = source.slice(last.end, el.closingElement.start);
    if (!trailing.includes("\n")) s.appendLeft(el.closingElement.start, `\n${tagIndent}`);
  } else {
    s.overwrite(first.start, last.end, encoded);
  }
}

// -------------------------------------------------------------- public API

/**
 * changes = { props?: {name: value|null}, style?: {key: value|null}, text?: string }
 */
export function patchElement(source, loc, changes = {}) {
  const ast = parseSlide(source);
  const el = getElement(ast, loc);
  const s = new MagicString(source);
  const oe = el.openingElement;

  for (const [name, value] of Object.entries(changes.props || {})) {
    if (name === "data-loc") continue;
    const attr = findAttr(el, name);
    if (value === null || value === undefined) {
      if (attr) removeAttr(s, source, attr);
      continue;
    }
    if (attr) {
      if (!isEditableAttr(attr) && !isExprValue(value)) {
        throw new HttpError(422, `prop "${name}" is an expression; edit it in code`, { prop: name });
      }
      s.overwrite(attr.start, attr.end, serializeAttr(name, value));
    } else {
      insertAttr(s, source, oe, serializeAttr(name, value));
    }
  }

  if (changes.style) {
    const styleAttr = findAttr(el, "style");
    const entries = Object.entries(changes.style);
    const nonNull = entries.filter(([, v]) => v !== null && v !== undefined);
    if (!styleAttr) {
      if (nonNull.length) insertAttr(s, source, oe, `style={${toJsExpr(Object.fromEntries(nonNull))}}`);
    } else {
      const v = styleAttr.value;
      if (!v || v.type !== "JSXExpressionContainer" || v.expression.type !== "ObjectExpression") {
        throw new HttpError(422, "style is not an inline object literal; edit it in code");
      }
      patchObjectLiteral(s, source, v.expression, changes.style);
    }
  }

  if (typeof changes.text === "string") setText(s, source, el, changes.text);

  return { code: assertParses(s.toString()), loc };
}

/** Append a JSX snippet as the last child of `parentLoc` (or the slide root). */
export function insertChild(source, { parentLoc = null, jsx }) {
  parseJsxSnippet(jsx);
  const ast = parseSlide(source);
  const parent = parentLoc ? getElement(ast, parentLoc) : findSlideRoot(ast);
  if (!parent) throw new HttpError(422, "slide has no JSX root element to insert into");
  const s = new MagicString(source);
  const oe = parent.openingElement;
  let offset;

  if (oe.selfClosing) {
    const parentIndent = indentOf(source, parent);
    const childIndent = parentIndent + "  ";
    let i = oe.end - 2;
    while (i > 0 && /[ \t\n]/.test(source[i - 1])) i--;
    const prefix = `>\n${childIndent}`;
    s.overwrite(i, oe.end, `${prefix}${reindent(jsx, childIndent)}\n${parentIndent}</${elementName(parent)}>`);
    offset = i + prefix.length;
  } else {
    const isWs = (n) => n.type === "JSXText" && n.value.trim() === "";
    const kids = parent.children.filter((c) => !isWs(c));
    if (kids.length) {
      const lastNode = kids[kids.length - 1];
      const childIndent = aloneOnLine(source, lastNode) ? indentOf(source, lastNode) : indentOf(source, parent) + "  ";
      const prefix = `\n\n${childIndent}`;
      s.appendLeft(lastNode.end, prefix + reindent(jsx, childIndent));
      offset = lastNode.end + prefix.length;
    } else {
      const parentIndent = indentOf(source, parent);
      const childIndent = parentIndent + "  ";
      const prefix = `\n${childIndent}`;
      s.overwrite(oe.end, parent.closingElement.start, `${prefix}${reindent(jsx, childIndent)}\n${parentIndent}`);
      offset = oe.end + prefix.length;
    }
  }

  const code = assertParses(s.toString());
  const newAst = parseSlide(code);
  let loc = null;
  for (const el of indexElements(newAst).values()) {
    if (el.start === offset) {
      loc = locKey(el);
      break;
    }
  }
  if (!loc) throw new HttpError(500, "inserted element could not be located after insert");
  return { code, loc };
}

/** Remove an element (and an own-line comment directly above it). */
export function deleteElement(source, loc) {
  const ast = parseSlide(source);
  const el = getElement(ast, loc);
  const s = new MagicString(source);

  // Find parent + previous sibling to detect a leading own-line comment.
  let parentLoc = null;
  let prevSibling = null;
  for (const cand of indexElements(ast).values()) {
    const idx = cand.children.indexOf(el);
    if (idx === -1) continue;
    parentLoc = locKey(cand);
    for (let i = idx - 1; i >= 0; i--) {
      const c = cand.children[i];
      if (c.type === "JSXText" && c.value.trim() === "") continue;
      prevSibling = c;
      break;
    }
    break;
  }

  let start = el.start;
  let end = el.end;
  if (aloneOnLine(source, el)) {
    start = Math.max(0, lineStartOf(source, el.start) - 1);
    if (
      prevSibling &&
      prevSibling.type === "JSXExpressionContainer" &&
      prevSibling.expression.type === "JSXEmptyExpression" &&
      aloneOnLine(source, prevSibling) &&
      source.slice(prevSibling.end, lineStartOf(source, el.start)).trim() === ""
    ) {
      start = Math.max(0, lineStartOf(source, prevSibling.start) - 1);
    }
    // Collapse surplus blank lines around the cut.
    const before = source.slice(0, start);
    const after = source.slice(end);
    const n1 = before.match(/\n*$/)[0].length;
    const n2 = after.match(/^\n*/)[0].length;
    const closesParent = /^\n*[ \t]*<\//.test(after);
    const allowed = closesParent ? 1 : 2;
    if (n1 + n2 > allowed) end += Math.min(n2, n1 + n2 - allowed);
  }
  s.remove(start, end);
  return { code: assertParses(s.toString()), parentLoc };
}

/** Wrap an element: `<Wrapper …>` + element + `</Wrapper>`. */
export function wrapElement(source, loc, { wrapperOpen, wrapperName }) {
  const ast = parseSlide(source);
  const el = getElement(ast, loc);
  parseJsxSnippet(`${wrapperOpen}</${wrapperName}>`);
  const s = new MagicString(source);
  const text = source.slice(el.start, el.end);
  if (aloneOnLine(source, el)) {
    const indent = indentOf(source, el);
    const inner = text.split("\n").join("\n  ");
    s.overwrite(el.start, el.end, `${wrapperOpen}\n${indent}  ${inner}\n${indent}</${wrapperName}>`);
  } else {
    s.overwrite(el.start, el.end, `${wrapperOpen}${text}</${wrapperName}>`);
  }
  return { code: assertParses(s.toString()), loc };
}

/** Make sure `import Name from "../components/Name.jsx"` exists for each name. */
export function ensureImports(source, names = []) {
  const ast = parseSlide(source);
  const have = new Set(listImports(ast).map((i) => i.name));
  const missing = [...new Set(names)].filter((n) => !have.has(n));
  if (!missing.length) return { code: source, addedLines: 0 };
  const s = new MagicString(source);
  const imports = ast.program.body.filter((st) => st.type === "ImportDeclaration");
  const text = missing.map((n) => `import ${n} from "../components/${n}.jsx";`).join("\n");
  if (imports.length) {
    s.appendLeft(imports[imports.length - 1].end, `\n${text}`);
  } else {
    s.prepend(`${text}\n`);
  }
  // Imports land above every element: callers shift "line:col" locs by addedLines.
  return { code: assertParses(s.toString()), addedLines: missing.length };
}

/** Shift a "line:col" key down by `lines` (after inserting lines above it). */
export function shiftLoc(loc, lines) {
  if (!lines) return loc;
  const [l, c] = loc.split(":").map(Number);
  return `${l + lines}:${c}`;
}

/** `function Slide()` → `function Slide({ assets })` when assets are referenced. */
export function ensureAssetsParam(source) {
  const ast = parseSlide(source);
  const fn = findSlideFunction(ast);
  if (!fn) return { code: source };
  const s = new MagicString(source);
  if (!fn.params.length) {
    const open = source.indexOf("(", fn.id ? fn.id.end : fn.start);
    if (open === -1) return { code: source };
    s.appendLeft(open + 1, "{ assets }");
  } else {
    const p = fn.params[0];
    if (p.type === "ObjectPattern") {
      const has = p.properties.some((pp) => pp.type === "ObjectProperty" && keyName(pp.key) === "assets");
      if (has) return { code: source };
      if (p.properties.length) s.appendLeft(p.properties[p.properties.length - 1].end, ", assets");
      else s.overwrite(p.start, p.end, "{ assets }");
    } else {
      return { code: source }; // `props` style param — leave alone
    }
  }
  return { code: assertParses(s.toString()) };
}

/** Append `{ key, path, type }` to meta.assets (creating it if needed). */
export function addAssetEntry(source, { key, path: assetPath, type }) {
  const ast = parseSlide(source);
  const meta = findMeta(ast);
  if (!meta) throw new HttpError(422, "slide has no `export const meta = {…}`");
  const entry = `{ key: ${JSON.stringify(key)}, path: ${JSON.stringify(assetPath)}, type: ${JSON.stringify(type)} }`;
  const s = new MagicString(source);
  const prop = findProp(meta, "assets");
  if (!prop || prop.value.type !== "ArrayExpression") {
    if (prop) throw new HttpError(422, "meta.assets is not an array literal");
    patchObjectLiteral(s, source, meta, { assets: { __expr: `[${entry}]` } });
    return { code: assertParses(s.toString()) };
  }
  const arr = prop.value;
  const elements = arr.elements.filter(Boolean);
  const multiLine = arr.loc.start.line !== arr.loc.end.line;
  if (elements.length) {
    const last = elements[elements.length - 1];
    if (multiLine) {
      const indent = indentOf(source, last);
      const afterLast = skipSpaces(source, last.end);
      if (source[afterLast] === ",") s.appendLeft(afterLast + 1, `\n${indent}${entry},`);
      else s.appendLeft(last.end, `,\n${indent}${entry}`);
    } else {
      s.appendLeft(last.end, `, ${entry}`);
    }
  } else if (multiLine) {
    const arrIndent = indentAt(source, arr.start);
    s.appendLeft(arr.end - 1, `  ${entry},\n${arrIndent}`);
  } else {
    s.overwrite(arr.start, arr.end, `[${entry}]`);
  }
  return { code: assertParses(s.toString()) };
}

/** Edit meta.title / meta.background / meta.transition. */
export function patchMeta(source, changes) {
  const ast = parseSlide(source);
  const meta = findMeta(ast);
  if (!meta) throw new HttpError(422, "slide has no `export const meta = {…}`");
  const s = new MagicString(source);
  const edits = {};
  if ("title" in changes) edits.title = String(changes.title ?? "");
  if ("background" in changes) edits.background = changes.background ? String(changes.background) : null;
  if ("transition" in changes) {
    const t = changes.transition;
    if (t === null) edits.transition = null;
    else {
      const out = { kind: String(t.kind || "fade") };
      if (t.duration != null && t.duration !== "") out.duration = Number(t.duration);
      if (t.params && typeof t.params === "object" && Object.keys(t.params).length) out.params = t.params;
      edits.transition = out;
    }
  }
  patchObjectLiteral(s, source, meta, edits);
  return { code: assertParses(s.toString()) };
}

/**
 * Turn a template file into a fresh slide: rewrite meta.id + meta.title and
 * drop the `export const template = {…}` descriptor (a stray non-component
 * export would make Fast Refresh full-reload the new slide on every save).
 * Returns the literal `meta.assets` entries so the caller can copy them.
 */
export function instantiateTemplate(template, { id, title }) {
  const ast = parseSlide(template);
  const meta = findMeta(ast);
  if (!meta) throw new HttpError(500, "template has no meta");
  const s = new MagicString(template);
  patchObjectLiteral(s, template, meta, { id, title });
  for (const st of ast.program.body) {
    if (st.type !== "ExportNamedDeclaration" || st.declaration?.type !== "VariableDeclaration") continue;
    const isTemplate = st.declaration.declarations.some((d) => d.id.type === "Identifier" && d.id.name === "template");
    if (!isTemplate) continue;
    let end = st.end;
    while (end < template.length && template[end] === "\n") end++;
    s.remove(lineStartOf(template, st.start), end);
  }
  const assets = [];
  const prop = findProp(meta, "assets");
  if (prop && prop.value.type === "ArrayExpression") {
    for (const el of prop.value.elements) {
      const lit = literalValue(el);
      if (lit.ok && lit.value && typeof lit.value === "object") assets.push(lit.value);
    }
  }
  return { code: assertParses(s.toString()), assets };
}

/** Point meta.assets entries (by key) at new paths, e.g. per-slide copies. */
export function rewriteAssetPaths(source, pathByKey) {
  const ast = parseSlide(source);
  const meta = findMeta(ast);
  if (!meta) throw new HttpError(422, "slide has no `export const meta = {…}`");
  const prop = findProp(meta, "assets");
  if (!prop || prop.value.type !== "ArrayExpression") return { code: source };
  const s = new MagicString(source);
  let changed = false;
  for (const el of prop.value.elements) {
    if (!el || el.type !== "ObjectExpression") continue;
    const keyProp = findProp(el, "key");
    const pathProp = findProp(el, "path");
    const key = keyProp?.value.type === "StringLiteral" ? keyProp.value.value : null;
    if (key == null || !(key in pathByKey) || !pathProp) continue;
    s.overwrite(pathProp.value.start, pathProp.value.end, JSON.stringify(pathByKey[key]));
    changed = true;
  }
  return { code: changed ? assertParses(s.toString()) : source };
}
