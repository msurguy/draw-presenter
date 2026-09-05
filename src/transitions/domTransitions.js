import gsap from "gsap";

// Pure DOM/GSAP transitions. Each returns a gsap timeline. `onRevealed` fires
// once the incoming slide is visually dominant (releases its entrances).

function base({ duration, onRevealed, onComplete }, buildFn) {
  const tl = gsap.timeline({ onComplete, onReverseComplete: onComplete });
  buildFn(tl);
  tl.call(onRevealed, null, Math.min(duration * 0.35, duration));
  return tl;
}

export const domTransitions = {
  none({ onRevealed, onComplete }) {
    onRevealed();
    onComplete();
    return null;
  },

  fade(args) {
    const { incomingEl, duration } = args;
    return base(args, (tl) => {
      tl.fromTo(incomingEl, { opacity: 0 }, { opacity: 1, duration, ease: "power2.inOut" }, 0);
    });
  },

  slide(args) {
    const { outgoingEl, incomingEl, duration, params } = args;
    const dir = params.direction || "left"; // incoming enters from this edge's opposite
    const axis = dir === "up" || dir === "down" ? "yPercent" : "xPercent";
    const sign = dir === "left" || dir === "up" ? 1 : -1;
    return base(args, (tl) => {
      tl.fromTo(
        incomingEl,
        { [axis]: 100 * sign },
        { [axis]: 0, duration, ease: "power3.inOut" },
        0,
      );
      tl.fromTo(
        outgoingEl,
        { [axis]: 0 },
        { [axis]: -35 * sign, duration, ease: "power3.inOut" },
        0,
      );
    });
  },

  wipe(args) {
    const { incomingEl, duration, params } = args;
    const dir = params.direction || "left";
    const from = {
      left: "inset(0 100% 0 0)",
      right: "inset(0 0 0 100%)",
      up: "inset(100% 0 0 0)",
      down: "inset(0 0 100% 0)",
    }[dir];
    return base(args, (tl) => {
      tl.fromTo(
        incomingEl,
        { clipPath: from },
        { clipPath: "inset(0% 0% 0% 0%)", duration, ease: "power2.inOut" },
        0,
      );
    });
  },

  zoom(args) {
    const { outgoingEl, incomingEl, duration } = args;
    return base(args, (tl) => {
      tl.fromTo(
        incomingEl,
        { opacity: 0, scale: 1.06 },
        { opacity: 1, scale: 1, duration, ease: "power2.out" },
        0,
      );
      tl.to(outgoingEl, { scale: 0.96, opacity: 0.6, duration, ease: "power2.in" }, 0);
    });
  },
};
