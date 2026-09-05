import React from "react";

const shortLabel = (node) => {
  const p = (n) => node.props.find((x) => x.name === n);
  if (node.text?.value) return node.text.value.slice(0, 40);
  if (p("src")) return String(p("src").raw || p("src").value).replace(/^.*\//, "");
  if (p("effect")) return p("effect").value;
  if (p("type")) return p("type").value;
  return "";
};

const animBadge = (node) => {
  const step = node.props.find((x) => x.name === "step");
  const order = node.props.find((x) => x.name === "order");
  if (!step && !order) return "";
  return `s${step?.value ?? 0}·o${order?.value ?? 0}`;
};

export default function Layers({ root, selectedLoc, hoverLoc, onSelect, onHover }) {
  if (!root) return <div className="ed-empty">No JSX root found in this slide.</div>;
  const rows = [];
  const walk = (node, depth) => {
    rows.push(
      <div
        key={node.loc}
        className={[
          "ed-layer",
          node.loc === selectedLoc && "selected",
          node.loc === hoverLoc && "hover",
          node.conditional && "absent",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={() => onSelect(node.loc)}
        onMouseEnter={() => onHover(node.loc)}
        onMouseLeave={() => onHover(null)}
        title={`${node.name} @ ${node.loc}`}
      >
        <span className={`name${node.kind === "host" ? " host" : ""}`}>{node.name}</span>
        {node.repeated && <span className="rep" title="generated in a loop">⟳</span>}
        <span className="label">{shortLabel(node)}</span>
        <span className="badge">{animBadge(node)}</span>
      </div>,
    );
    node.children.forEach((c) => walk(c, depth + 1));
  };
  walk(root, 0);
  return <div className="ed-layers">{rows}</div>;
}
