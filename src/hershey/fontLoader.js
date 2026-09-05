import SvgPath from "svgpath";
import { fontFileUrl } from "./fonts.js";

// Parses an SVG font document (Hershey-style single-stroke fonts: <font>,
// <font-face>, <glyph> elements) into a per-character glyph map at the given
// pixel size. Glyph outlines are flipped from font coordinates (Y-up from the
// baseline) to screen coordinates.

export function parseFont(element, size = 24) {
  const result = {};

  const svgFont = element.getElementsByTagName("font")[0];
  const svgFontface = element.getElementsByTagName("font-face")[0];
  const svgGlyphs = element.getElementsByTagName("glyph");
  if (!svgFont || !svgFontface) throw new Error("Not an SVG font file");

  const fontHorizAdvX = svgFont.getAttribute("horiz-adv-x");
  const fontAscent = parseFloat(svgFontface.getAttribute("ascent") || "0");
  const fontUnitsPerEm = parseFloat(svgFontface.getAttribute("units-per-em") || "1000");

  const EM = size;
  const scale = EM / fontUnitsPerEm;

  for (let i = 0; i < svgGlyphs.length; i++) {
    const svgGlyph = svgGlyphs[i];
    const d = svgGlyph.getAttribute("d");
    const unicode = svgGlyph.getAttribute("unicode");
    if (unicode == null) continue;
    const name = svgGlyph.getAttribute("glyph-name") || "glyph" + unicode;
    const width = parseFloat(svgGlyph.getAttribute("horiz-adv-x") || fontHorizAdvX || "0");

    result[unicode] = {
      d: d
        ? new SvgPath(d).translate(0, -fontAscent).scale(scale, -scale).abs().rel().toString()
        : null,
      unicode,
      name,
      width: width * scale,
      height: EM,
    };
  }

  // Some Hershey dumps carry no space glyph; synthesize one so words keep
  // their gaps.
  if (!result[" "]) {
    const spaceUnits = parseFloat(fontHorizAdvX || "") || fontUnitsPerEm / 3;
    result[" "] = { d: null, unicode: " ", name: "space", width: spaceUnits * scale, height: EM };
  }
  return result;
}

// ---------------------------------------------------------------- caching --

const docCache = new Map(); // font name → Promise<Document>
const fontCache = new Map(); // `${name}@${size}` → Promise<FontData>

export function loadFont(name, size) {
  const key = `${name}@${size}`;
  if (fontCache.has(key)) return fontCache.get(key);

  if (!docCache.has(name)) {
    docCache.set(
      name,
      fetch(fontFileUrl(name))
        .then((res) => {
          if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
          return res.text();
        })
        .then((text) => new DOMParser().parseFromString(text, "image/svg+xml")),
    );
  }

  const promise = docCache.get(name).then((doc) => parseFont(doc, size));
  promise.catch((err) => console.error(`[hershey] failed to load font "${name}":`, err));
  fontCache.set(key, promise);
  return promise;
}
