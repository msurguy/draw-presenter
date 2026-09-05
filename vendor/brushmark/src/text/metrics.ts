import type { LineRect } from "../types";

/**
 * Per-word boxes inside each measured DOM line, read directly from the
 * rendered layout with a DOM Range (layout reads only, no writes — no forced
 * reflow). Coordinates are viewport CSS px, so they agree with the line rects
 * by construction: kerning, ligatures, letter-spacing, text-transform and
 * nested markup (e.g. a bold span inside a word) are all reflected exactly.
 *
 * Words are whitespace-separated runs; a word split across nodes by inline
 * markup is merged back into one box, and a word broken across lines
 * (hyphenation, overflow-wrap) contributes one box per line.
 *
 * Returns null when the words don't group into exactly one row per measured
 * line (e.g. `multiline: false` while the text actually wraps) — callers
 * fall back to line-level animation.
 */
export function measureWordBoxes(
  el: HTMLElement,
  domLines: LineRect[],
): LineRect[][] | null {
  if (domLines.length === 0) return null;

  const doc = el.ownerDocument;
  const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  const rawRects: LineRect[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? "";
    const wordRe = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = wordRe.exec(text))) {
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      for (const r of range.getClientRects()) {
        if (r.width > 0 && r.height > 0) {
          rawRects.push({ x: r.left, y: r.top, w: r.width, h: r.height });
        }
      }
    }
  }
  if (rawRects.length === 0) return null;

  // Cluster rects into visual rows: rects on one line vertically overlap,
  // rects on different lines don't.
  rawRects.sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: Array<{ rects: LineRect[]; top: number; bottom: number }> = [];
  for (const r of rawRects) {
    const row = rows[rows.length - 1];
    if (row && r.y < row.bottom - 0.5) {
      row.rects.push(r);
      row.bottom = Math.max(row.bottom, r.y + r.h);
    } else {
      rows.push({ rects: [r], top: r.y, bottom: r.y + r.h });
    }
  }
  if (rows.length !== domLines.length) return null;

  const out: LineRect[][] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = domLines[i];
    // Rows and lines are both sorted top-to-bottom; require them to agree.
    if (Math.min(row.bottom, line.y + line.h) - Math.max(row.top, line.y) <= 0) {
      return null;
    }
    row.rects.sort((a, b) => a.x - b.x);
    const boxes: LineRect[] = [];
    for (const r of row.rects) {
      const last = boxes[boxes.length - 1];
      if (last && r.x - (last.x + last.w) <= 1) {
        // Touching fragments are one visual word split by markup boundaries.
        last.w = Math.max(last.w, r.x + r.w - last.x);
      } else {
        // y/h come from the line box — consumers segment by x/w and draw at
        // line-derived heights.
        boxes.push({ x: r.x, y: line.y, w: r.w, h: line.h });
      }
    }
    out.push(boxes);
  }
  return out;
}
