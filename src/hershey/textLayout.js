import SvgPath from "svgpath";

// Lays glyph stroke paths out into positioned text (lines, alignment,
// character spacing) using the glyph advances from the SVG font.

export function measureLineWidths(inputText, fontData, charSpacing = 0) {
  const lineWidths = [];
  let width = 0;
  const chars = Array.from(inputText || "");
  chars.forEach((ch, idx) => {
    if (ch === "\n") {
      lineWidths.push(width);
      width = 0;
      return;
    }
    const g = fontData[ch];
    if (!g) return;
    width += g.width + charSpacing;
    if (idx + 1 === chars.length) {
      lineWidths.push(width);
    }
  });
  const maxLineWidth = lineWidths.length ? Math.max(...lineWidths) : 0;
  return { lineWidths, maxLineWidth };
}

export function createTextPaths(inputText, fontData, opts) {
  const { alignment = "left", charSpacing = 0, lineHeight = 1 } = opts || {};
  const paths = [];

  const { lineWidths } = measureLineWidths(inputText, fontData, charSpacing);

  let originX = 0;
  let originY = 0;
  let lineIndex = 0;

  const characters = Array.from(inputText || "");

  const alignOffsetForLine = (i) => {
    if (alignment === "center") return -(lineWidths[i] || 0) / 2;
    if (alignment === "right") return -(lineWidths[i] || 0);
    return 0;
  };

  characters.forEach((character) => {
    if (character === "\n") {
      lineIndex += 1;
      originX = 0;
      const anyKey = Object.keys(fontData).find((k) => fontData[k] && fontData[k].height);
      const lineSize = anyKey ? fontData[anyKey].height : 24;
      originY += lineSize * lineHeight;
      return;
    }
    const glyph = fontData[character];
    if (!glyph) return;
    if (glyph.d) {
      const characterX = originX + alignOffsetForLine(lineIndex);
      const d = new SvgPath(glyph.d).translate(characterX, originY).rel().toString();
      paths.push({ d });
    }
    originX += glyph.width + charSpacing;
  });

  return paths;
}
