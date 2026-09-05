import { gsap as e } from "gsap";
const n = {
  name: "gsap",
  createTimeline(t) {
    return e.timeline(t);
  },
  to(t, r) {
    return e.to(t, r);
  },
  ticker: e.ticker
};
e.ticker;
export {
  n as gsapEngine
};
