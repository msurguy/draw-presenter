import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { adminApiPlugin } from "./src/server/adminApiPlugin.js";
import { slideLocTagPlugin } from "./src/server/editor/tagPlugin.js";

export default defineConfig({
  // Sub-path hosting (GitHub Pages): BASE_PATH=/draw-presenter/ npm run build.
  // Runtime asset paths go through src/deck/publicUrl.js to honor this.
  base: process.env.BASE_PATH || "/",
  // slideLocTagPlugin must run before react() so it sees raw JSX (dev only).
  plugins: [slideLocTagPlugin(), react(), adminApiPlugin()],
  // mermaid is loaded lazily by <Mermaid>; pre-bundle it so the first diagram
  // slide doesn't trigger a "new dependencies optimized" reload mid-session.
  optimizeDeps: { include: ["mermaid"] },
});
