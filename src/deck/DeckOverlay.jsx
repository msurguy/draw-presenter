import React, { useEffect, useState } from "react";

// Viewer chrome that sits above the stage:
//   • a one-time navigation hint — keyboard text on pointer devices (fades
//     after HINT_DESKTOP_MS), tap/swipe text on touch devices (fades on the
//     first gesture or after HINT_TOUCH_MS)
//   • a "rotate your phone" notice in portrait on touch devices
//   • a fullscreen button on touch devices (also asks for landscape lock)
// `inputCount` bumps on every navigation gesture so the hint can dismiss.
const HINT_DESKTOP_MS = 3000;
const HINT_TOUCH_MS = 8000;

const mq = (q) => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(q) : null);

function useMedia(query) {
  const [match, setMatch] = useState(() => !!mq(query)?.matches);
  useEffect(() => {
    const m = mq(query);
    if (!m) return;
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return match;
}

export default function DeckOverlay({ inputCount, viewportRef }) {
  const coarse = useMedia("(pointer: coarse)");
  const portrait = useMedia("(orientation: portrait)");
  const [hintVisible, setHintVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(() => !!document.fullscreenElement);

  // Time out the hint. Touch users also dismiss it with their first gesture.
  useEffect(() => {
    const t = setTimeout(() => setHintVisible(false), coarse ? HINT_TOUCH_MS : HINT_DESKTOP_MS);
    return () => clearTimeout(t);
  }, [coarse]);
  useEffect(() => {
    if (inputCount > 0) setHintVisible(false);
  }, [inputCount]);

  useEffect(() => {
    const on = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const toggleFullscreen = async () => {
    const el = viewportRef.current || document.documentElement;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen?.();
        await screen.orientation?.lock?.("landscape").catch(() => {});
      }
    } catch {
      /* iPhone Safari has no element fullscreen; the button is harmless there */
    }
  };

  return (
    <>
      <div className={`deck-hint${hintVisible ? "" : " is-hidden"}`} aria-hidden={!hintVisible}>
        {coarse ? (
          <>
            <b>Tap</b> or <b>swipe</b> to continue · tap the left edge to go back
          </>
        ) : (
          <>
            <kbd>→</kbd> <kbd>Space</kbd> next · <kbd>←</kbd> back · <kbd>F</kbd> fullscreen
          </>
        )}
      </div>

      {coarse && portrait && !fullscreen && (
        <div className="deck-rotate" data-no-nav>
          <svg className="deck-rotate-icon" viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">
            <rect x="19" y="6" width="26" height="52" rx="5" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <line x1="28" y1="51" x2="36" y2="51" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <p>This deck is widescreen. Rotate your phone to landscape.</p>
          <button type="button" className="deck-btn" onClick={toggleFullscreen}>
            Go fullscreen
          </button>
        </div>
      )}

      {coarse && (
        <button
          type="button"
          className="deck-fs-btn"
          data-no-nav
          onClick={toggleFullscreen}
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {fullscreen ? "⤡" : "⤢"}
        </button>
      )}
    </>
  );
}
