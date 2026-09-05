import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for the vendored p5.brush standalone source (run from the
// brushmark root via `npm run test:p5brush`).
export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  test: {
    environment: "node",
    include: ["test/unit/**/*.test.js"],
  },
});
