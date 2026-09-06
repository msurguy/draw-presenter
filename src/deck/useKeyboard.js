import { useEffect, useRef } from "react";

// Keyboard navigation:
//   → / Space / PageDown   next (advances builds, then slides)
//   ← / PageUp             previous slide (fully built)
//   Home / End             first / last slide
//   F                      fullscreen
//   1–9 digits + Enter     jump to slide N (1-based)
//   A                      admin panel (dev only)
// `onInput` (optional) fires on every navigation key so the hint can dismiss.
export function useKeyboard({ next, prev, first, last, jumpTo, fullscreenEl, onInput }) {
  const bufferRef = useRef("");
  const handlers = useRef({});
  handlers.current = { next, prev, first, last, jumpTo, fullscreenEl, onInput };

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const h = handlers.current;
      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          e.preventDefault();
          h.onInput?.();
          h.next();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          h.onInput?.();
          h.prev();
          break;
        case "Home":
          h.first();
          break;
        case "End":
          h.last();
          break;
        case "f":
        case "F": {
          const el = h.fullscreenEl?.() || document.documentElement;
          if (document.fullscreenElement) document.exitFullscreen();
          else el.requestFullscreen?.();
          break;
        }
        case "a":
        case "A":
          if (import.meta.env.DEV) window.location.hash = "#/admin";
          break;
        case "Enter": {
          const buf = bufferRef.current;
          bufferRef.current = "";
          if (buf) h.jumpTo(parseInt(buf, 10) - 1);
          break;
        }
        default:
          if (/^[0-9]$/.test(e.key)) {
            bufferRef.current = (bufferRef.current + e.key).slice(-3);
          } else {
            bufferRef.current = "";
          }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
