import { animate as m, createTimeline as c } from "animejs";
import { b as d, s as p } from "./builtin-CM6GH1gP.js";
const f = {
  power1: "Quad",
  power2: "Cubic",
  power3: "Quart",
  power4: "Quint",
  sine: "Sine",
  expo: "Expo",
  circ: "Circ",
  back: "Back",
  elastic: "Elastic",
  bounce: "Bounce"
}, u = /* @__PURE__ */ new Set();
let h = !1;
function w(n) {
  if (n === void 0 || typeof n == "function") return n;
  const { family: e, dir: t } = p(n);
  if (e === "linear" || e === "none") return "linear";
  const r = f[e];
  return r ? t + r : (u.has(n) || (u.add(n), console.warn(
    `brushmark: unknown ease "${n}" on the anime engine, using "outCubic".`
  )), "outCubic");
}
function l(n) {
  const { duration: e, delay: t, ease: r, ...i } = n, s = {
    ...i,
    duration: (typeof e == "number" ? e : 0.5) * 1e3
  };
  typeof t == "number" && (s.delay = t * 1e3);
  const a = w(r);
  return a !== void 0 && (s.ease = a), s;
}
function y(n) {
  const { paused: e, repeat: t, yoyo: r, scrollTrigger: i, ...s } = n;
  i && !h && (h = !0, console.warn(
    'brushmark: timelineVars.scrollTrigger requires the gsap engine (import { gsapEngine } from "brushmark/gsap") — ignored by the anime engine.'
  ));
  const a = { ...s, autoplay: !e };
  return typeof t == "number" && t !== 0 && (a.loop = t < 0 ? !0 : t), r && (a.alternate = !0), a;
}
class o {
  constructor(e) {
    this.lastEnd = 0, this.params = y(e), this.raw = c(this.params);
  }
  /** One cycle in seconds (anime durations include repeats; iteration doesn't). */
  cycleSec() {
    return this.raw.iterationDuration / 1e3;
  }
  resolvePosition(e) {
    if (typeof e == "number") return Math.max(0, e);
    if (e === void 0) return this.cycleSec();
    if (e === ">") return this.lastEnd;
    const t = /^>([+-]?\d*\.?\d+)$/.exec(e);
    if (t) return Math.max(0, this.lastEnd + parseFloat(t[1]));
    const r = /^([+-])=(\d*\.?\d+)$/.exec(e);
    if (r) {
      const i = parseFloat(r[2]);
      return Math.max(0, this.cycleSec() + (r[1] === "-" ? -i : i));
    }
    return console.warn(
      `brushmark: unsupported timeline position "${e}" on the anime engine, appending at the end.`
    ), this.cycleSec();
  }
  /** Seek to a visual (forward-space) time in seconds. */
  seekVisual(e) {
    const t = e * 1e3;
    this.raw.seek(this.raw.reversed ? this.raw.duration - t : t);
  }
  to(e, t, r) {
    const i = this.resolvePosition(r), s = l(t);
    return this.raw.add(e, s, i * 1e3), this.lastEnd = i + s.duration / 1e3, this;
  }
  call(e, t, r) {
    const i = this.resolvePosition(r);
    return this.raw.call(() => e(...t ?? []), i * 1e3), this.lastEnd = i, this;
  }
  add(e, t) {
    if (!(e instanceof o))
      return console.warn(
        "brushmark: the anime engine can only nest anime-engine timelines — add() ignored."
      ), this;
    const r = this.resolvePosition(t);
    return this.raw.sync(e.raw, r * 1e3), this.lastEnd = r + e.raw.duration / 1e3, this;
  }
  clear() {
    return this.raw.cancel(), this.raw = c(this.params), this.lastEnd = 0, this;
  }
  duration() {
    return this.cycleSec();
  }
  play(e) {
    return this.raw.play(), typeof e == "number" && this.raw.seek(e * 1e3), this;
  }
  pause(e) {
    return typeof e == "number" && this.seekVisual(e), this.raw.pause(), this;
  }
  paused(e) {
    return e === void 0 ? this.raw.paused : (e && this.raw.pause(), this);
  }
  progress(e) {
    return e === void 0 ? this.raw.iterationProgress : (this.seekVisual(e * this.cycleSec()), this);
  }
  reverse() {
    return this.raw.reverse(), this;
  }
  restart() {
    return this.raw.restart(), this;
  }
  kill() {
    return this.raw.pause(), this.raw.cancel(), this;
  }
  then(e) {
    const t = this.raw.then();
    return e ? t.then(e) : t;
  }
}
const E = {
  name: "anime",
  createTimeline(n) {
    return new o(n ?? {});
  },
  to(n, e) {
    const t = m(n, l(e));
    return { kill: () => t.cancel() };
  },
  // Frame callbacks (repaint flush, reverse polling) ride the shared rAF
  // ticker — no coupling to anime's internal engine loop needed.
  ticker: d
};
export {
  E as animeEngine
};
