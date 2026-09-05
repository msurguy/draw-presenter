import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Stage from "./Stage.jsx";
import SlideHost from "./SlideHost.jsx";
import { loadSlides } from "./loadSlides.js";
import { useKeyboard } from "./useKeyboard.js";

export default function Deck({ initialIndex = 0 }) {
  const slides = useMemo(() => loadSlides(), []);
  const stageRef = useRef(null);
  const stepApiRef = useRef(null); // filled by the active SlideProvider
  const hostRef = useRef(null); // { finishTransition }

  const clamp = (i) => Math.max(0, Math.min(slides.length - 1, i));
  const [nav, setNav] = useState(() => ({
    index: clamp(initialIndex),
    prevIndex: null,
    revealAll: false,
    token: 0, // bumps on every navigation so SlideHost can restart cleanly
  }));
  const navRef = useRef(nav);
  navRef.current = nav;

  // Navigate to `index`. Snapping a mid-flight transition calls setState in
  // SlideHost, so it must happen outside the setNav updater (React forbids
  // updating another component while rendering this one).
  const navigate = useCallback((index, revealAll) => {
    const cur = navRef.current;
    if (index === cur.index) return;
    hostRef.current?.finishTransition();
    window.history.replaceState(null, "", `#/slide/${index}`);
    const nextNav = { index, prevIndex: cur.index, revealAll, token: cur.token + 1 };
    navRef.current = nextNav;
    setNav(nextNav);
  }, []);

  const go = useCallback(
    (target, { revealAll = false } = {}) => navigate(clamp(target), revealAll),
    [slides.length, navigate], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const next = useCallback(() => {
    if (stepApiRef.current?.nextStep()) return; // advanced a build step
    const cur = navRef.current;
    if (cur.index >= slides.length - 1) return;
    navigate(cur.index + 1, false);
  }, [slides.length, navigate]);

  const prev = useCallback(() => {
    const cur = navRef.current;
    if (cur.index <= 0) return;
    // Going backwards shows the slide fully built, instantly.
    navigate(cur.index - 1, true);
  }, [navigate]);

  // Follow externally-set hashes (typed URL, admin links). Deck's own
  // navigation uses replaceState, which doesn't re-trigger this.
  useEffect(() => {
    go(initialIndex, { revealAll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIndex]);

  useKeyboard({
    next,
    prev,
    first: () => go(0, { revealAll: false }),
    last: () => go(slides.length - 1, { revealAll: true }),
    jumpTo: (i) => go(i, { revealAll: false }),
    fullscreenEl: () => stageRef.current?.closest(".stage-viewport"),
  });

  if (!slides.length) {
    return (
      <Stage stageRef={stageRef}>
        <div className="deck-error">No slides found in src/slides/</div>
      </Stage>
    );
  }

  return (
    <Stage stageRef={stageRef}>
      <SlideHost
        ref={hostRef}
        slides={slides}
        index={nav.index}
        prevIndex={nav.prevIndex}
        revealAll={nav.revealAll}
        token={nav.token}
        stepApiRef={stepApiRef}
        stageRef={stageRef}
      />
    </Stage>
  );
}
