import React, {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { SlideProvider } from "./SlideContext.jsx";
import { resolveTransition } from "../transitions/registry.js";

// Renders the current slide, and during a transition also the outgoing slide.
// Slide subtrees are keyed by slide id so the outgoing slide's React tree (and
// its frozen visual state) survives the index change.
//
// Transition semantics (Keynote-style): a slide's `meta.transition` is its
// EXIT. Moving forward N→N+1 plays slide N's transition with the incoming
// slide layered on top. Moving back N+1→N plays slide N's transition in
// reverse: the slide being left stays on top and un-enters, revealing N.
//
// Transition lifecycle is tracked with the navigation `token`:
//   token !== doneToken     → a transition is in flight (outgoing stays mounted)
//   token !== revealedToken → incoming slide holds its entrance timeline
const SlideHost = forwardRef(function SlideHost(
  { slides, index, prevIndex, revealAll, token, stepApiRef, stageRef },
  ref,
) {
  const [doneToken, setDoneToken] = useState(token);
  const [revealedToken, setRevealedToken] = useState(token);
  const layerRefs = useRef(new Map());
  const activeRunRef = useRef(null); // { finish }

  const current = slides[index];
  const outgoing = prevIndex != null && prevIndex !== index ? slides[prevIndex] : null;
  const backward = !!outgoing && prevIndex > index;
  const transitioning = !!outgoing && doneToken !== token;
  const hold = transitioning && revealedToken !== token;

  useImperativeHandle(ref, () => ({
    finishTransition() {
      activeRunRef.current?.finish();
    },
  }));

  useLayoutEffect(() => {
    if (!outgoing) {
      setDoneToken(token);
      setRevealedToken(token);
      return;
    }
    const outEl = layerRefs.current.get(outgoing.id);
    const inEl = layerRefs.current.get(current.id);
    if (!outEl || !inEl) {
      setDoneToken(token);
      setRevealedToken(token);
      return;
    }

    let done = false;
    const finishOnce = () => {
      if (done) return;
      done = true;
      activeRunRef.current = null;
      // Clear any transition-applied inline styles from the surviving layer.
      inEl.style.cssText = "";
      inEl.className = "slide-layer";
      inEl.style.background = current.meta.background || "var(--bg)";
      setRevealedToken(token);
      setDoneToken(token);
    };

    // Forward: the outgoing slide's exit, incoming layer on top. Backward: the
    // returned-to slide's exit, reversed, with the slide being left on top
    // (it plays the "incoming" role so the same tweens run backwards).
    const spec = (backward ? current : outgoing).meta.transition;
    const { run, kind } = resolveTransition(spec);
    const controller = run({
      outgoingEl: backward ? inEl : outEl,
      incomingEl: backward ? outEl : inEl,
      stageEl: stageRef.current,
      duration: spec.duration ?? 0.7,
      params: spec.params || {},
      reverse: backward,
      onRevealed: () => setRevealedToken(token),
      onComplete: finishOnce,
    });
    // reverse(0) seeks to the end without firing callbacks, then plays back.
    if (backward && controller?.reverse) controller.reverse(0);

    activeRunRef.current = {
      finish: () => {
        if (done) return;
        try {
          controller?.progress?.(backward ? 0 : 1);
        } catch (e) {
          console.warn(`[deck] transition "${kind}" failed to finish cleanly`, e);
        }
        finishOnce();
      },
    };

    return () => {
      if (!done) {
        controller?.kill?.();
        finishOnce();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const setLayerRef = (id) => (el) => {
    if (el) layerRefs.current.set(id, el);
    else layerRefs.current.delete(id);
  };

  const renderSlide = (slide, { isActive, isOutgoing }) => (
    <div
      key={slide.id}
      ref={setLayerRef(slide.id)}
      className="slide-layer"
      style={{ background: slide.meta.background || "var(--bg)" }}
    >
      <SlideErrorBoundary slideId={slide.id}>
        <SlideProvider
          isActive={isActive}
          hold={isActive ? hold : false}
          revealAll={isOutgoing ? true : revealAll}
          apiRef={isActive ? stepApiRef : null}
        >
          <div className="slide-root">
            <slide.Component assets={slide.assets} />
          </div>
        </SlideProvider>
      </SlideErrorBoundary>
    </div>
  );

  const outgoingLayer = outgoing && transitioning ? renderSlide(outgoing, { isActive: false, isOutgoing: true }) : null;
  const currentLayer = renderSlide(current, { isActive: true, isOutgoing: false });
  // The layer being animated ("incoming" role) must be on top: the incoming
  // slide when moving forward, the slide being left when moving back.
  return backward ? (
    <>
      {currentLayer}
      {outgoingLayer}
    </>
  ) : (
    <>
      {outgoingLayer}
      {currentLayer}
    </>
  );
});

export default SlideHost;

class SlideErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    console.error(`[deck] slide "${this.props.slideId}" crashed:`, error);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="deck-error">
          {`Slide "${this.props.slideId}" crashed:\n${this.state.error.message}`}
        </div>
      );
    }
    return this.props.children;
  }
}
