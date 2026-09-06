import React, { useLayoutEffect, useRef } from "react";

export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

// Fixed 1920×1080 design surface, scaled uniformly to fit the viewport and
// centered (letterboxed on --bg-darker). Slides author in absolute pixels.
//
// Sizing follows the *visual* viewport where available: on mobile browsers
// window.innerHeight includes the area under a collapsing address bar, so the
// stage would jump in size mid-swipe. `viewportRef` exposes the outer element
// for pointer navigation, fullscreen and overlays.
// `overlay` renders inside the viewport but outside the scaled stage, so
// position: fixed chrome (hints, buttons) isn't caught by the transform.
export default function Stage({ stageRef, viewportRef, overlay, children }) {
  const innerRef = useRef(null);
  const ref = stageRef || innerRef;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const vv = window.visualViewport;
    const fit = () => {
      const vw = vv?.width || window.innerWidth;
      const vh = vv?.height || window.innerHeight;
      const scale = Math.min(vw / STAGE_WIDTH, vh / STAGE_HEIGHT);
      el.style.transform = `translate(-50%, -50%) scale(${scale}) `;
      el.style.transformOrigin = "center";
      el.style.top = "50%";
      el.style.left = "50%";
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    vv?.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
      vv?.removeEventListener("resize", fit);
    };
  }, [ref]);

  return (
    <div className="stage-viewport" ref={viewportRef}>
      <div className="stage" ref={ref}>
        {children}
      </div>
      {overlay}
    </div>
  );
}
