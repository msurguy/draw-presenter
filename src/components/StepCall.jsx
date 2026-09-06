import { useLayoutEffect, useRef } from "react";
import { useSlide } from "../deck/SlideContext.jsx";

// Runs a callback at a build step — the imperative sibling of <Appear> for
// things that are not DOM (a ThreeScene mode, a shader uniform…).
//
//   <StepCall step={1} on={(how) => scene.setMode("text")} />
//
// `on(how)` gets "play" when the step is reached live on the slide timeline
// and "final" when the step is shown statically (arriving via ←, thumbnails,
// the editor scrubber) — skip tweens in that case and jump to the end state.
// Renders nothing.
export default function StepCall({ step = 1, order = 0, delay = 0, on }) {
  const { register } = useSlide();
  const onRef = useRef(on);
  onRef.current = on;

  useLayoutEffect(() => {
    return register({
      step,
      order,
      delay,
      duration: 0,
      targets: [],
      // A bare tl.call() placed exactly on the step label fires while the
      // timeline parks at the pause before it; a tiny tween's onComplete only
      // runs once the playhead actually moves into the step.
      custom: (tl, _targets, at) =>
        tl.to({}, { duration: 0.05, onComplete: () => onRef.current?.("play") }, at),
      finalize: () => onRef.current?.("final"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, order, delay]);

  return null;
}
