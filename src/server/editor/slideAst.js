import { parse, parseExpression } from "@babel/parser";
import { HttpError } from "./http.js";

// ---------------------------------------------------------------------------
// Slide source analysis. Shared by the dev-time tag plugin (which stamps every
// JSX element with its source location) and the editor API (which reads the
// same locations back to find nodes to patch).
//
// Element identity = "line:column" of the opening `<` (1-based line, 0-based
// column, exactly Babel's loc.start).
// ---------------------------------------------------------------------------

export function parseSlide(source) {
  try {
    return parse(source, {
      sourceType: "module",
      plugins: ["jsx"],
      attachComment: false,
    });
  } catch (err) {
    throw new HttpError(500, `slide source does not parse: ${err.message}`);
  }
}

export function parseJsxSnippet(jsx) {
  let node;
  try {
    node = parseExpression(jsx, { plugins: ["jsx"] });
  } catch (err) {
    throw new HttpError(422, `snippet is not valid JSX: ${err.message}`);
  }
  if (node.type !== "JSXElement") throw new HttpError(422, "snippet must be a single JSX element");
  return node;
}

export function validateExpression(expr) {
  try {
    parseExpression(expr, { plugins: ["jsx"] });
  } catch (err) {
    throw new HttpError(422, `invalid expression: ${err.message}`);
  }
}

export const locKey = (node) => `${node.loc.start.line}:${node.loc.start.column}`;

// ------------------------------------------------------------------ walking

const SKIP_KEYS = new Set([
  "loc",
  "start",
  "end",
  "range",
  "extra",
  "leadingComments",
  "trailingComments",
  "innerComments",
]);

/**
 * Generic AST walk. `visit(node, parent, ctx)` may return `false` to skip the
 * subtree, or an object to become the ctx for the subtree.
 */
export function walk(node, visit, parent = null, ctx = {}) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) walk(n, visit, parent, ctx);
    return;
  }
  if (typeof node.type !== "string") return;
  const r = visit(node, parent, ctx);
  if (r === false) return;
  const childCtx = r && typeof r === "object" ? r : ctx;
  for (const key of Object.keys(node)) {
    if (SKIP_KEYS.has(key)) continue;
    const v = node[key];
    if (v && typeof v === "object") walk(v, visit, node, childCtx);
  }
}

/** Visit every JSXElement in the file. */
export function walkJsx(ast, visit) {
  walk(ast, (node) => {
    if (node.type === "JSXElement") visit(node);
  });
}

/** Map "line:col" → JSXElement for the whole file. */
export function indexElements(ast) {
  const map = new Map();
  walkJsx(ast, (el) => map.set(locKey(el), el));
  return map;
}

export function getElement(ast, loc) {
  const el = indexElements(ast).get(loc);
  if (!el) throw new HttpError(404, `element ${loc} not found (source changed?)`, { stale: true });
  return el;
}

// ------------------------------------------------------------------ naming

export function jsxName(nameNode) {
  if (!nameNode) return "";
  if (nameNode.type === "JSXIdentifier") return nameNode.name;
  if (nameNode.type === "JSXMemberExpression") {
    return `${jsxName(nameNode.object)}.${nameNode.property.name}`;
  }
  if (nameNode.type === "JSXNamespacedName") {
    return `${nameNode.namespace.name}:${nameNode.name.name}`;
  }
  return "";
}

export const elementName = (el) => jsxName(el.openingElement.name);

export const isComponentName = (name) => /^[A-Z]/.test(name) || name.includes(".");

export function keyName(keyNode) {
  if (!keyNode) return null;
  if (keyNode.type === "Identifier") return keyNode.name;
  if (keyNode.type === "StringLiteral") return keyNode.value;
  if (keyNode.type === "NumericLiteral") return String(keyNode.value);
  return null;
}

// ----------------------------------------------------------------- literals

/** Static literal value of an expression node, or { ok: false }. */
export function literalValue(node) {
  if (!node) return { ok: false };
  switch (node.type) {
    case "NumericLiteral":
    case "StringLiteral":
    case "BooleanLiteral":
      return { ok: true, value: node.value };
    case "NullLiteral":
      return { ok: true, value: null };
    case "UnaryExpression":
      if (node.operator === "-" && node.argument.type === "NumericLiteral") {
        return { ok: true, value: -node.argument.value };
      }
      return { ok: false };
    case "TemplateLiteral":
      if (node.expressions.length === 0) {
        return { ok: true, value: node.quasis.map((q) => q.value.cooked).join("") };
      }
      return { ok: false };
    case "ArrayExpression": {
      const out = [];
      for (const el of node.elements) {
        const r = literalValue(el);
        if (!r.ok) return { ok: false };
        out.push(r.value);
      }
      return { ok: true, value: out };
    }
    case "ObjectExpression": {
      const out = {};
      for (const p of node.properties) {
        if (p.type !== "ObjectProperty" || p.computed) return { ok: false };
        const k = keyName(p.key);
        if (k == null) return { ok: false };
        const r = literalValue(p.value);
        if (!r.ok) return { ok: false };
        out[k] = r.value;
      }
      return { ok: true, value: out };
    }
    default:
      return { ok: false };
  }
}

export const isLiteral = (node) => literalValue(node).ok;

export function kindOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value; // string | number | boolean | object
}

export function findAttr(el, name) {
  return el.openingElement.attributes.find(
    (a) => a.type === "JSXAttribute" && a.name.type === "JSXIdentifier" && a.name.name === name,
  );
}

/** Is the attribute's current value something the editor may overwrite? */
export function isEditableAttr(attr) {
  if (!attr.value) return true; // bare boolean
  if (attr.value.type === "StringLiteral") return true;
  if (attr.value.type === "JSXExpressionContainer") return isLiteral(attr.value.expression);
  return false;
}

// -------------------------------------------------------------- structure

/** The default-exported slide function (FunctionDeclaration or arrow). */
export function findSlideFunction(ast) {
  for (const stmt of ast.program.body) {
    if (stmt.type !== "ExportDefaultDeclaration") continue;
    const d = stmt.declaration;
    if (d.type === "FunctionDeclaration" || d.type === "ArrowFunctionExpression" || d.type === "FunctionExpression") {
      return d;
    }
  }
  return null;
}

/** The root JSXElement returned by the slide component. */
export function findSlideRoot(ast) {
  const fn = findSlideFunction(ast);
  if (!fn) return null;
  let expr = null;
  if (fn.body.type === "BlockStatement") {
    for (const st of fn.body.body) {
      if (st.type === "ReturnStatement") expr = st.argument;
    }
  } else {
    expr = fn.body;
  }
  if (!expr) return null;
  if (expr.type === "JSXElement") return expr;
  return null; // fragments / conditionals are not insert targets
}

/** `export const meta = { … }` → the ObjectExpression node. */
export function findMeta(ast) {
  for (const stmt of ast.program.body) {
    if (stmt.type !== "ExportNamedDeclaration") continue;
    const d = stmt.declaration;
    if (!d || d.type !== "VariableDeclaration") continue;
    for (const decl of d.declarations) {
      if (decl.id.type === "Identifier" && decl.id.name === "meta" && decl.init?.type === "ObjectExpression") {
        return decl.init;
      }
    }
  }
  return null;
}

export function findProp(obj, key) {
  return obj.properties.find((p) => p.type === "ObjectProperty" && !p.computed && keyName(p.key) === key);
}

export function listImports(ast) {
  const out = [];
  for (const stmt of ast.program.body) {
    if (stmt.type !== "ImportDeclaration") continue;
    for (const sp of stmt.specifiers) {
      if (sp.type === "ImportDefaultSpecifier") out.push({ name: sp.local.name, source: stmt.source.value });
      else if (sp.type === "ImportSpecifier") out.push({ name: sp.local.name, source: stmt.source.value, named: true });
    }
  }
  return out;
}

// ---------------------------------------------------------------- summary

/** Loose reading of a JSX text run, approximating React's whitespace rules. */
export function jsxTextToString(raw) {
  if (!raw.includes("\n")) return raw;
  const lines = raw.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    let l = lines[i];
    if (i > 0) l = l.replace(/^[ \t\r]+/, "");
    if (i < lines.length - 1) l = l.replace(/[ \t\r]+$/, "");
    if (l.length) out.push(l);
  }
  return out.join(" ");
}

const isCommentContainer = (n) =>
  n.type === "JSXExpressionContainer" && n.expression.type === "JSXEmptyExpression";

/** Children that carry content (drops whitespace-only text and comments). */
export function contentChildren(el) {
  return el.children.filter((c) => {
    if (c.type === "JSXText") return c.value.trim().length > 0;
    return !isCommentContainer(c);
  });
}

export function describeText(el) {
  if (el.openingElement.selfClosing) return null;
  const kids = contentChildren(el);
  if (!kids.length) return { editable: true, value: "" };
  // `hasText`: the element holds real words of its own (not just child
  // elements), so a child element is a run inside a sentence rather than a
  // laid-out block. The editor's layout rules use it to tell the two apart.
  const hasText = el.children.some(
    (c) =>
      (c.type === "JSXText" && c.value.trim().length > 0) ||
      (c.type === "JSXExpressionContainer" && c.expression.type === "StringLiteral" && c.expression.value.trim().length > 0),
  );
  const parts = [];
  let sawComment = false;
  for (const c of el.children) {
    if (c.type === "JSXText") {
      parts.push(jsxTextToString(c.value));
    } else if (isCommentContainer(c)) {
      if (parts.some((p) => p.length)) sawComment = true;
    } else if (c.type === "JSXExpressionContainer" && c.expression.type === "StringLiteral") {
      parts.push(c.expression.value);
    } else {
      return { editable: false, value: null, hasText };
    }
  }
  const value = parts.join("");
  const hasTrailingComment = sawComment && kids.length && el.children.indexOf(kids[kids.length - 1]) < el.children.length - 1;
  return { editable: !sawComment || hasTrailingComment, value };
}

function describeAttr(attr, source) {
  if (attr.type !== "JSXAttribute" || attr.name.type !== "JSXIdentifier") return null;
  const name = attr.name.name;
  if (!attr.value) return { name, kind: "boolean", value: true, raw: "", editable: true };
  if (attr.value.type === "StringLiteral") {
    return { name, kind: "string", value: attr.value.value, raw: attr.value.value, editable: true };
  }
  if (attr.value.type === "JSXExpressionContainer") {
    const expr = attr.value.expression;
    const raw = source.slice(expr.start, expr.end);
    const lit = literalValue(expr);
    if (lit.ok) return { name, kind: kindOf(lit.value), value: lit.value, raw, editable: true };
    return { name, kind: "expr", value: undefined, raw, editable: false };
  }
  return { name, kind: "expr", value: undefined, raw: source.slice(attr.start, attr.end), editable: false };
}

function describeStyle(el, source) {
  const attr = findAttr(el, "style");
  if (!attr) return null;
  const v = attr.value;
  if (!v || v.type !== "JSXExpressionContainer" || v.expression.type !== "ObjectExpression") {
    return { editable: false, hasSpread: false, entries: [], raw: source.slice(attr.start, attr.end) };
  }
  const obj = v.expression;
  const entries = [];
  let hasSpread = false;
  for (const p of obj.properties) {
    if (p.type === "SpreadElement") {
      hasSpread = true;
      continue;
    }
    if (p.type !== "ObjectProperty" || p.computed) continue;
    const key = keyName(p.key);
    if (key == null) continue;
    const raw = source.slice(p.value.start, p.value.end);
    const lit = literalValue(p.value);
    if (lit.ok) entries.push({ key, kind: kindOf(lit.value), value: lit.value, raw, editable: true });
    else entries.push({ key, kind: "expr", value: undefined, raw, editable: false });
  }
  return { editable: true, hasSpread, entries };
}

/**
 * Summary tree rooted at the slide's returned JSX. Elements inside nested
 * functions are `repeated`; inside ?:/&&/|| they are `conditional`.
 */
export function collectElements(ast, source) {
  const root = findSlideRoot(ast);
  const maxOrderByStep = {};
  const noteOrder = (node) => {
    const stepAttr = findAttr(node, "step");
    const orderAttr = findAttr(node, "order");
    const step = stepAttr ? literalValue(stepAttr.value?.expression).value ?? 0 : 0;
    const order = orderAttr ? literalValue(orderAttr.value?.expression).value ?? 0 : 0;
    if (typeof step === "number" && typeof order === "number") {
      maxOrderByStep[step] = Math.max(maxOrderByStep[step] ?? 0, order);
    }
  };

  const summarize = (el, parentLoc, flags) => {
    const name = elementName(el);
    noteOrder(el);
    const node = {
      loc: locKey(el),
      start: el.start,
      end: el.end,
      line: el.loc.start.line,
      name,
      kind: isComponentName(name) ? "component" : "host",
      selfClosing: !!el.openingElement.selfClosing,
      props: el.openingElement.attributes.map((a) => describeAttr(a, source)).filter(Boolean),
      hasSpreadProps: el.openingElement.attributes.some((a) => a.type === "JSXSpreadAttribute"),
      style: describeStyle(el, source),
      text: describeText(el),
      children: [],
      parentLoc,
      repeated: flags.repeated,
      conditional: flags.conditional,
    };
    // Direct JSX descendants: walk children, stop at nested elements.
    walk(
      el.children,
      (n, parent, ctx) => {
        if (n.type === "JSXElement") {
          node.children.push(summarize(n, node.loc, ctx));
          return false;
        }
        if (n.type === "JSXAttribute") return false; // elements in props are not layers
        if (
          n.type === "ArrowFunctionExpression" ||
          n.type === "FunctionExpression" ||
          n.type === "FunctionDeclaration"
        ) {
          return { ...ctx, repeated: true };
        }
        if (n.type === "ConditionalExpression" || n.type === "LogicalExpression") {
          return { ...ctx, conditional: true };
        }
        return undefined;
      },
      el,
      flags,
    );
    return node;
  };

  const tree = root ? summarize(root, null, { repeated: false, conditional: false }) : null;

  const metaObj = findMeta(ast);
  const meta = {};
  if (metaObj) {
    for (const p of metaObj.properties) {
      if (p.type !== "ObjectProperty" || p.computed) continue;
      const k = keyName(p.key);
      const lit = literalValue(p.value);
      meta[k] = lit.ok ? lit.value : { __expr: source.slice(p.value.start, p.value.end) };
    }
  }

  return {
    root: tree,
    meta,
    imports: listImports(ast),
    maxOrderByStep,
    rootLoc: root ? locKey(root) : null,
  };
}
