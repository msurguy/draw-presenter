import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import gsap from "gsap";

// ---------------------------------------------------------------------------
// SlideContext — one GSAP timeline per mounted slide.
//
// Components (Appear, HersheyText, SvgIcon…) register "entrances" during their
// layout effects. The provider builds a paused timeline: entries grouped by
// `step` (fragment builds), ordered by `order` inside a step. A gsap pause is
// inserted between steps; advancing a step just resumes the timeline.
//
// Late registrations (e.g. HersheyText after its font fetch resolves) trigger
// a rebuild. Entries that already finished animating are marked `played` and
// are re-applied as static final states, so rebuilds never re-flash content.
// ---------------------------------------------------------------------------

const SlideContext = createContext(null);

export function useSlide() {
  const ctx = useContext(SlideContext);
  if (!ctx) {
    throw new Error("useSlide() must be used inside a slide (SlideProvider).");
  }
  return ctx;
}

/** Spacing between consecutive `order` groups within a step, seconds. */
const ORDER_INTERVAL = 0.15;

let entrySeq = 0;

export function SlideProvider({
  isActive,
  isPreview = false,
  hold = false, // true while a transition hides the incoming slide
  revealAll = false, // arriving via "prev": everything shown, no animation
  apiRef, // { current } — receives { nextStep, maxStep, revealedStep }
  children,
}) {
  const entriesRef = useRef(new Map());
  const timelineRef = useRef(null);
  const revealedStepRef = useRef(revealAll ? Infinity : 0);
  const buildScheduledRef = useRef(false);
  const holdRef = useRef(hold);
  holdRef.current = hold;
  const activeRef = useRef(isActive);
  activeRef.current = isActive;
  const revealAllRef = useRef(revealAll);
  revealAllRef.current = revealAll;

  const build = () => {
    buildScheduledRef.current = false;
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
    const entries = [...entriesRef.current.values()]
      .map((e) => ({ ...e, resolved: resolveTargets(e) }))
      .filter((e) => e.custom || (e.resolved && e.resolved.length > 0));
    if (!entries.length) return;

    const tl = gsap.timeline({ paused: true });
    timelineRef.current = tl;

    const steps = [...new Set(entries.map((e) => e.step))].sort((a, b) => a - b);
    const revealed = revealAllRef.current ? Infinity : revealedStepRef.current;

    for (const step of steps) {
      if (step > revealed) tl.addPause();
      const label = `step-${step}`;
      tl.addLabel(label);
      const group = entries
        .filter((e) => e.step === step)
        .sort((a, b) => a.order - b.order || a.seq - b.seq);
      const orders = [...new Set(group.map((e) => e.order))].sort((a, b) => a - b);
      for (const entry of group) {
        const orderIdx = orders.indexOf(entry.order);
        const at = `${label}+=${(orderIdx * ORDER_INTERVAL + (entry.delay || 0)).toFixed(3)}`;
        if (entry.played || revealAllRef.current || isPreviewStatic(entry)) {
          applyFinal(entry);
          continue;
        }
        addTween(tl, entry, at, () => {
          entry.played = true;
          const live = entriesRef.current.get(entry.id);
          if (live) live.played = true;
        });
      }
    }

    if (revealAllRef.current) {
      // Everything already applied as final state; nothing to play.
      return;
    }
    if (activeRef.current && !holdRef.current) tl.play();
  };

  const isPreviewStatic = () => isPreview;

  const scheduleBuild = () => {
    if (buildScheduledRef.current) return;
    buildScheduledRef.current = true;
    queueMicrotask(() => {
      if (buildScheduledRef.current) build();
    });
  };

  const ctx = useMemo(() => {
    const register = (config) => {
      const id = ++entrySeq;
      const entry = {
        id,
        seq: id,
        step: config.step ?? 0,
        order: config.order ?? 0,
        delay: config.delay ?? 0,
        duration: config.duration ?? 0.6,
        stagger: config.stagger ?? 0,
        ease: config.ease || "power3.out",
        from: config.from || null,
        to: config.to || null,
        targets: config.targets, // element | element[] | () => elements
        custom: config.custom || null, // (tl, targets, at, entry) => void
        final: config.final || null, // gsap.set() vars for the final state
        finalize: config.finalize || null, // imperative final-state fn (previews/revealAll)
        played: false,
      };
      entriesRef.current.set(id, entry);
      // Hide before first paint so nothing flashes while the timeline builds.
      const targets = resolveTargets(entry);
      if (targets && targets.length && entry.from && !revealAllRef.current && !isPreview) {
        gsap.set(targets, entry.from);
      }
      scheduleBuild();
      return () => {
        entriesRef.current.delete(id);
        scheduleBuild();
      };
    };
    return {
      isActive,
      isPreview,
      register,
      requestRebuild: scheduleBuild,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isPreview]);

  // Initial build — parent layout effect runs after all children registered.
  useLayoutEffect(() => {
    build();
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Release the hold once the transition reveals this slide.
  useEffect(() => {
    if (isActive && !hold && timelineRef.current && !revealAllRef.current) {
      timelineRef.current.play();
    }
  }, [isActive, hold]);

  // Expose step navigation to the Deck.
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      maxStep: () => {
        let max = 0;
        for (const e of entriesRef.current.values()) max = Math.max(max, e.step);
        return max;
      },
      revealedStep: () => revealedStepRef.current,
      nextStep: () => {
        let max = 0;
        for (const e of entriesRef.current.values()) max = Math.max(max, e.step);
        if (revealedStepRef.current >= max) return false;
        revealedStepRef.current += 1;
        const tl = timelineRef.current;
        if (tl) {
          // A press that lands while the previous step is still animating
          // must not be swallowed: the timeline would just run into the pause
          // it was already heading for, and the reveal counter would drift
          // ahead of what is on stage (the last press then tries to leave the
          // slide). Finish the in-flight step instantly — jump to the new
          // step's label — and play on from there, Keynote-style.
          const at = tl.labels[`step-${revealedStepRef.current}`];
          if (at != null && tl.isActive() && tl.time() < at) {
            for (const e of entriesRef.current.values()) {
              if (e.step < revealedStepRef.current) e.played = true;
            }
            tl.seek(at);
          }
          tl.play();
        }
        return true;
      },
      // Editor step scrubber: jump to the end of step k (static), or replay k.
      showStep: (k, { animate = false } = {}) => {
        revealedStepRef.current = k;
        for (const e of entriesRef.current.values()) e.played = false;
        build();
        const tl = timelineRef.current;
        if (!tl) return;
        if (animate) {
          const from = tl.labels[`step-${k}`];
          tl.pause();
          tl.seek(from != null ? from : 0, true);
          tl.play();
        } else {
          const next = tl.labels[`step-${k + 1}`];
          tl.pause(next != null ? next : tl.duration(), true);
        }
      },
    };
    return () => {
      if (apiRef.current) apiRef.current = null;
    };
  }, [apiRef]);

  return <SlideContext.Provider value={ctx}>{children}</SlideContext.Provider>;
}

// ------------------------------------------------------------------ helpers

function resolveTargets(entry) {
  let t = entry.targets;
  if (typeof t === "function") t = t();
  if (!t) return null;
  if (t instanceof Element) return [t];
  const arr = Array.from(t).filter(Boolean);
  return arr;
}

function applyFinal(entry) {
  if (entry.finalize) {
    try {
      entry.finalize();
    } catch (err) {
      console.warn("[deck] entrance finalize() failed:", err);
    }
  }
  const targets = entry.resolved || resolveTargets(entry);
  if (!targets || !targets.length) return;
  if (entry.final) {
    gsap.set(targets, entry.final);
  } else if (entry.to) {
    gsap.set(targets, { ...stripTweenVars(entry.to) });
  }
}

function stripTweenVars(vars) {
  const { duration, delay, ease, stagger, onComplete, ...rest } = vars;
  return rest;
}

function addTween(tl, entry, at, onDone) {
  const targets = entry.resolved || resolveTargets(entry);
  if (entry.custom) {
    entry.custom(tl, targets, at, entry);
    // Mark played at the end of the custom segment.
    tl.call(onDone, null, ">");
    return;
  }
  if (!targets || !targets.length) return;
  const vars = {
    ...(entry.to || {}),
    duration: entry.duration,
    ease: entry.ease,
    onComplete: onDone,
  };
  if (entry.stagger) vars.stagger = entry.stagger;
  if (entry.from) {
    tl.fromTo(targets, entry.from, vars, at);
  } else {
    tl.to(targets, vars, at);
  }
}
