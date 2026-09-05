function _(e) {
  const t = e.replace(/\(.*\)$/, "").trim(), i = t.indexOf(".");
  if (i === -1) return { family: t, dir: "out" };
  const s = t.slice(i + 1);
  return {
    family: t.slice(0, i),
    dir: s === "in" || s === "inOut" ? s : "out"
  };
}
const T = 1.70158, w = 0.3, b = {
  linear: (e) => e,
  none: (e) => e,
  power1: (e) => e * e,
  power2: (e) => e * e * e,
  power3: (e) => e * e * e * e,
  power4: (e) => e * e * e * e * e,
  sine: (e) => 1 - Math.cos(e * Math.PI / 2),
  expo: (e) => e === 0 ? 0 : Math.pow(2, 10 * (e - 1)),
  circ: (e) => 1 - Math.sqrt(1 - e * e),
  back: (e) => e * e * ((T + 1) * e - T),
  elastic: (e) => e === 0 || e === 1 ? e : -Math.pow(2, 10 * (e - 1)) * Math.sin((e - 1 - w / 4) * (2 * Math.PI) / w),
  bounce: (e) => 1 - F(1 - e)
};
function F(e) {
  return e < 1 / 2.75 ? 7.5625 * e * e : e < 2 / 2.75 ? 7.5625 * (e -= 1.5 / 2.75) * e + 0.75 : e < 2.5 / 2.75 ? 7.5625 * (e -= 2.25 / 2.75) * e + 0.9375 : 7.5625 * (e -= 2.625 / 2.75) * e + 0.984375;
}
function x(e) {
  return (t) => 1 - e(1 - t);
}
function A(e) {
  return (t) => t < 0.5 ? e(t * 2) / 2 : 1 - e(2 - t * 2) / 2;
}
const M = x(b.power2), v = /* @__PURE__ */ new Set();
function I(e) {
  if (typeof e == "function") return e;
  if (e === void 0) return M;
  const { family: t, dir: i } = _(e), s = b[t];
  return s ? t === "linear" || t === "none" || i === "in" ? s : i === "inOut" ? A(s) : x(s) : (v.has(e) || (v.add(e), console.warn(
    `brushmark: unknown ease "${e}" on the built-in engine, using "power2.out". Known families: ${Object.keys(b).join(", ")}.`
  )), M);
}
const O = 100;
class S {
  constructor() {
    this.callbacks = /* @__PURE__ */ new Set(), this.rafId = null, this.last = 0, this.epoch = 0, this.tick = (t) => {
      const i = t - this.last;
      this.last = t;
      for (const s of [...this.callbacks]) s((t - this.epoch) / 1e3, i);
      this.rafId = this.callbacks.size ? requestAnimationFrame(this.tick) : null;
    };
  }
  add(t) {
    this.callbacks.add(t), this.rafId === null && typeof requestAnimationFrame < "u" && (this.last = performance.now(), this.epoch || (this.epoch = this.last), this.rafId = requestAnimationFrame(this.tick));
  }
  remove(t) {
    this.callbacks.delete(t);
  }
}
const g = new S(), P = /* @__PURE__ */ new Set(["duration", "delay", "repeat", "repeatDelay", "stagger"]), E = /* @__PURE__ */ new Set();
let D = !1;
function C(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e;
}
class k {
  constructor(t = {}) {
    this.items = [], this.lastEnd = 0, this.time = 0, this.reversed = !1, this.parent = null, this.killed = !1, this.ticking = !1, this.thenResolvers = [], this.tickCb = (i, s) => {
      this.advance(typeof s == "number" ? s : 16.7);
    }, this.vars = t, this.repeat = typeof t.repeat == "number" ? t.repeat : 0, this.yoyo = !!t.yoyo, this._paused = !!t.paused, t.scrollTrigger && !D && (D = !0, console.warn(
      'brushmark: timelineVars.scrollTrigger requires the gsap engine (import { gsapEngine } from "brushmark/gsap") — ignored by the built-in engine.'
    )), this._paused || this.ensureTicking();
  }
  // -- building ---------------------------------------------------------------
  to(t, i, s) {
    const n = typeof i.delay == "number" ? i.delay : 0, o = this.resolvePosition(s) + n, a = typeof i.duration == "number" ? i.duration : 0.5, l = t, d = [];
    for (const [u, f] of Object.entries(i))
      typeof f == "number" && !P.has(u) && d.push({ key: u, from: typeof l[u] == "number" ? l[u] : 0, to: f });
    return this.items.push({
      kind: "tween",
      start: o,
      duration: a,
      target: l,
      props: d,
      ease: I(i.ease),
      onUpdate: i.onUpdate,
      onComplete: i.onComplete,
      lastT: 0
    }), this.lastEnd = o + a, this;
  }
  call(t, i, s) {
    const n = this.resolvePosition(s);
    return this.items.push({ kind: "call", time: n, fn: () => t(...i ?? []) }), this.lastEnd = n, this;
  }
  add(t, i) {
    if (!(t instanceof k))
      return console.warn(
        "brushmark: the built-in engine can only nest built-in timelines — add() ignored."
      ), this;
    const s = this.resolvePosition(i);
    return t.parent = this, t.stopTicking(), this.items.push({ kind: "child", start: s, child: t }), this.lastEnd = s + t.totalDuration(), this;
  }
  clear() {
    return this.items = [], this.lastEnd = 0, this;
  }
  resolvePosition(t) {
    if (typeof t == "number") return Math.max(0, t);
    if (t === void 0) return this.cycleDuration();
    if (t === ">") return this.lastEnd;
    const i = /^>([+-]?\d*\.?\d+)$/.exec(t);
    if (i) return Math.max(0, this.lastEnd + parseFloat(i[1]));
    const s = /^([+-])=(\d*\.?\d+)$/.exec(t);
    if (s) {
      const n = parseFloat(s[2]);
      return Math.max(0, this.cycleDuration() + (s[1] === "-" ? -n : n));
    }
    return E.has(t) || (E.add(t), console.warn(
      `brushmark: unsupported timeline position "${t}" on the built-in engine, appending at the end.`
    )), this.cycleDuration();
  }
  // -- durations --------------------------------------------------------------
  duration() {
    return this.cycleDuration();
  }
  cycleDuration() {
    let t = 0;
    for (const i of this.items)
      i.kind === "tween" ? t = Math.max(t, i.start + i.duration) : i.kind === "call" ? t = Math.max(t, i.time) : t = Math.max(t, i.start + i.child.totalDuration());
    return t;
  }
  totalDuration() {
    const t = this.cycleDuration();
    return t <= 0 ? 0 : this.repeat < 0 ? 1 / 0 : t * (this.repeat + 1);
  }
  // -- sampling ---------------------------------------------------------------
  iterOf(t, i) {
    if (i <= 0) return 0;
    const s = this.repeat < 0 ? Number.MAX_SAFE_INTEGER : this.repeat;
    return Math.min(Math.max(Math.floor(t / i), 0), s);
  }
  /** Fold repeats/yoyo: absolute time → local time within one cycle. */
  fold(t, i) {
    if (i <= 0) return 0;
    const s = this.iterOf(t, i), n = t - s * i;
    return this.yoyo && s % 2 === 1 ? i - n : n;
  }
  /**
   * Render the state at unfolded time `now` (values depend only on `now`;
   * `prev` is used to detect crossings for call items and completions).
   * Seeks pass suppress=true: values and onUpdate still apply, but call
   * items and completion events don't fire (gsap suppressEvents parity).
   */
  renderAt(t, i, s) {
    var d, u, f, y;
    const n = this.cycleDuration(), o = this.fold(t, n), a = this.fold(i, n), l = this.iterOf(t, n) !== this.iterOf(i, n);
    for (const r of this.items)
      if (r.kind === "tween") {
        const h = r.duration <= 0 ? a >= r.start ? 1 : 0 : C((a - r.start) / r.duration);
        if (h !== r.lastT) {
          const p = r.lastT;
          r.lastT = h;
          const m = r.ease(h);
          for (const c of r.props) r.target[c.key] = c.from + (c.to - c.from) * m;
          (d = r.onUpdate) == null || d.call(r), !s && p < 1 && h >= 1 && ((u = r.onComplete) == null || u.call(r));
        }
      } else if (r.kind === "call") {
        if (s) continue;
        (l ? !0 : a >= o ? r.time > o && r.time <= a : r.time >= a && r.time < o) && r.fn();
      } else {
        const h = r.child.totalDuration(), p = Number.isFinite(h) ? h : 1 / 0, m = Math.min(Math.max(o - r.start, 0), p), c = Math.min(Math.max(a - r.start, 0), p);
        m !== c && (r.child.renderAt(m, c, s), !s && m < h && c >= h && r.child.completeForward());
      }
    i !== t && ((y = (f = this.vars).onUpdate) == null || y.call(f));
  }
  seekTo(t) {
    const i = this.totalDuration(), s = Math.min(Math.max(t, 0), Number.isFinite(i) ? i : t), n = this.time;
    this.time = s, this.renderAt(n, s, !0);
  }
  ensureTicking() {
    this.ticking || this.parent || this.killed || (this.ticking = !0, g.add(this.tickCb));
  }
  stopTicking() {
    this.ticking && (this.ticking = !1, g.remove(this.tickCb));
  }
  advance(t) {
    if (this.killed || this._paused || this.parent) {
      this.stopTicking();
      return;
    }
    const i = Math.min(Math.max(t, 0), O) / 1e3 * (this.reversed ? -1 : 1), s = this.totalDuration();
    let n = this.time + i, o = !1, a = !1;
    !this.reversed && n >= s ? (n = Number.isFinite(s) ? s : n, o = Number.isFinite(s)) : this.reversed && n <= 0 && (n = 0, a = !0);
    const l = this.time;
    this.time = n, this.renderAt(l, n, !1), o ? (this._paused = !0, this.stopTicking(), this.completeForward()) : a && (this._paused = !0, this.stopTicking());
  }
  completeForward() {
    var i, s;
    (s = (i = this.vars).onComplete) == null || s.call(i);
    const t = this.thenResolvers;
    this.thenResolvers = [];
    for (const n of t) n();
  }
  // -- playback control ---------------------------------------------------------
  play(t) {
    return this.killed ? this : (typeof t == "number" && this.seekTo(t), this.reversed = !1, this._paused = !1, this.ensureTicking(), this);
  }
  pause(t) {
    return typeof t == "number" && this.seekTo(t), this._paused = !0, this.stopTicking(), this;
  }
  paused(t) {
    return t === void 0 ? this._paused : (this._paused = t, t ? this.stopTicking() : this.ensureTicking(), this);
  }
  progress(t) {
    const i = this.cycleDuration();
    return t === void 0 ? i <= 0 ? 0 : this.fold(this.time, i) / i : (this.seekTo(t * i), this);
  }
  reverse() {
    return this.killed ? this : (this.reversed = !0, this._paused = !1, this.ensureTicking(), this);
  }
  restart() {
    return this.killed ? this : (this.seekTo(0), this.reversed = !1, this._paused = !1, this.ensureTicking(), this);
  }
  kill() {
    return this.killed = !0, this.stopTicking(), this;
  }
  then(t) {
    const i = this.totalDuration(), n = !this.reversed && Number.isFinite(i) && this.time >= i ? Promise.resolve(void 0) : new Promise((o) => this.thenResolvers.push(() => o(void 0)));
    return t ? n.then(t) : n;
  }
}
const R = {
  name: "builtin",
  createTimeline(e) {
    return new k(e);
  },
  to(e, t) {
    const i = new k();
    return i.to(e, t, 0), i.play();
  },
  ticker: g
};
export {
  R as a,
  g as b,
  _ as s
};
