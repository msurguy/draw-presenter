import React, { useEffect, useState, lazy, Suspense } from "react";
import Deck from "./deck/Deck.jsx";

// Admin + editor are dev-only: behind dynamic imports so they are tree-shaken
// from the production bundle entirely.
const Admin = import.meta.env.DEV ? lazy(() => import("./admin/Admin.jsx")) : null;
const Editor = import.meta.env.DEV ? lazy(() => import("./editor/Editor.jsx")) : null;

function parseHash() {
  const hash = window.location.hash || "#/";
  const edit = hash.match(/^#\/admin\/edit\/([\w-]+)/);
  if (edit) return { route: "editor", slideId: edit[1] };
  if (hash.startsWith("#/admin")) return { route: "admin" };
  const m = hash.match(/^#\/slide\/(\d+)/);
  return { route: "deck", slide: m ? parseInt(m[1], 10) : 0 };
}

export default function App() {
  const [loc, setLoc] = useState(parseHash);

  useEffect(() => {
    const onHash = () => setLoc(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (loc.route === "editor" && Editor) {
    return (
      <Suspense fallback={<div className="admin-loading">Loading editor…</div>}>
        <Editor slideId={loc.slideId} key={loc.slideId} />
      </Suspense>
    );
  }
  if (loc.route === "admin" && Admin) {
    return (
      <Suspense fallback={<div className="admin-loading">Loading admin…</div>}>
        <Admin />
      </Suspense>
    );
  }
  return <Deck initialIndex={loc.slide || 0} />;
}
