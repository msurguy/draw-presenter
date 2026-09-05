// Canonical JSX snippets for the "add element" palette. Each builder returns
// { jsx, imports, size } — `size` is a rough footprint so the element lands
// centered on the stage. Snippets follow the slide-author skill idioms
// (absolute px on the Appear wrapper / positioned div, never on its child).

const px = (n) => Math.round(n);

export const PALETTE = [
  { kind: "hershey", label: "Hershey text", icon: "Aa", hint: "single-stroke drawn heading" },
  { kind: "text", label: "Text block", icon: "¶", hint: "regular HTML paragraph" },
  { kind: "image", label: "Image", icon: "▣", hint: "from public/assets/images", needsAsset: "image" },
  { kind: "icon", label: "Icon", icon: "✎", hint: "line-art SVG that draws itself", needsAsset: "svg" },
  { kind: "video", label: "Video", icon: "▶", hint: "inset video card", needsAsset: "video" },
  { kind: "brushtext", label: "Brush text", icon: "𝒜", hint: "text painted by a brush" },
  { kind: "diagram", label: "Diagram", icon: "⬡", hint: "mermaid flowchart, blocks revealed step by step" },
  { kind: "annotate", label: "Annotate", icon: "◯", hint: "brush stroke around the selection", needsSelection: true },
];

export function snippetFor(kind, { x, y, order = 0, assetKey = null, assetPath = null } = {}) {
  switch (kind) {
    case "hershey": {
      const size = { w: 900, h: 140 };
      return {
        size,
        imports: ["HersheyText"],
        jsx: `<div style={{ position: "absolute", left: ${px(x)}, top: ${px(y)} }}>
  <HersheyText font="HersheySans1" size={96} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1.4} order={${order}}>
    New heading
  </HersheyText>
</div>`,
      };
    }
    case "text": {
      const size = { w: 700, h: 90 };
      return {
        size,
        imports: ["Appear"],
        jsx: `<Appear effect="fade-up" order={${order}} style={{ position: "absolute", left: ${px(x)}, top: ${px(y)}, maxWidth: 700 }}>
  <p style={{ fontSize: 30, lineHeight: 1.5, color: "var(--muted)" }}>
    New text
  </p>
</Appear>`,
      };
    }
    case "image": {
      const size = { w: 480, h: 320 };
      const src = assetKey ? `{assets.${assetKey}}` : `"${assetPath || "/assets/images/plotter.svg"}"`;
      return {
        size,
        imports: ["Appear", "Img"],
        jsx: `<Appear effect="fade-up" order={${order}} style={{ position: "absolute", left: ${px(x)}, top: ${px(y)} }}>
  <Img src=${src} width={480} />
</Appear>`,
      };
    }
    case "icon": {
      const size = { w: 130, h: 130 };
      return {
        size,
        imports: ["SvgIcon"],
        jsx: `<SvgIcon src="${assetPath || "/assets/icons/bolt.svg"}" size={130} draw drawDuration={0.9} order={${order}} x={${px(x)}} y={${px(y)}} />`,
      };
    }
    case "video": {
      const size = { w: 560, h: 315 };
      const src = assetKey ? `{assets.${assetKey}}` : `"${assetPath || "/assets/video/gradient-loop.mp4"}"`;
      return {
        size,
        imports: ["Appear", "VideoLayer"],
        jsx: `<Appear
  effect="fade"
  order={${order}}
  style={{
    position: "absolute",
    left: ${px(x)},
    top: ${px(y)},
    width: 560,
    height: 315,
    borderRadius: 12,
    overflow: "hidden",
  }}
>
  <VideoLayer src=${src} fit="cover" />
</Appear>`,
      };
    }
    case "brushtext": {
      const size = { w: 900, h: 220 };
      return {
        size,
        imports: ["BrushText"],
        jsx: `<div style={{ position: "absolute", left: ${px(x)}, top: ${px(y)} }}>
  <BrushText font="HersheyScript1" size={160} align="left" brush={{ name: "marker", color: "#ffcc33", weight: 0.5 }} duration={2.5} order={${order}}>
    Painted
  </BrushText>
</div>`,
      };
    }
    case "diagram": {
      const size = { w: 1200, h: 480 };
      return {
        size,
        imports: ["Mermaid"],
        jsx: `<Mermaid
  chart={"flowchart LR\\n  A[Idea] --> B[Sketch]\\n  B --> C[Prototype]\\n  C --> D[Ship]"}
  reveal="steps"
  step={1}
  style={{ position: "absolute", left: ${px(x)}, top: ${px(y)}, width: 1200, height: 480 }}
/>`,
      };
    }
    default:
      throw new Error(`unknown palette kind ${kind}`);
  }
}

export function annotateWrapper({ order = 0, type = "underline" } = {}) {
  return {
    wrapperName: "BrushReveal",
    wrapperOpen: `<BrushReveal type="${type}" brush={{ name: "marker", color: "#ffcc33", weight: 1.6 }} duration={1} order={${order}} as="div">`,
  };
}

export function appearWrapper({ order = 0 } = {}) {
  return {
    wrapperName: "Appear",
    wrapperOpen: `<Appear effect="fade-up" order={${order}}>`,
  };
}
