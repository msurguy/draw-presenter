import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";

if (import.meta.env.DEV) {
  // Slide modules export a plain `meta` object next to the component. Fast
  // Refresh would otherwise treat that non-component export as incompatible
  // and fall back to a full page reload on every slide edit (the editor saves
  // constantly). Ignoring `meta` keeps body edits hot-swapped in place; meta
  // edits trigger an explicit full reload from the server. Templates carry an
  // extra `template` descriptor export with the same problem.
  window.__getReactRefreshIgnoredExports = ({ id }) =>
    /\/src\/(slides|templates)\/[^/]+\.jsx/.test(id) ? ["meta", "template"] : [];
}

createRoot(document.getElementById("root")).render(<App />);
