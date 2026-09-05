import React, { useLayoutEffect, useRef } from "react";

export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

// Fixed 1920×1080 design surface, scaled uniformly to fit the viewport and
// centered (letterboxed on --bg-darker). Slides author in absolute pixels.
export default function Stage({ stageRef, children }) {
  const innerRef = useRef(null);
  const ref = stageRef || innerRef;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(vw / STAGE_WIDTH, vh / STAGE_HEIGHT);
      el.style.transform = `translate(-50%, -50%) scale(${scale}) `;
      el.style.transformOrigin = "center";
      el.style.top = "50%";
      el.style.left = "50%";
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [ref]);

  return (
    <div className="stage-viewport">
      <div className="stage" ref={ref}>
        {children}
      </div>
    </div>
  );
}
