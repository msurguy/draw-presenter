// Decide WHAT source node moves when the user drags a selected element, and
// which style keys hold its position. Encodes the slide-author rule: GSAP
// transforms the <Appear> wrapper, so absolute positioning lives on the
// wrapper, never on its child.
//
// Returns:
//   { kind: "props" | "style" | "flow" | "locked",
//     targetLoc, target,             // node whose x/y|style is written
//     anchors: { h: "left"|"right"|"both", v: "top"|"bottom"|"both" },
//     via,                            // ancestor name when target !== element
//     reason, warnings: [],
//     convertTargetLoc }              // where "Convert to absolute" should write

export function indexTree(root) {
  const map = new Map();
  const walk = (n) => {
    if (!n) return;
    map.set(n.loc, n);
    n.children.forEach(walk);
  };
  walk(root);
  return map;
}

export const styleEntry = (node, key) => node?.style?.entries?.find((e) => e.key === key) || null;
export const styleNum = (node, key) => {
  const e = styleEntry(node, key);
  return e && e.kind === "number" ? e.value : null;
};
export const propEntry = (node, name) => node?.props?.find((p) => p.name === name) || null;
export const propNum = (node, name) => {
  const p = propEntry(node, name);
  return p && p.kind === "number" ? p.value : null;
};

export const isAbsolute = (node) => styleEntry(node, "position")?.value === "absolute";
const hasInset = (node) => !!styleEntry(node, "inset");

function anchorsOf(node) {
  const left = styleEntry(node, "left");
  const right = styleEntry(node, "right");
  const top = styleEntry(node, "top");
  const bottom = styleEntry(node, "bottom");
  return {
    h: left && right ? "both" : right ? "right" : "left",
    v: top && bottom ? "both" : bottom ? "bottom" : "top",
  };
}

const contentChildCount = (node) => node.children.length + (node.text?.value ? 1 : 0);

export function layoutTarget(index, loc) {
  const node = index.get(loc);
  if (!node) return { kind: "locked", reason: "unknown element", warnings: [] };
  const warnings = [];
  const parent = node.parentLoc ? index.get(node.parentLoc) : null;
  // "Convert to absolute" should position the outermost wrapper that exists
  // only for this element (Appear, BrushReveal as="div", a bare div…), so
  // entrances and annotations keep their geometry.
  let convertTarget = node;
  for (let p = parent; p && p.parentLoc && !isAbsolute(p) && contentChildCount(p) === 1; p = index.get(p.parentLoc)) {
    convertTarget = p;
  }
  const convertTargetLoc = convertTarget.loc;
  // Inline text runs (a word span inside a <p>) cannot be lifted out of flow
  // without breaking the sentence. Only counts when the parent holds words of
  // its own — a wrapper div around a single component is a block, not a
  // sentence, even though its `text` is not editable either.
  const inline = !!parent && parent.text != null && parent.text.editable === false && parent.text.hasText === true && node.children.length === 0 && !isAbsolute(node);

  if (node.repeated) {
    return { kind: "locked", reason: "generated in a loop — edit props instead", targetLoc: loc, target: node, warnings, convertTargetLoc };
  }

  if ((node.name === "Img" || node.name === "SvgIcon") && (propNum(node, "x") != null || propNum(node, "y") != null)) {
    return { kind: "props", targetLoc: loc, target: node, anchors: { h: "left", v: "top" }, warnings, convertTargetLoc };
  }

  if (isAbsolute(node)) {
    if (hasInset(node)) {
      return { kind: "locked", reason: "fills its parent (inset)", targetLoc: loc, target: node, warnings, convertTargetLoc };
    }
    if (parent && parent.name === "Appear") {
      warnings.push("absolute child inside <Appear> — move the position onto the Appear wrapper");
    }
    return { kind: "style", targetLoc: loc, target: node, anchors: anchorsOf(node), warnings, convertTargetLoc };
  }

  // Walk up to the nearest positioned ancestor.
  let child = node;
  let a = parent;
  while (a) {
    if (isAbsolute(a)) {
      if (inline) {
        return { kind: "flow", inline: true, reason: "inline text inside its paragraph", targetLoc: loc, target: node, container: a, warnings, convertTargetLoc };
      }
      if (!a.parentLoc || hasInset(a)) {
        return { kind: "flow", reason: "positioned by flow inside the slide root", targetLoc: loc, target: node, container: a, warnings, convertTargetLoc };
      }
      const soleChild = contentChildCount(a) === 1;
      if (a.name === "Appear" || soleChild) {
        return {
          kind: "style",
          targetLoc: a.loc,
          target: a,
          via: a.name,
          anchors: anchorsOf(a),
          warnings,
          convertTargetLoc,
        };
      }
      return {
        kind: "flow",
        inline,
        reason: `laid out by its container <${a.name}> (${a.loc})`,
        targetLoc: loc,
        target: node,
        container: a,
        warnings,
        convertTargetLoc,
      };
    }
    child = a;
    a = a.parentLoc ? index.get(a.parentLoc) : null;
  }
  return { kind: "flow", reason: "positioned by flow", targetLoc: loc, target: node, warnings, convertTargetLoc };
}

/** Breadcrumb chain root → node. */
export function ancestors(index, loc) {
  const out = [];
  let n = index.get(loc);
  while (n) {
    out.unshift(n);
    n = n.parentLoc ? index.get(n.parentLoc) : null;
  }
  return out;
}

/** Nearest ancestor (or self) that owns an entrance animation. */
export function animationOwner(index, loc, animatedNames) {
  let n = index.get(loc);
  while (n) {
    if (animatedNames.has(n.name)) return n;
    n = n.parentLoc ? index.get(n.parentLoc) : null;
  }
  return null;
}
