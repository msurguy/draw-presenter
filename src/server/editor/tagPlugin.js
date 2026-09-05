import MagicString from "magic-string";
import { parseSlide, walkJsx } from "./slideAst.js";

// Dev-only Vite plugin: stamps every JSX element in src/slides/*.jsx with
// `data-loc="line:col"` (Babel loc.start of the opening `<`). The editor maps
// clicked DOM nodes back to source through this attribute. Runs as a `pre`
// plugin so it sees raw JSX before Vite's oxc transform; never part of builds.
const SLIDE_RE = /\/src\/slides\/[^/]+\.jsx(\?.*)?$/;

export function slideLocTagPlugin() {
  return {
    name: "slide-loc-tag",
    enforce: "pre",
    apply: "serve",
    transform: {
      filter: { id: SLIDE_RE },
      handler(code, id) {
        if (!SLIDE_RE.test(id)) return null;
        let ast;
        try {
          ast = parseSlide(code);
        } catch {
          return null; // let the real transform report the syntax error
        }
        const s = new MagicString(code);
        walkJsx(ast, (el) => {
          const oe = el.openingElement;
          const tagged = oe.attributes.some(
            (a) => a.type === "JSXAttribute" && a.name.type === "JSXIdentifier" && a.name.name === "data-loc",
          );
          if (tagged) return;
          const { line, column } = oe.loc.start;
          s.appendLeft(oe.name.end, ` data-loc="${line}:${column}"`);
        });
        return {
          code: s.toString(),
          map: s.generateMap({ hires: true, source: id, includeContent: true }),
        };
      },
    },
  };
}
