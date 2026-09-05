import { a as oi } from "./builtin-CM6GH1gP.js";
let tr = oi;
function La(t) {
  tr = t;
}
function er() {
  return tr;
}
function de(t) {
  let e = t >>> 0;
  return () => {
    e |= 0, e = e + 1831565813 | 0;
    let n = Math.imul(e ^ e >>> 15, 1 | e);
    return n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n, ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
function ai(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++)
    e ^= t.charCodeAt(n), e = Math.imul(e, 16777619);
  return e >>> 0;
}
function nr(t) {
  const e = de(t), n = [];
  for (let r = 0; r < 256; r++) n.push(e() * 2 - 1);
  return (r) => {
    const i = Math.floor(r), s = r - i, o = s * s * (3 - 2 * s), a = n[(i % 256 + 256) % 256], c = n[((i + 1) % 256 + 256) % 256];
    return a + (c - a) * o;
  };
}
function rt(t) {
  let e = 0;
  for (let n = 1; n < t.length; n++)
    e += Math.hypot(t[n][0] - t[n - 1][0], t[n][1] - t[n - 1][1]);
  return e;
}
function Wt(t, e) {
  if (t.length < 2) return t.slice();
  const n = rt(t), r = Math.max(2, Math.round(n / e) + 1), i = n / (r - 1), s = [[t[0][0], t[0][1], t[0][2]]];
  let o = 0, a = 0, c = Math.hypot(t[1][0] - t[0][0], t[1][1] - t[0][1]);
  for (let h = 1; h < r - 1; h++) {
    const u = h * i;
    for (; a + c < u && o < t.length - 2; )
      a += c, o++, c = Math.hypot(
        t[o + 1][0] - t[o][0],
        t[o + 1][1] - t[o][1]
      );
    const f = c > 0 ? (u - a) / c : 0, m = t[o], g = t[o + 1], _ = m[2] ?? 1, p = g[2] ?? 1;
    s.push([m[0] + (g[0] - m[0]) * f, m[1] + (g[1] - m[1]) * f, _ + (p - _) * f]);
  }
  const l = t[t.length - 1];
  return s.push([l[0], l[1], l[2]]), s;
}
function $t(t, e, n, r = 1.4) {
  if (e <= 0 || t.length < 2) return t;
  const i = nr(n), s = [];
  let o = 0;
  for (let a = 0; a < t.length; a++) {
    a > 0 && (o += Math.hypot(t[a][0] - t[a - 1][0], t[a][1] - t[a - 1][1]));
    const c = t[Math.max(0, a - 1)], l = t[Math.min(t.length - 1, a + 1)], h = l[0] - c[0], u = l[1] - c[1], f = Math.hypot(h, u) || 1, m = i(o / 100 * r) * e;
    s.push([
      t[a][0] + -u / f * m,
      t[a][1] + h / f * m,
      t[a][2]
    ]);
  }
  return s;
}
function li(t, e) {
  if (t.length < 3) return t.slice();
  const n = [], r = t.length, i = r;
  for (let s = 0; s < i; s++) {
    const o = t[s], a = t[(s + 1) % r], c = o[2] ?? 1, l = a[2] ?? 1;
    n.push(
      [o[0] * 0.75 + a[0] * 0.25, o[1] * 0.75 + a[1] * 0.25, c * 0.75 + l * 0.25],
      [o[0] * 0.25 + a[0] * 0.75, o[1] * 0.25 + a[1] * 0.75, c * 0.25 + l * 0.75]
    );
  }
  return n;
}
function dn(t, e, n, r, i, s = 1, o = 1.06, a = -Math.PI / 3) {
  const c = nr(i), l = Math.PI * (n + r), h = Math.max(24, Math.round(l / 8)), u = [];
  for (let f = 0; f <= h; f++) {
    const m = f / h, g = a + m * o * Math.PI * 2, _ = 1 + c(m * 5) * 0.035 * s;
    u.push([
      t + Math.cos(g) * n * _,
      e + Math.sin(g) * r * _,
      1
    ]);
  }
  return u;
}
function Et(t, e) {
  const n = rt(t);
  if (n === 0) return t;
  let r = 0;
  return t.map((i, s) => {
    s > 0 && (r += Math.hypot(i[0] - t[s - 1][0], i[1] - t[s - 1][1]));
    const o = i[2] ?? 1;
    return [i[0], i[1], Math.max(0.05, o * e(r / n))];
  });
}
function rr(t, e, n, r) {
  const i = e.inflate ?? 6, s = e.roundness ?? 0.8, o = e.irregularity ?? 1, a = t.map((l) => ({
    x: l.x - i,
    y: l.y - i,
    w: l.w + i * 2,
    h: l.h + i * 2
  }));
  if (a.length === 1) {
    const l = a[0], h = e.singleLine ?? "auto";
    return h === "ellipse" || h === "auto" && l.w / l.h < 4 ? dn(
      l.x + l.w / 2,
      l.y + l.h / 2,
      l.w / 2 * 1.12,
      l.h / 2 * 1.35,
      n,
      o
    ) : Tn([l], s, o, n, r);
  }
  for (let l = 0; l < a.length - 1; l++) {
    const h = (a[l].y + a[l].h + a[l + 1].y) / 2;
    a[l].h = h - a[l].y;
    const u = h - a[l + 1].y;
    a[l + 1].y = h, a[l + 1].h -= u;
  }
  const c = 0.6 * r;
  for (let l = 0; l < a.length - 1; l++) {
    const h = a[l], u = a[l + 1], f = h.x + h.w, m = u.x + u.w;
    if (Math.abs(f - m) < c) {
      const g = Math.max(f, m);
      h.w = g - h.x, u.w = g - u.x;
    }
    if (Math.abs(h.x - u.x) < c) {
      const g = Math.min(h.x, u.x);
      h.w += h.x - g, h.x = g, u.w += u.x - g, u.x = g;
    }
  }
  return Tn(a, s, o, n, r);
}
function Tn(t, e, n, r, i) {
  const s = [], o = t[0], a = t[t.length - 1];
  s.push([o.x, o.y, 1], [o.x + o.w, o.y, 1]);
  for (let f = 0; f < t.length - 1; f++) {
    const m = t[f], g = t[f + 1], _ = m.y + m.h;
    Math.abs(m.x + m.w - (g.x + g.w)) > 0.5 && s.push([m.x + m.w, _, 1], [g.x + g.w, _, 1]);
  }
  s.push([a.x + a.w, a.y + a.h, 1]), s.push([a.x, a.y + a.h, 1]);
  for (let f = t.length - 1; f > 0; f--) {
    const m = t[f], g = t[f - 1], _ = m.y;
    Math.abs(m.x - g.x) > 0.5 && s.push([m.x, _, 1], [g.x, _, 1]);
  }
  const c = e * i * 0.6, l = ci(s, c), h = li(l), u = Wt([...h, h[0]], 10);
  return $t(u, 1.5 * n, r, 1.1);
}
function ci(t, e) {
  const n = t.length, r = [];
  for (let i = 0; i < n; i++) {
    const s = t[(i - 1 + n) % n], o = t[i], a = t[(i + 1) % n], c = Math.hypot(o[0] - s[0], o[1] - s[1]), l = Math.hypot(a[0] - o[0], a[1] - o[1]), h = Math.min(e, c / 2, l / 2);
    if (h < 0.5 || c === 0 || l === 0) {
      r.push(o);
      continue;
    }
    r.push(
      [
        o[0] + (s[0] - o[0]) / c * h,
        o[1] + (s[1] - o[1]) / c * h,
        1
      ],
      [
        o[0] + (a[0] - o[0]) / l * h,
        o[1] + (a[1] - o[1]) / l * h,
        1
      ]
    );
  }
  return r;
}
function hi(t, e = 4) {
  if (t === void 0)
    return { top: e, right: e, bottom: e, left: e };
  if (typeof t == "number")
    return { top: t, right: t, bottom: t, left: t };
  if (t.length === 2) {
    const [o, a] = t;
    return { top: o, right: a, bottom: o, left: a };
  }
  const [n, r, i, s] = t;
  return { top: n, right: r, bottom: i, left: s };
}
function ui(t, e) {
  if (!e) {
    const o = t.getBoundingClientRect();
    return o.width > 0 && o.height > 0 ? [{ x: o.left, y: o.top, w: o.width, h: o.height }] : [];
  }
  const n = document.createRange();
  n.selectNodeContents(t);
  const r = Array.from(n.getClientRects()).filter((o) => o.width > 1 && o.height > 1);
  if (n.detach(), r.length === 0) {
    const o = t.getBoundingClientRect();
    return o.width > 0 && o.height > 0 ? [{ x: o.left, y: o.top, w: o.width, h: o.height }] : [];
  }
  const i = r.map((o) => ({ x: o.left, y: o.top, w: o.width, h: o.height })).sort((o, a) => o.y - a.y || o.x - a.x), s = [];
  for (const o of i) {
    const a = s[s.length - 1];
    if (a && Math.min(a.y + a.h, o.y + o.h) - Math.max(a.y, o.y) > 0.5 * Math.min(a.h, o.h)) {
      const l = Math.min(a.x, o.x), h = Math.min(a.y, o.y), u = Math.max(a.x + a.w, o.x + o.w), f = Math.max(a.y + a.h, o.y + o.h);
      a.x = l, a.y = h, a.w = u - l, a.h = f - h;
      continue;
    }
    s.push({ ...o });
  }
  return s;
}
function Gt(t) {
  let e = 1 / 0, n = 1 / 0, r = -1 / 0, i = -1 / 0;
  for (const s of t)
    e = Math.min(e, s.x), n = Math.min(n, s.y), r = Math.max(r, s.x + s.w), i = Math.max(i, s.y + s.h);
  return { x: e, y: n, w: r - e, h: i - n };
}
function fi(t, e) {
  return {
    x: t.x - e.left,
    y: t.y - e.top,
    w: t.w + e.left + e.right,
    h: t.h + e.top + e.bottom
  };
}
function di(t, e, n = 0.5) {
  if (t.length !== e.length) return !1;
  for (let r = 0; r < t.length; r++)
    if (Math.abs(t[r].x - e[r].x) > n || Math.abs(t[r].y - e[r].y) > n || Math.abs(t[r].w - e[r].w) > n || Math.abs(t[r].h - e[r].h) > n)
      return !1;
  return !0;
}
const Fe = 1.4;
function ir(t) {
  var i;
  const e = (i = t.config.brush) == null ? void 0 : i.fill, n = e && typeof e == "object" ? e.bleed ?? 0.15 : 0.15, r = e && typeof e == "object" ? e.texture ?? 0.6 : 0.6;
  return 28 + n * 170 + r * 15;
}
function mi(t) {
  var a, c, l;
  const { config: e } = t, n = Math.max(1, e.iterations ?? 1), r = [];
  let i = 0, s = 0;
  const o = { layer: () => i++, group: () => s++ };
  for (let h = 0; h < n; h++) {
    const u = t.seed + h * 7919;
    switch (e.type) {
      case "underline":
        kn(t, r, u, o, (f) => f.y + f.h);
        break;
      case "strike-through":
        kn(t, r, u, o, (f) => f.y + f.h / 2);
        break;
      case "highlight":
        pi(t, r, u, o);
        break;
      case "box":
        xi(t, r, u, o);
        break;
      case "circle":
        wi(t, r, u, o, h);
        break;
      case "contour":
        bi(t, r, u, o);
        break;
      case "crossed-off":
        vi(t, r, u, o);
        break;
      case "bracket":
        _i(t, r, u, o);
        break;
      /* VENDOR PATCH (presentation-test): caller-supplied stroke polylines */
      case "path":
        Vp(t, r, u, o);
        break;
    }
  }
  return (e.type === "box" || e.type === "circle" || e.type === "contour") && ((a = t.config.brush) != null && a.fill && Pn(t, r, "wash", o), (c = t.config.brush) != null && c.hatch && Pn(t, r, "hatch", o), ((l = t.config.brush) == null ? void 0 : l.weight) === 0 && (t.config.brush.fill || t.config.brush.hatch)) ? r.filter((h) => h.kind !== "spline") : r;
}
/* VENDOR PATCH (presentation-test): type "path" — paint caller-supplied
   gestures (config.paths.strokes, element-local CSS px). One reveal group per
   polyline, sequenced in array order; overlapping strokes are packed onto
   separate snapshot layers (capped) so reveals don't uncover undrawn paint.
   Mirrors buildCustomPaths() in src/geometry/paths.ts. */
function Vp(t, e, n, r) {
  const i = t.config.paths;
  if (!i || !i.strokes || i.strokes.length === 0) return;
  const s = t.pathTransform ?? { x: 0, y: 0, scaleX: 1, scaleY: 1 };
  const o = Math.max(2, i.resample ?? 6), a = i.jitter ?? 0, c = At(t);
  const l = Math.max(12, t.strokeWidthEstimate * 0.55), d = l * 0.15;
  const h = [], u = [];
  i.strokes.forEach((f, m) => {
    if (!f || f.length < 2) return;
    let g = f.map((C) => [C[0] * s.scaleX + s.x, C[1] * s.scaleY + s.y, C[2]]);
    g = Wt(g, o), a > 0 && (g = $t(g, a, n + m * 173, Fe)), c && (g = Et(g, c));
    let x1 = 1 / 0, y1 = 1 / 0, x2 = -1 / 0, y2 = -1 / 0;
    for (const C of g)
      x1 = Math.min(x1, C[0]), y1 = Math.min(y1, C[1]), x2 = Math.max(x2, C[0]), y2 = Math.max(y2, C[1]);
    const b = { x: x1 - d, y: y1 - d, w: x2 - x1 + d * 2, h: y2 - y1 + d * 2 };
    let w = h.findIndex(
      (C) => C.every(
        (E) => b.x + b.w < E.x || E.x + E.w < b.x || b.y + b.h < E.y || E.y + E.h < b.y
      )
    );
    w === -1 && (h.length < 8 ? (w = h.length, h.push([]), u.push(r.layer())) : w = m % h.length), h[w].push(b);
    e.push({
      kind: "spline",
      polyline: g,
      curvature: i.curvature ?? 0.3,
      closed: !1,
      layer: u[w],
      group: r.group(),
      lengthPx: rt(g),
      maskWidth: l,
      weightMul: 1,
      reveal: "stroke"
    });
  });
}
function At(t) {
  var i;
  const e = (i = t.config.brush) == null ? void 0 : i.pressure;
  if (e === void 0) return null;
  if (typeof e == "number") return () => e;
  if (typeof e == "function") return e;
  const [n, r] = e;
  return (s) => n + (r - n) * s;
}
function gi(t, e, n, r) {
  let i = Wt(e, 10);
  i = $t(i, 1 + t.fontSize / 40, n, Fe);
  const s = At(t);
  return s && (i = Et(i, s)), r && r.length > 0 && (i = i.map((o) => {
    for (const [a, c] of r)
      if (o[0] > a && o[0] < c)
        return [o[0], o[1], (o[2] ?? 1) * 0.55];
    return o;
  })), i;
}
function yi(t, e) {
  var i;
  const n = (i = t.wordBoxes) == null ? void 0 : i[e];
  if (!n || n.length < 2) return null;
  const r = [];
  for (let s = 0; s < n.length - 1; s++) {
    const o = n[s], a = n[s + 1];
    a.x - (o.x + o.w) > 1 && r.push([o.x + o.w, a.x]);
  }
  return r;
}
function kn(t, e, n, r, i, s = 1, o) {
  const a = r.layer(), c = t.config.stagger && t.config.stagger.by === "word";
  t.lines.forEach((l, h) => {
    var _;
    const u = i(l), f = n + h * 131, m = c ? (_ = t.wordBoxes) == null ? void 0 : _[h] : null, g = m && m.length > 0 ? m.map((p) => [p.x - 2, p.x + p.w + 2]) : [[l.x, l.x + l.w]];
    for (const [p, b] of g) {
      if (b - p < 2) continue;
      const w = gi(
        t,
        [
          [p, u, 1],
          [b, u, 1]
        ],
        f,
        m ? null : yi(t, h)
      );
      e.push({
        kind: "spline",
        polyline: w,
        curvature: 0.5,
        closed: !1,
        layer: a,
        group: r.group(),
        lengthPx: rt(w),
        maskWidth: t.strokeWidthEstimate,
        weightMul: s,
        reveal: "stroke"
      });
    }
  });
}
function pi(t, e, n, r) {
  if (t.config.highlightStyle === "watercolor") {
    const o = r.layer();
    t.lines.forEach((a, c) => {
      const l = de(n + c * 977), h = [
        [a.x + l() * 3, a.y + l() * 2],
        [a.x + a.w - l() * 3, a.y + l() * 2],
        [a.x + a.w - l() * 3, a.y + a.h - l() * 2],
        [a.x + l() * 3, a.y + a.h - l() * 2]
      ];
      e.push({
        kind: "wash",
        polyline: h,
        curvature: 0,
        closed: !0,
        layer: o,
        group: r.group(),
        lengthPx: a.w,
        maskWidth: 0,
        weightMul: 1,
        reveal: "sweep",
        sweepBox: (() => {
          const u = ir(t);
          return { x: a.x - u, y: a.y - u, w: a.w + u * 2, h: a.h + u * 2 };
        })()
      });
    });
    return;
  }
  const i = r.layer(), s = t.config.stagger && t.config.stagger.by === "word";
  t.lines.forEach((o, a) => {
    var f;
    const c = o.y + o.h / 2, l = n + a * 131, h = s ? (f = t.wordBoxes) == null ? void 0 : f[a] : null, u = h && h.length > 0 ? h.map((m) => [m.x - 3, m.x + m.w + 3]) : [[o.x, o.x + o.w]];
    for (const [m, g] of u) {
      if (g - m < 2) continue;
      let _ = Wt(
        [
          [m, c, 1],
          [g, c, 1]
        ],
        14
      );
      _ = $t(_, o.h * 0.045, l, 1);
      const p = At(t);
      p && (_ = Et(_, p)), e.push({
        kind: "spline",
        polyline: _,
        curvature: 0.5,
        closed: !1,
        layer: i,
        group: r.group(),
        lengthPx: rt(_),
        maskWidth: o.h * 1.6,
        weightMul: o.h * 0.42 / Math.max(1e-3, t.weightFinal),
        reveal: "stroke"
      });
    }
  });
}
function xi(t, e, n, r) {
  const i = Gt(t.lines), o = 2 + de(n)() * 3, a = [
    [i.x - o * 0.5, i.y, 1],
    [i.x + i.w, i.y, 1],
    [i.x + i.w, i.y + i.h, 1],
    [i.x, i.y + i.h, 1],
    [i.x, i.y - o, 1]
  ];
  let c = Wt(a, 10);
  c = $t(c, 1.2, n, Fe);
  const l = At(t);
  l && (c = Et(c, l)), e.push({
    kind: "spline",
    polyline: c,
    curvature: 0.35,
    closed: !1,
    layer: r.layer(),
    group: r.group(),
    lengthPx: rt(c),
    maskWidth: t.strokeWidthEstimate,
    weightMul: 1,
    reveal: "stroke"
  });
}
function wi(t, e, n, r, i) {
  const s = Gt(t.lines), o = de(n), a = -Math.PI / 3 + i * 0.9 + o() * 0.4;
  let c = dn(
    s.x + s.w / 2,
    s.y + s.h / 2,
    s.w / 2 * 1.12,
    s.h / 2 * 1.35,
    n,
    1,
    1.06,
    a
  );
  const l = At(t);
  l && (c = Et(c, l)), e.push({
    kind: "spline",
    polyline: c,
    curvature: 0.6,
    closed: !1,
    layer: r.layer(),
    group: r.group(),
    lengthPx: rt(c),
    maskWidth: t.strokeWidthEstimate,
    weightMul: 1,
    reveal: "stroke"
  });
}
function bi(t, e, n, r) {
  let i = rr(t.lines, t.config.contour ?? {}, n, t.lineHeight);
  const s = At(t);
  s && (i = Et(i, s)), e.push({
    kind: "spline",
    polyline: i,
    curvature: 0.55,
    closed: !1,
    layer: r.layer(),
    group: r.group(),
    lengthPx: rt(i),
    maskWidth: t.strokeWidthEstimate,
    weightMul: 1,
    reveal: "stroke"
  });
}
function vi(t, e, n, r) {
  const i = Gt(t.lines);
  [
    [
      [i.x, i.y, 1],
      [i.x + i.w, i.y + i.h, 1]
    ],
    [
      [i.x + i.w, i.y, 1],
      [i.x, i.y + i.h, 1]
    ]
  ].forEach(([o, a], c) => {
    let l = Wt([o, a], 10);
    l = $t(l, 1.5, n + c * 337, Fe);
    const h = At(t);
    h && (l = Et(l, h)), e.push({
      kind: "spline",
      polyline: l,
      curvature: 0.5,
      closed: !1,
      // Diagonals cross, so each needs its own snapshot layer.
      layer: r.layer(),
      group: r.group(),
      lengthPx: rt(l),
      maskWidth: t.strokeWidthEstimate,
      weightMul: 1,
      reveal: "stroke"
    });
  });
}
function _i(t, e, n, r) {
  const i = Gt(t.lines), s = Array.isArray(t.config.brackets) ? t.config.brackets : [t.config.brackets ?? "right"], o = Math.min(Math.min(i.w, i.h) * 0.25, t.fontSize * 0.8), a = r.layer();
  s.forEach((c, l) => {
    let h;
    switch (c) {
      case "left":
        h = [
          [i.x + o, i.y, 1],
          [i.x, i.y, 1],
          [i.x, i.y + i.h, 1],
          [i.x + o, i.y + i.h, 1]
        ];
        break;
      case "right":
        h = [
          [i.x + i.w - o, i.y, 1],
          [i.x + i.w, i.y, 1],
          [i.x + i.w, i.y + i.h, 1],
          [i.x + i.w - o, i.y + i.h, 1]
        ];
        break;
      case "top":
        h = [
          [i.x, i.y + o, 1],
          [i.x, i.y, 1],
          [i.x + i.w, i.y, 1],
          [i.x + i.w, i.y + o, 1]
        ];
        break;
      default:
        h = [
          [i.x, i.y + i.h - o, 1],
          [i.x, i.y + i.h, 1],
          [i.x + i.w, i.y + i.h, 1],
          [i.x + i.w, i.y + i.h - o, 1]
        ];
    }
    let u = Wt(h, 10);
    u = $t(u, 1, n + l * 613, Fe);
    const f = At(t);
    f && (u = Et(u, f)), e.push({
      kind: "spline",
      polyline: u,
      curvature: 0.3,
      closed: !1,
      layer: a,
      group: r.group(),
      lengthPx: rt(u),
      maskWidth: t.strokeWidthEstimate,
      weightMul: 1,
      reveal: "stroke"
    });
  });
}
function Mi(t) {
  const e = Gt(t.lines);
  switch (t.config.type) {
    case "circle":
      return dn(
        e.x + e.w / 2,
        e.y + e.h / 2,
        e.w / 2 * 1.12,
        e.h / 2 * 1.35,
        t.seed,
        1,
        1
      );
    case "contour":
      return rr(t.lines, t.config.contour ?? {}, t.seed, t.lineHeight);
    default: {
      const n = de(t.seed + 4242);
      return [
        [e.x + n() * 4, e.y + n() * 4],
        [e.x + e.w - n() * 4, e.y + n() * 4],
        [e.x + e.w - n() * 4, e.y + e.h - n() * 4],
        [e.x + n() * 4, e.y + e.h - n() * 4]
      ];
    }
  }
}
function Pn(t, e, n, r) {
  const i = Mi(t);
  let s = 1 / 0, o = 1 / 0, a = -1 / 0, c = -1 / 0;
  for (const h of i)
    s = Math.min(s, h[0]), o = Math.min(o, h[1]), a = Math.max(a, h[0]), c = Math.max(c, h[1]);
  const l = n === "wash" ? ir(t) : 25;
  e.push({
    kind: n,
    polyline: i,
    curvature: 0,
    closed: !0,
    layer: r.layer(),
    group: r.group(),
    lengthPx: Math.max(a - s, c - o),
    maskWidth: 0,
    weightMul: 1,
    reveal: "sweep",
    sweepBox: { x: s - l, y: o - l, w: a - s + l * 2, h: c - o + l * 2 }
  });
}
function Ri(t, e) {
  if (e.length === 0) return null;
  const n = t.ownerDocument, r = n.createTreeWalker(t, NodeFilter.SHOW_TEXT), i = n.createRange(), s = [];
  for (let c = r.nextNode(); c; c = r.nextNode()) {
    const l = c.nodeValue ?? "", h = /\S+/g;
    let u;
    for (; u = h.exec(l); ) {
      i.setStart(c, u.index), i.setEnd(c, u.index + u[0].length);
      for (const f of i.getClientRects())
        f.width > 0 && f.height > 0 && s.push({ x: f.left, y: f.top, w: f.width, h: f.height });
    }
  }
  if (s.length === 0) return null;
  s.sort((c, l) => c.y - l.y || c.x - l.x);
  const o = [];
  for (const c of s) {
    const l = o[o.length - 1];
    l && c.y < l.bottom - 0.5 ? (l.rects.push(c), l.bottom = Math.max(l.bottom, c.y + c.h)) : o.push({ rects: [c], top: c.y, bottom: c.y + c.h });
  }
  if (o.length !== e.length) return null;
  const a = [];
  for (let c = 0; c < o.length; c++) {
    const l = o[c], h = e[c];
    if (Math.min(l.bottom, h.y + h.h) - Math.max(l.top, h.y) <= 0)
      return null;
    l.rects.sort((f, m) => f.x - m.x);
    const u = [];
    for (const f of l.rects) {
      const m = u[u.length - 1];
      m && f.x - (m.x + m.w) <= 1 ? m.w = Math.max(m.w, f.x + f.w - m.x) : u.push({ x: f.x, y: h.y, w: f.w, h: h.h });
    }
    a.push(u);
  }
  return a;
}
function Si(t) {
  const e = document.createElement("canvas");
  e.className = "brushmark-overlay", e.setAttribute("aria-hidden", "true");
  const n = e.style;
  n.position = "absolute", n.top = "0", n.left = "0", n.pointerEvents = "none";
  const r = getComputedStyle(t), i = t.style.position, s = t.style.isolation;
  let o = !1;
  (!r.position || r.position === "static") && (t.style.position = "relative", o = !0), t.appendChild(e);
  const a = e.getContext("2d");
  if (!a) throw new Error("brushmark: 2D context unavailable");
  const c = {
    canvas: e,
    ctx: a,
    viewport: { x: 0, y: 0, w: 0, h: 0 },
    dpr: 1,
    _isolationTouched: !1,
    restore: () => {
      o && (t.style.position = i), c._isolationTouched && (t.style.isolation = s);
    }
  };
  return c;
}
function Ei(t, e, n, r) {
  const i = t.canvas.style;
  n ? (i.zIndex = r !== void 0 ? String(r) : "-1", getComputedStyle(e).isolation !== "isolate" && (e.style.isolation = "isolate", t._isolationTouched = !0)) : i.zIndex = r !== void 0 ? String(r) : "";
}
function Ai(t, e, n) {
  const { canvas: r } = t;
  r.style.top = "0px", r.style.left = "0px", r.style.width = `${e.w}px`, r.style.height = `${e.h}px`;
  const i = r.getBoundingClientRect();
  /* VENDOR PATCH (presentation-test): divide out accumulated ancestor CSS
     transform scale so overlays place correctly inside a scaled stage.
     Mirrors the same patch in src/dom/overlay.ts placeOverlay(). */
  const sx = e.w > 0 && i.width > 0 ? i.width / e.w : 1, sy = e.h > 0 && i.height > 0 ? i.height / e.h : 1;
  (Math.abs(sx - 1) > 0.001 || Math.abs(sy - 1) > 0.001) && (r.style.width = `${e.w / sx}px`, r.style.height = `${e.h / sy}px`);
  r.style.left = `${(e.x - i.left) / sx}px`, r.style.top = `${(e.y - i.top) / sy}px`;
  const s = Math.max(1, Math.ceil(e.w * n)), o = Math.max(1, Math.ceil(e.h * n));
  (r.width !== s || r.height !== o) && (r.width = s, r.height = o), t.viewport = { ...e }, t.dpr = n;
}
function Ti(t) {
  t.canvas.remove(), t.restore();
}
const ki = 250;
function Pi(t, e) {
  var a;
  let n = null, r = !1;
  const i = () => {
    n && clearTimeout(n), n = setTimeout(() => {
      n = null, r || e();
    }, ki);
  }, s = new ResizeObserver(i);
  s.observe(t), t.offsetParent instanceof HTMLElement && t.offsetParent !== document.body && s.observe(t.offsetParent), window.addEventListener("resize", i, { passive: !0 });
  let o = !0;
  return ((a = document.fonts) == null ? void 0 : a.status) === "loading" ? document.fonts.ready.then(() => {
    o && !r && i();
  }) : o = !1, () => {
    r = !0, o = !1, n && clearTimeout(n), s.disconnect(), window.removeEventListener("resize", i);
  };
}
const Ci = {
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  x: 0,
  y: 0
};
let mn = () => !1, ie = () => {
  throw new Error("No runtime color adapter registered.");
}, Dt = () => Ci, sr = () => {
};
function or(t) {
  t.usesRadians && (mn = t.usesRadians), t.fromDegrees && t.fromDegrees, t.createColor && (ie = t.createColor), t.getAffineMatrix && (Dt = t.getAffineMatrix), t.notifyDraw && (sr = t.notifyDraw);
}
let N, O, C, $, Rt = {
  load: () => {
    throw new Error("No target runtime adapter registered.");
  },
  syncDensity: () => $,
  isCanvasReady: () => {
    throw new Error("No target runtime adapter registered.");
  },
  instance: (t) => {
  },
  activateInstance: (t) => {
  },
  deactivateInstance: () => {
  },
  getActiveFramebuffer: () => null,
  isFramebufferTarget: () => !1
};
function ar(t) {
  "Cwidth" in t && (N = t.Cwidth), "Cheight" in t && (O = t.Cheight), "Instance" in t && t.Instance, "Renderer" in t && (C = t.Renderer), "Density" in t && ($ = t.Density);
}
function Fi(t) {
  Rt = { ...Rt, ...t };
}
const Ii = (t = !1) => Rt.load(t), Di = () => Rt.syncDensity(), gn = () => Rt.isCanvasReady(), Cn = () => Rt.getActiveFramebuffer(), lr = (t) => Rt.isFramebufferTarget(t), Li = (t, e = 0) => t ? {
  minX: t.minX - e,
  minY: t.minY - e,
  maxX: t.maxX + e,
  maxY: t.maxY + e
} : null, Bi = (t, e, n) => {
  if (!t) return null;
  const r = Math.max(0, Math.floor(Math.min(t.minX, t.maxX))), i = Math.max(0, Math.floor(Math.min(t.minY, t.maxY))), s = Math.min(e, Math.ceil(Math.max(t.minX, t.maxX))), o = Math.min(n, Math.ceil(Math.max(t.minY, t.maxY)));
  return s <= r || o <= i ? null : { minX: r, minY: i, maxX: s, maxY: o };
}, Ni = (t, e) => t ? e ? {
  minX: Math.min(t.minX, e.minX),
  minY: Math.min(t.minY, e.minY),
  maxX: Math.max(t.maxX, e.maxX),
  maxY: Math.max(t.maxY, e.maxY)
} : t : e, Oi = (t, e) => ({
  minX: 0,
  minY: 0,
  maxX: t,
  maxY: e
}), Ie = (t, e, n = !1) => {
  const r = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(t, e) : (() => {
    const i = document.createElement("canvas");
    return i.width = t, i.height = e, i;
  })();
  return r.drawingContext = r.getContext(
    "2d",
    n ? { willReadFrequently: !0 } : void 0
  ), r;
}, zi = (t, e = !1) => (t.drawingContext ?? (t.drawingContext = t.getContext(
  "2d",
  e ? { willReadFrequently: !0 } : void 0
)), t.drawingContext);
function Ui({
  renderer: t,
  sourceFramebuffer: e,
  dirtyRect: n,
  getTargetPixelSize: r,
  toScissorBox: i
}) {
  const s = t.drawingContext, { width: o, height: a } = r(), c = n ? i(n) : null, l = s.getParameter(s.READ_FRAMEBUFFER_BINDING), h = s.getParameter(s.DRAW_FRAMEBUFFER_BINDING);
  return s.bindFramebuffer(s.READ_FRAMEBUFFER, null), s.bindFramebuffer(s.DRAW_FRAMEBUFFER, e.framebuffer), s.blitFramebuffer(
    (c == null ? void 0 : c.x) ?? 0,
    (c == null ? void 0 : c.y) ?? 0,
    c ? c.x + c.width : o,
    c ? c.y + c.height : a,
    (c == null ? void 0 : c.x) ?? 0,
    (c == null ? void 0 : c.y) ?? 0,
    c ? c.x + c.width : o,
    c ? c.y + c.height : a,
    s.COLOR_BUFFER_BIT,
    s.NEAREST
  ), s.bindFramebuffer(s.READ_FRAMEBUFFER, l), s.bindFramebuffer(s.DRAW_FRAMEBUFFER, h), e;
}
let ut = {
  clearTarget: () => {
    throw new Error("No compositor runtime adapter registered.");
  },
  ensureBlendShaderProgram: () => {
    throw new Error("No compositor runtime adapter registered.");
  },
  ensureBlendSourceFramebuffer: () => {
    throw new Error("No compositor runtime adapter registered.");
  },
  createFramebuffer: () => {
    throw new Error("No compositor runtime adapter registered.");
  },
  runBlendShaderPass: () => {
    throw new Error("No compositor runtime adapter registered.");
  },
  blitSourceToFramebuffer: () => {
    throw new Error("No compositor runtime adapter registered.");
  }
};
function Xi(t) {
  ut = { ...ut, ...t };
}
const Yi = (...t) => ut.clearTarget(...t), Wi = (...t) => ut.ensureBlendShaderProgram(...t), $i = (...t) => ut.ensureBlendSourceFramebuffer(...t), cr = (...t) => ut.createFramebuffer(...t), Gi = (...t) => ut.runBlendShaderPass(...t), Hi = (...t) => ut.blitSourceToFramebuffer(...t), Vi = `#version 300 es
out vec2 p;
void main() {
vec3 v = vec3(-1);
v[gl_VertexID] = 3.;
p = v.xy;
gl_Position = vec4(v.x, -v.y, 0, 1);
}`, ji = `#version 300 es
precision highp float;
uniform bool u_isBrush;
uniform bool u_targetIsFramebuffer;
uniform sampler2D u_source;
uniform sampler2D u_mask;
uniform vec3 u_color;
in vec2 p;
out vec4 outColor;
const int SPECTRAL_SIZE = 38;
const float SPECTRAL_GAMMA = 2.4;
const float SPECTRAL_EPSILON = 0.0001;
float spectral_uncompand(float x) {
return (x < 0.04045) ? x / 12.92 : pow((x + 0.055) / 1.055, SPECTRAL_GAMMA);
}
float spectral_compand(float x) {
return (x < 0.0031308) ? x * 12.92 : 1.055 * pow(x, 1.0 / SPECTRAL_GAMMA) - 0.055;
}
vec3 spectral_srgb_to_linear(vec3 srgb) {
return vec3(spectral_uncompand(srgb[0]), spectral_uncompand(srgb[1]), spectral_uncompand(srgb[2]));
}
vec3 spectral_linear_to_srgb(vec3 lrgb) {
return clamp(vec3(spectral_compand(lrgb[0]), spectral_compand(lrgb[1]), spectral_compand(lrgb[2])), 0., 1.);
}
void spectral_linear_to_reflectance(vec3 lrgb, inout float R[SPECTRAL_SIZE]) {
float w = min(lrgb.r, min(lrgb.g, lrgb.b));
lrgb -= w;
float c = min(lrgb.g, lrgb.b);
float m = min(lrgb.r, lrgb.b);
float y = min(lrgb.r, lrgb.g);
float r = min(max(0.0, lrgb.r - lrgb.b), max(0.0, lrgb.r - lrgb.g));
float g = min(max(0.0, lrgb.g - lrgb.b), max(0.0, lrgb.g - lrgb.r));
float b = min(max(0.0, lrgb.b - lrgb.g), max(0.0, lrgb.b - lrgb.r));
R[ 0] = max(SPECTRAL_EPSILON, w * 1.0011607271876400 + c * 0.9705850013229620 + m * 0.9906735573199880 + y * 0.0210523371789306 + r * 0.0315605737777207 + g * 0.0095560747554212 + b * 0.9794047525020140);
R[ 1] = max(SPECTRAL_EPSILON, w * 1.0011606515972800 + c * 0.9705924981434250 + m * 0.9906715249619790 + y * 0.0210564627517414 + r * 0.0315520718330149 + g * 0.0095581580120851 + b * 0.9794007068431300);
R[ 2] = max(SPECTRAL_EPSILON, w * 1.0011603192274700 + c * 0.9706253487298910 + m * 0.9906625823534210 + y * 0.0210746178695038 + r * 0.0315148215513658 + g * 0.0095673245444588 + b * 0.9793829034702610);
R[ 3] = max(SPECTRAL_EPSILON, w * 1.0011586727078900 + c * 0.9707868061190170 + m * 0.9906181076447950 + y * 0.0211649058448753 + r * 0.0313318044982702 + g * 0.0096129126297349 + b * 0.9792943649455940);
R[ 4] = max(SPECTRAL_EPSILON, w * 1.0011525984455200 + c * 0.9713686732282480 + m * 0.9904514808787100 + y * 0.0215027957272504 + r * 0.0306729857725527 + g * 0.0097837090401843 + b * 0.9789630146085700);
R[ 5] = max(SPECTRAL_EPSILON, w * 1.0011325252899800 + c * 0.9731632306212520 + m * 0.9898710814002040 + y * 0.0226738799041561 + r * 0.0286480476989607 + g * 0.0103786227058710 + b * 0.9778144666940430);
R[ 6] = max(SPECTRAL_EPSILON, w * 1.0010850066332700 + c * 0.9767402231587650 + m * 0.9882866087596400 + y * 0.0258235649693629 + r * 0.0246450407045709 + g * 0.0120026452378567 + b * 0.9747243211338360);
R[ 7] = max(SPECTRAL_EPSILON, w * 1.0009968788945300 + c * 0.9815876054913770 + m * 0.9842906927975040 + y * 0.0334879385639851 + r * 0.0192960753663651 + g * 0.0160977721473922 + b * 0.9671984823439730);
R[ 8] = max(SPECTRAL_EPSILON, w * 1.0008652515227400 + c * 0.9862802656529490 + m * 0.9739349056253060 + y * 0.0519069663740307 + r * 0.0142066612220556 + g * 0.0267061902231680 + b * 0.9490796575305750);
R[ 9] = max(SPECTRAL_EPSILON, w * 1.0006962900094000 + c * 0.9899491476891340 + m * 0.9418178384601450 + y * 0.1007490148334730 + r * 0.0102942608878609 + g * 0.0595555440185881 + b * 0.9008501289409770);
R[10] = max(SPECTRAL_EPSILON, w * 1.0005049611488800 + c * 0.9924927015384200 + m * 0.8173903261951560 + y * 0.2391298997068470 + r * 0.0076191460521811 + g * 0.1860398265328260 + b * 0.7631504454622400);
R[11] = max(SPECTRAL_EPSILON, w * 1.0003080818799200 + c * 0.9941456804052560 + m * 0.4324728050657290 + y * 0.5348043122727480 + r * 0.0058980410835420 + g * 0.5705798201161590 + b * 0.4659221716493190);
R[12] = max(SPECTRAL_EPSILON, w * 1.0001196660201300 + c * 0.9951839750332120 + m * 0.1384539782588700 + y * 0.7978075786430300 + r * 0.0048233247781713 + g * 0.8614677684002920 + b * 0.2012632804510050);
R[13] = max(SPECTRAL_EPSILON, w * 0.9999527659684070 + c * 0.9957567501108180 + m * 0.0537347216940033 + y * 0.9114498940673840 + r * 0.0042298748350633 + g * 0.9458790897676580 + b * 0.0877524413419623);
R[14] = max(SPECTRAL_EPSILON, w * 0.9998218368992970 + c * 0.9959128182867100 + m * 0.0292174996673231 + y * 0.9537979630045070 + r * 0.0040599171299341 + g * 0.9704654864743050 + b * 0.0457176793291679);
R[15] = max(SPECTRAL_EPSILON, w * 0.9997386095575930 + c * 0.9956061578345280 + m * 0.0213136517508590 + y * 0.9712416154654290 + r * 0.0043533695594676 + g * 0.9784136302844500 + b * 0.0284706050521843);
R[16] = max(SPECTRAL_EPSILON, w * 0.9997095516396120 + c * 0.9945976009618540 + m * 0.0201349530181136 + y * 0.9793031238075880 + r * 0.0053434425970201 + g * 0.9795890314112240 + b * 0.0205271767569850);
R[17] = max(SPECTRAL_EPSILON, w * 0.9997319302106270 + c * 0.9922157154923700 + m * 0.0241323096280662 + y * 0.9833801195075750 + r * 0.0076917201010463 + g * 0.9755335369086320 + b * 0.0165302792310211);
R[18] = max(SPECTRAL_EPSILON, w * 0.9997994363461950 + c * 0.9862364527832490 + m * 0.0372236145223627 + y * 0.9854612465677550 + r * 0.0135969795736536 + g * 0.9622887553978130 + b * 0.0145135107212858);
R[19] = max(SPECTRAL_EPSILON, w * 0.9999003303166710 + c * 0.9679433372645410 + m * 0.0760506552706601 + y * 0.9864350469766050 + r * 0.0316975442661115 + g * 0.9231215745131200 + b * 0.0136003508637687);
R[20] = max(SPECTRAL_EPSILON, w * 1.0000204065261100 + c * 0.8912850042449430 + m * 0.2053754719423990 + y * 0.9867382506701410 + r * 0.1078611963552490 + g * 0.7934340189431110 + b * 0.0133604258769571);
R[21] = max(SPECTRAL_EPSILON, w * 1.0001447879365800 + c * 0.5362024778620530 + m * 0.5412689034604390 + y * 0.9866178824450320 + r * 0.4638126031687040 + g * 0.4592701359024290 + b * 0.0135488943145680);
R[22] = max(SPECTRAL_EPSILON, w * 1.0002599790341200 + c * 0.1541081190018780 + m * 0.8158416850864860 + y * 0.9862777767586430 + r * 0.8470554052720110 + g * 0.1855741036663030 + b * 0.0139594356366992);
R[23] = max(SPECTRAL_EPSILON, w * 1.0003557969708900 + c * 0.0574575093228929 + m * 0.9128177041239760 + y * 0.9858605924440560 + r * 0.9431854093939180 + g * 0.0881774959955372 + b * 0.0144434255753570);
R[24] = max(SPECTRAL_EPSILON, w * 1.0004275378026900 + c * 0.0315349873107007 + m * 0.9463398301669620 + y * 0.9854749276762100 + r * 0.9688621506965580 + g * 0.0543630228766700 + b * 0.0148854440621406);
R[25] = max(SPECTRAL_EPSILON, w * 1.0004762334488800 + c * 0.0222633920086335 + m * 0.9599276963319910 + y * 0.9851769347655580 + r * 0.9780306674736030 + g * 0.0406288447060719 + b * 0.0152254296999746);
R[26] = max(SPECTRAL_EPSILON, w * 1.0005072096750800 + c * 0.0182022841492439 + m * 0.9662605952303120 + y * 0.9849715740141810 + r * 0.9820436438543060 + g * 0.0342215204316970 + b * 0.0154592848180209);
R[27] = max(SPECTRAL_EPSILON, w * 1.0005251915637300 + c * 0.0162990559732640 + m * 0.9693259700584240 + y * 0.9848463034157120 + r * 0.9839236237187070 + g * 0.0311185790956966 + b * 0.0156018026485961);
R[28] = max(SPECTRAL_EPSILON, w * 1.0005350960689600 + c * 0.0153656239334613 + m * 0.9708545367213990 + y * 0.9847753518111990 + r * 0.9848454841543820 + g * 0.0295708898336134 + b * 0.0156824871281936);
R[29] = max(SPECTRAL_EPSILON, w * 1.0005402209748200 + c * 0.0149111568733976 + m * 0.9716050665281280 + y * 0.9847380666252650 + r * 0.9852942758145960 + g * 0.0288108739348928 + b * 0.0157248764360615);
R[30] = max(SPECTRAL_EPSILON, w * 1.0005427281678400 + c * 0.0146954339898235 + m * 0.9719627697573920 + y * 0.9847196483117650 + r * 0.9855072952198250 + g * 0.0284486271324597 + b * 0.0157458108784121);
R[31] = max(SPECTRAL_EPSILON, w * 1.0005438956908700 + c * 0.0145964146717719 + m * 0.9721272722745090 + y * 0.9847110233919390 + r * 0.9856050715398370 + g * 0.0282820301724731 + b * 0.0157556123350225);
R[32] = max(SPECTRAL_EPSILON, w * 1.0005444821215100 + c * 0.0145470156699655 + m * 0.9722094177458120 + y * 0.9847066833006760 + r * 0.9856538499335780 + g * 0.0281988376490237 + b * 0.0157605443964911);
R[33] = max(SPECTRAL_EPSILON, w * 1.0005447695999200 + c * 0.0145228771899495 + m * 0.9722495776784240 + y * 0.9847045543930910 + r * 0.9856776850338830 + g * 0.0281581655342037 + b * 0.0157629637515278);
R[34] = max(SPECTRAL_EPSILON, w * 1.0005448988776200 + c * 0.0145120341118965 + m * 0.9722676219987420 + y * 0.9847035963093700 + r * 0.9856883918061220 + g * 0.0281398910216386 + b * 0.0157640525629106);
R[35] = max(SPECTRAL_EPSILON, w * 1.0005449625468900 + c * 0.0145066940939832 + m * 0.9722765094621500 + y * 0.9847031240775520 + r * 0.9856936646900310 + g * 0.0281308901665811 + b * 0.0157645892329510);
R[36] = max(SPECTRAL_EPSILON, w * 1.0005449892705800 + c * 0.0145044507314479 + m * 0.9722802433068740 + y * 0.9847029256150900 + r * 0.9856958798482050 + g * 0.0281271086805816 + b * 0.0157648147772649);
R[37] = max(SPECTRAL_EPSILON, w * 1.0005449969930000 + c * 0.0145038009464639 + m * 0.9722813248265600 + y * 0.9847028681227950 + r * 0.9856965214637620 + g * 0.0281260133612096 + b * 0.0157648801149616);
}
vec3 spectral_xyz_to_srgb(vec3 xyz) {
mat3 XYZ_RGB;
XYZ_RGB[0] = vec3( 3.2409699419045200, -1.537383177570090, -0.4986107602930030);
XYZ_RGB[1] = vec3(-0.9692436362808790,  1.875967501507720,  0.0415550574071756);
XYZ_RGB[2] = vec3( 0.0556300796969936, -0.203976958888976,  1.0569715142428700);
float r = dot(XYZ_RGB[0], xyz);
float g = dot(XYZ_RGB[1], xyz);
float b = dot(XYZ_RGB[2], xyz);
return spectral_linear_to_srgb(vec3(r, g, b));
}
vec3 spectral_reflectance_to_xyz(float R[SPECTRAL_SIZE]) {
vec3 xyz = vec3(0.);
xyz += R[ 0] * vec3(0.0000646919989576, 0.0000018442894440, 0.0003050171476380);
xyz += R[ 1] * vec3(0.0002194098998132, 0.0000062053235865, 0.0010368066663574);
xyz += R[ 2] * vec3(0.0011205743509343, 0.0000310096046799, 0.0053131363323992);
xyz += R[ 3] * vec3(0.0037666134117111, 0.0001047483849269, 0.0179543925899536);
xyz += R[ 4] * vec3(0.0118805536037990, 0.0003536405299538, 0.0570775815345485);
xyz += R[ 5] * vec3(0.0232864424191771, 0.0009514714056444, 0.1136516189362870);
xyz += R[ 6] * vec3(0.0345594181969747, 0.0022822631748318, 0.1733587261835500);
xyz += R[ 7] * vec3(0.0372237901162006, 0.0042073290434730, 0.1962065755586570);
xyz += R[ 8] * vec3(0.0324183761091486, 0.0066887983719014, 0.1860823707062960);
xyz += R[ 9] * vec3(0.0212332056093810, 0.0098883960193565, 0.1399504753832070);
xyz += R[10] * vec3(0.0104909907685421, 0.0152494514496311, 0.0891745294268649);
xyz += R[11] * vec3(0.0032958375797931, 0.0214183109449723, 0.0478962113517075);
xyz += R[12] * vec3(0.0005070351633801, 0.0334229301575068, 0.0281456253957952);
xyz += R[13] * vec3(0.0009486742057141, 0.0513100134918512, 0.0161376622950514);
xyz += R[14] * vec3(0.0062737180998318, 0.0704020839399490, 0.0077591019215214);
xyz += R[15] * vec3(0.0168646241897775, 0.0878387072603517, 0.0042961483736618);
xyz += R[16] * vec3(0.0286896490259810, 0.0942490536184085, 0.0020055092122156);
xyz += R[17] * vec3(0.0426748124691731, 0.0979566702718931, 0.0008614711098802);
xyz += R[18] * vec3(0.0562547481311377, 0.0941521856862608, 0.0003690387177652);
xyz += R[19] * vec3(0.0694703972677158, 0.0867810237486753, 0.0001914287288574);
xyz += R[20] * vec3(0.0830531516998291, 0.0788565338632013, 0.0001495555858975);
xyz += R[21] * vec3(0.0861260963002257, 0.0635267026203555, 0.0000923109285104);
xyz += R[22] * vec3(0.0904661376847769, 0.0537414167568200, 0.0000681349182337);
xyz += R[23] * vec3(0.0850038650591277, 0.0426460643574120, 0.0000288263655696);
xyz += R[24] * vec3(0.0709066691074488, 0.0316173492792708, 0.0000157671820553);
xyz += R[25] * vec3(0.0506288916373645, 0.0208852059213910, 0.0000039406041027);
xyz += R[26] * vec3(0.0354739618852640, 0.0138601101360152, 0.0000015840125870);
xyz += R[27] * vec3(0.0214682102597065, 0.0081026402038399, 0.0000000000000000);
xyz += R[28] * vec3(0.0125164567619117, 0.0046301022588030, 0.0000000000000000);
xyz += R[29] * vec3(0.0068045816390165, 0.0024913800051319, 0.0000000000000000);
xyz += R[30] * vec3(0.0034645657946526, 0.0012593033677378, 0.0000000000000000);
xyz += R[31] * vec3(0.0014976097506959, 0.0005416465221680, 0.0000000000000000);
xyz += R[32] * vec3(0.0007697004809280, 0.0002779528920067, 0.0000000000000000);
xyz += R[33] * vec3(0.0004073680581315, 0.0001471080673854, 0.0000000000000000);
xyz += R[34] * vec3(0.0001690104031614, 0.0000610327472927, 0.0000000000000000);
xyz += R[35] * vec3(0.0000952245150365, 0.0000343873229523, 0.0000000000000000);
xyz += R[36] * vec3(0.0000490309872958, 0.0000177059860053, 0.0000000000000000);
xyz += R[37] * vec3(0.0000199961492222, 0.0000072209749130, 0.0000000000000000);
return xyz;
}
float KS(float R) {
return pow(1.0 - R, 2.0) / (2.0 * R);
}
float KM(float KS) {
return 1.0 + KS - sqrt(pow(KS, 2.0) + 2.0 * KS);
}
vec3 spectral_mix(vec3 color1, float tintingStrength1, float factor1, vec3 color2, float tintingStrength2, float factor2) {
vec3 lrgb1 = spectral_srgb_to_linear(color1);
vec3 lrgb2 = spectral_srgb_to_linear(color2);
float R1[SPECTRAL_SIZE];
float R2[SPECTRAL_SIZE];
spectral_linear_to_reflectance(lrgb1, R1);
spectral_linear_to_reflectance(lrgb2, R2);
float luminance1 = spectral_reflectance_to_xyz(R1)[1];
float luminance2 = spectral_reflectance_to_xyz(R2)[1];
float R[SPECTRAL_SIZE];
for (int i = 0; i < SPECTRAL_SIZE; i++) {
float concentration1 = pow(factor1, 2.) * pow(tintingStrength1, 2.) * luminance1;
float concentration2 = pow(factor2, 2.) * pow(tintingStrength2, 2.) * luminance2;
float totalConcentration = concentration1 + concentration2;
float ksMix = 0.;
ksMix += KS(R1[i]) * concentration1;
ksMix += KS(R2[i]) * concentration2;
R[i] = KM(ksMix / totalConcentration);
}
return spectral_xyz_to_srgb(spectral_reflectance_to_xyz(R));
}
vec3 spectral_mix(vec3 color1, vec3 color2, float factor) {
return spectral_mix(color1, 1., 1. - factor, color2, 1., factor);
}
vec3 spectral_mix(vec3 color1, float factor1, vec3 color2, float factor2) {
return spectral_mix(color1, 1., factor1, color2, 1., factor2);
}
const float GAMMA = 2.4, EPSILON = 0.0001;
const float DARKEN_THRESHOLD = 0.7;
const float EDGE_MIN = 0.05, EDGE_MAX = 0.35;
void main(void) {
vec2 uv = 0.5 * p + 0.5;
vec2 sourceUV = vec2(uv.x, 1.0 - uv.y);
vec2 maskUV = u_targetIsFramebuffer ? vec2(uv.x, 1.0 - uv.y) : uv;
vec4 source = texture(u_source, sourceUV);
vec4 maskColor = texture(u_mask, maskUV);
if (maskColor.a == 0.0) {
outColor = source;
return;
}
vec4 pigment = vec4(u_color.xyz, 1.0);
if (u_isBrush && (maskColor.a > DARKEN_THRESHOLD)) {
float blacken = 0.5 * (min(maskColor.a, 1.0) - DARKEN_THRESHOLD);
pigment = pigment * (1.0 - blacken) - vec4(0.5) * blacken;
pigment.rgb = max(pigment.rgb, vec3(0.0));
}
float mixIntensity = min(maskColor.a, 1.0);
if (!u_isBrush) {
vec2 texelSize = 1.0 / vec2(textureSize(u_mask, 0));
float scaledAlpha = maskColor.a * 15.0;
float blurEdge = 0.0;
for (int i = -2; i <= 2; i += 2) {
for (int j = -2; j <= 2; j += 2) {
vec2 neighborUV = maskUV + vec2(float(i), float(j)) * texelSize;
float neighborAlpha = texture(u_mask, neighborUV).a * 15.0;
blurEdge += smoothstep(EDGE_MIN, EDGE_MAX,
length(vec2(dFdx(neighborAlpha), dFdy(neighborAlpha))));
}
}
blurEdge /= 9.0;
mixIntensity = clamp(maskColor.a + blurEdge * 0.1, 0.0, 1.0);
}
vec3 bgColor = mix(vec3(1.0), source.rgb, source.a);
outColor = vec4(spectral_mix(bgColor, pigment.rgb, mixIntensity), 1.);
}`;
let J = null, tt = null;
const ze = (t) => {
  J = t;
}, Ue = (t) => {
  tt = t;
}, Xe = (t) => {
  Yi(C, t, lr);
}, De = () => ({
  width: Math.max(1, Math.round(N * $)),
  height: Math.max(1, Math.round(O * $))
}), nn = (t) => {
  if (!t) return null;
  const { width: e, height: n } = De();
  return Bi(t, e, n);
}, Fn = () => {
  const { width: t, height: e } = De();
  return Oi(t, e);
}, hr = (t, e = !0) => {
  const n = nn(t);
  if (!n) return null;
  const { height: r } = De();
  return {
    x: n.minX,
    y: e ? r - n.maxY : n.minY,
    width: n.maxX - n.minX,
    height: n.maxY - n.minY
  };
}, In = (t, e, n, r = !0) => {
  const i = hr(e, r);
  if (!i) {
    n();
    return;
  }
  t.enable(t.SCISSOR_TEST), t.scissor(i.x, i.y, i.width, i.height);
  try {
    n();
  } finally {
    t.disable(t.SCISSOR_TEST);
  }
}, y = {}, Le = () => {
  C != null && C.loaded || (gn(), M.load());
}, M = {
  isBlending: !1,
  cachedColor: null,
  /**
   * Merges a new dirty rectangle into the target's accumulated draw bounds.
   * @param {object} target - Mask buffer receiving draw output.
   * @param {{minX:number,minY:number,maxX:number,maxY:number}|null} rect - Rect to merge.
   */
  markDirtyRect(t, e) {
    const n = nn(e);
    !t || !n || (t.dirtyRect = Ni(t.dirtyRect, n), t.isDrawn = !0);
  },
  /**
   * Clears a mask buffer and resets its dirty-rect tracking.
   * @param {object} target - Mask buffer to reset.
   */
  clearMask(t) {
    var n;
    if (!t) return;
    const e = t === this.glMask ? J : tt;
    (n = e == null ? void 0 : e.clearMask) == null || n.call(e, t, Xe);
  },
  /**
   * Resolves the region that should be composited back into the destination.
   * @param {object} target - Mask buffer being sampled.
   * @param {boolean} isBrushMask - True when compositing the GL brush mask.
   * @returns {{minX:number,minY:number,maxX:number,maxY:number}|null} Composite rect.
   */
  getCompositeRect(t, e) {
    var r;
    const n = e ? J : tt;
    return (r = n == null ? void 0 : n.getCompositeRect) == null ? void 0 : r.call(
      n,
      t,
      Cn,
      Fn,
      Li,
      nn
    );
  },
  // =============================================================================
  // Section: Setup and load shaders
  // =============================================================================
  /**
   * Ensures the mask buffers and blend shader exist for the current renderer.
   */
  load() {
    var n, r;
    Di();
    const t = !C.blendSourceFramebuffer || C.blendSourceFramebuffer.width !== N || C.blendSourceFramebuffer.height !== O || typeof C.blendSourceFramebuffer.pixelDensity == "function" && C.blendSourceFramebuffer.pixelDensity() !== $;
    Wi(C, Vi, ji), this.glMask = (n = J == null ? void 0 : J.ensureResources) == null ? void 0 : n.call(
      J,
      C,
      N,
      O,
      $
    );
    const e = ((r = tt == null ? void 0 : tt.ensureResources) == null ? void 0 : r.call(
      tt,
      C,
      N,
      O,
      $,
      Xe
    )) ?? {
      mask: null,
      ctx: null
    };
    t && (C.blendSourceFramebuffer = $i(
      C,
      C.blendSourceFramebuffer,
      N,
      O,
      $
    )), this.mask = e.mask, this.ctx = e.ctx, C.loaded = !0;
  },
  // =============================================================================
  // Section: Compositing
  // =============================================================================
  /**
   * Flushes pending mask work when the blend color changes or a frame ends.
   * @param {Color|false} [_color=false] - New blend color.
   * @param {boolean} [_isLast=false] - True when this is the final blend flush.
   */
  blend(t = !1, e = !1) {
    var a, c, l, h;
    Le();
    const n = this.isBrush === !0, r = n ? this.glMask : this.mask, i = n ? this.mask : this.glMask, s = t == null ? void 0 : t._array, o = !!s && (((a = this.cachedColor) == null ? void 0 : a[0]) !== s[0] || ((c = this.cachedColor) == null ? void 0 : c[1]) !== s[1] || ((l = this.cachedColor) == null ? void 0 : l[2]) !== s[2] || ((h = this.cachedColor) == null ? void 0 : h[3]) !== s[3]);
    !this.isBlending && s && (this.isBlending = !0, this.cachedColor = s, sr(), this.clearMask(this.glMask)), (e || o) && (this.justChanged && (this.applyShader(i, !n), this.justChanged = !1), this.isBlending && this.applyShader(r, n), s && (this.cachedColor = s), e && (this.isBlending = !1, this.cachedColor = null));
  },
  /**
   * Runs the blend shader over a mask and composites the result into the active renderer.
   * @param {object} mask - Mask buffer to composite.
   * @param {boolean} isBrushMask - True when compositing the GL brush mask.
   */
  applyShader(t, e) {
    if (!(t != null && t.isDrawn)) return;
    const n = this.getCompositeRect(t, e);
    if (!n) {
      this.clearMask(t);
      return;
    }
    C.drawingContext;
    const r = C.shaderProgram, i = Cn(), s = Hi({
      renderer: C,
      sourceTarget: i ?? C,
      sourceFramebuffer: C.blendSourceFramebuffer,
      dirtyRect: n,
      isFramebufferTarget: lr,
      Cwidth: N,
      Cheight: O,
      getTargetPixelSize: De,
      toScissorBox: hr,
      withScissor: In
    }), o = !!i, c = (e ? J : tt).getShaderMask(
      C,
      t,
      n,
      Fn,
      Xe
    );
    Gi({
      renderer: C,
      shader: r,
      source: s,
      mask: c,
      color: this.cachedColor,
      isBrushMask: e,
      Cwidth: N,
      Cheight: O,
      dirtyRect: n,
      targetIsFramebuffer: o,
      withScissor: In
    }), this.clearMask(t);
  }
}, qi = () => {
  Le(), M.blend(!1, !0), M.clearMask(M.glMask), M.clearMask(M.mask), M.justChanged = !1, M.isBlending = !1, M.isBrush = null, M.cachedColor = null;
}, Ye = (t = !1) => {
  Ii(t), C.loaded && M.load();
}, ur = /* @__PURE__ */ Math.sqrt(3), Ki = 0.5 * (ur - 1), Vt = (3 - ur) / 6, Dn = (t) => Math.floor(t) | 0, Ln = /* @__PURE__ */ new Float64Array([
  1,
  1,
  -1,
  1,
  1,
  -1,
  -1,
  -1,
  1,
  0,
  -1,
  0,
  1,
  0,
  -1,
  0,
  0,
  1,
  0,
  -1,
  0,
  1,
  0,
  -1
]);
function Me(t = Math.random) {
  const e = Zi(t), n = new Float64Array(e).map((i) => Ln[i % 12 * 2]), r = new Float64Array(e).map((i) => Ln[i % 12 * 2 + 1]);
  return function(s, o) {
    let a = 0, c = 0, l = 0;
    const h = (s + o) * Ki, u = Dn(s + h), f = Dn(o + h), m = (u + f) * Vt, g = u - m, _ = f - m, p = s - g, b = o - _;
    let w, R;
    p > b ? (w = 1, R = 0) : (w = 0, R = 1);
    const k = p - w + Vt, T = b - R + Vt, P = p - 1 + 2 * Vt, L = b - 1 + 2 * Vt, S = u & 255, I = f & 255;
    let D = 0.5 - p * p - b * b;
    if (D >= 0) {
      const U = S + e[I], Y = n[U], A = r[U];
      D *= D, a = D * D * (Y * p + A * b);
    }
    let F = 0.5 - k * k - T * T;
    if (F >= 0) {
      const U = S + w + e[I + R], Y = n[U], A = r[U];
      F *= F, c = F * F * (Y * k + A * T);
    }
    let z = 0.5 - P * P - L * L;
    if (z >= 0) {
      const U = S + 1 + e[I + 1], Y = n[U], A = r[U];
      z *= z, l = z * z * (Y * P + A * L);
    }
    return 70 * (a + c + l);
  };
}
function Zi(t) {
  const n = new Uint8Array(512);
  for (let r = 0; r < 512 / 2; r++)
    n[r] = r;
  for (let r = 0; r < 512 / 2 - 1; r++) {
    const i = r + ~~(t() * (256 - r)), s = n[r];
    n[r] = n[i], n[i] = s;
  }
  for (let r = 256; r < 512; r++)
    n[r] = n[r - 256];
  return n;
}
function Qi(t) {
  let e = 0;
  const n = String(t);
  for (let r = 0; r < n.length; r++)
    e = Math.imul(e ^ n.charCodeAt(r), 2654435769) | 0, e ^= e >>> 15;
  return e = Math.imul(e ^ e >>> 16, 2246822507) | 0, e = Math.imul(e ^ e >>> 13, 3266489909) | 0, (e ^ e >>> 16) >>> 0 || 1;
}
function ft(t) {
  let e = Qi(t);
  return () => {
    e = e + 1831565813 | 0;
    let n = Math.imul(e ^ e >>> 15, e | 1);
    return n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) * 23283064365386963e-26;
  };
}
let se = ft(Math.random()), fr = ft(Math.random() + ":2");
const dr = [], mr = (t) => dr.push(t), Ji = (t) => {
  se = ft(t), fr = ft(`${t}:2`), ge = !1;
  for (const e of dr)
    e();
};
Me(ft(Math.random()));
let rn = Me(ft(Math.random() + ":2"));
const ts = (t) => {
  Me(ft(t)), rn = Me(ft(`${t}:2`));
}, E = (t = 0, e = 1) => t + se() * (e - t), Ft = (t = 0, e = 1) => t + fr() * (e - t), gr = (t) => t[~~(se() * t.length)], yr = (t, e) => ~~E(t, e), W = (t, e) => ~~Ft(t, e);
let ge = !1, Bn = 0;
const zt = (t = 0, e = 1) => {
  if (ge)
    return ge = !1, Bn * e + t;
  const n = 1 - se(), r = se(), i = Math.sqrt(-2 * Math.log(n)), s = 360 * r;
  return Bn = i * V(s), ge = !0, i * K(s) * e + t;
}, nt = (t, e, n, r, i, s = !1) => {
  let o = r + (t - e) / (n - e) * (i - r);
  return s ? r < i ? oe(o, r, i) : oe(o, i, r) : o;
}, oe = (t, e, n) => Math.max(Math.min(t, n), e), Be = 1440, Nn = 2 * Math.PI / Be, yn = new Float32Array(Be), pn = new Float32Array(Be);
for (let t = 0; t < Be; t++)
  yn[t] = Math.cos(t * Nn), pn[t] = Math.sin(t * Nn);
const xn = (t) => t < 0 ? t >= -360 ? ~~((t + 360) * 4) : (t = t % 360, ~~((t < 0 ? t + 360 : t) * 4)) : t < 360 ? ~~(t * 4) : t < 720 ? ~~((t - 360) * 4) : t < 1080 ? ~~((t - 720) * 4) : (t = t % 360, ~~((t < 0 ? t + 360 : t) * 4)), K = (t) => yn[xn(t)], V = (t) => pn[xn(t)], We = new Float32Array(2), Re = (t) => {
  const e = xn(t);
  return We[0] = yn[e], We[1] = pn[e], We;
}, ye = (t, e = !1) => {
  if (e || mn()) {
    let n = t * 180 / Math.PI % 360;
    return n < 0 ? n + 360 : n;
  } else
    return t;
}, wn = (t, e = !1) => e || mn() ? t * 180 / Math.PI : t, es = (t, e, n, r, i) => {
  const s = Re(i), o = s[0], a = s[1], c = o * (n - t) + a * (r - e) + t, l = o * (r - e) - a * (n - t) + e;
  return { x: c, y: l };
}, Ct = (t, e, n, r) => Math.hypot(n - t, r - e), pe = (t, e, n, r) => ye(Math.atan2(-(r - e), n - t), !0), pr = (t, e, n, r, i = !1) => {
  const s = t.x, o = t.y, a = e.x, c = e.y, l = n.x, h = n.y, u = r.x, f = r.y, m = a - s, g = c - o, _ = u - l, p = f - h, b = p * m - _ * g;
  if (b === 0) return !1;
  const w = o - h, R = s - l, k = (_ * w - p * R) / b, T = (m * w - g * R) / b;
  return !i && (T < 0 || T > 1) ? !1 : { x: s + k * m, y: o + k * g };
};
let On = !1;
function dt() {
  On || (Le(), rs(), On = !0);
}
class Ne {
  /**
   * Constructs a new Position instance.
   * @param {number} x - The initial x-coordinate.
   * @param {number} y - The initial y-coordinate.
   */
  constructor(e, n) {
    dt();
    const r = Dt();
    this.mx = r.x, this.my = r.y, this.update(e, n), this.plotted = 0;
  }
  /**
   * Updates the position's coordinates and calculates its offsets and indices within the flow field.
   * @param {number} x - The new x-coordinate.
   * @param {number} y - The new y-coordinate.
   */
  update(e, n) {
    this.x = e, this.y = n, y.field.isActive && (this.colIdx = Math.round((e + this.mx - sn) / wt), this.rowIdx = Math.round((n + this.my - on) / wt));
  }
  /**
   * Resets the 'plotted' property to 0.
   */
  reset() {
    this.plotted = 0;
  }
  /**
   * Checks if the position is within the active flow field's bounds.
   * @returns {boolean} - True if the position is within the flow field, false otherwise.
   */
  isIn() {
    return y.field.isActive ? Ne.isIn(this.colIdx, this.rowIdx) : this.isInCanvas(this.x, this.y);
  }
  /**
   * Checks if the position is within the canvas bounds (with a margin).
   * @returns {boolean} - True if the position is within bounds, false otherwise.
   */
  isInCanvas() {
    const n = N, r = O, i = this.x + this.mx, s = this.y + this.my;
    return i >= -0.5 * n && i <= (1 + 0.5) * n && s >= -0.5 * r && s <= (1 + 0.5) * r;
  }
  /**
   * Calculates the angle of the flow field at the position's current coordinates.
   * @returns {number} - The internal flow angle in degrees, or 0 if the position is not in the field or if no field is active.
   */
  angle(e = !1) {
    return y.field.isActive && (e || this.isIn()) ? is()[this.colIdx][this.rowIdx] * y.field.wiggle : 0;
  }
  /**
   * Moves the position along the flow field by a certain length.
   * @param {number} _dir - The direction of movement, interpreted using the current runtime angle units.
   * @param {number} _length - The length to move along the field.
   * @param {number} _step_length - The length of each step.
   */
  moveTo(e, n, r = 1) {
    const i = wn(e);
    y.field.isActive ? this.movePos(i, n, r) : this._moveConstant(i, n, r);
  }
  /**
   * Internal variant of moveTo() that expects a degree value already normalized to the library's internal representation.
   */
  _moveToDegrees(e, n, r = 1) {
    y.field.isActive ? this.movePos(e, n, r) : this._moveConstant(e, n, r);
  }
  /**
   * Fast constant-direction movement (no field, no plot).
   * Precomputes trig once and applies dx/dy directly.
   */
  _moveConstant(e, n, r) {
    if (!this.isIn()) {
      this.plotted += r;
      return;
    }
    const i = n / r, s = Re(-e), o = r * s[0], a = r * s[1];
    for (let c = 0; c < i; c++)
      this.x += o, this.y += a, this.plotted += r;
  }
  /**
   * Plots a point to another position within the flow field, following a Plot object
   * @param {Position} _plot - The Plot path object.
   * @param {number} _length - The length to move towards the target position.
   * @param {number} _step_length - The length of each step.
   * @param {number} _scale - The scaling factor for the plotting path.
   */
  plotTo(e, n, r, i = 1, s = void 0) {
    this.movePos(e, n, r, i, s);
  }
  movePos(e, n, r, i = !1, s = void 0) {
    const o = i || 1;
    if (!this.isIn()) {
      this.plotted += r / o;
      return;
    }
    const a = n / r, c = y.field.isActive, l = !!i;
    for (let h = 0; h < a; h++) {
      const u = l && s !== void 0 && h === 0 ? s : l ? e.angle(this.plotted) : e, f = (c ? this.angle(!0) : 0) - u, m = Re(f);
      this.update(this.x + r * m[0], this.y + r * m[1]), this.plotted += r / o;
    }
  }
  // Static Methods
  /**
   * Gets the row index for a given y-coordinate.
   * @param {number} y - The y-coordinate.
   * @returns {number} - The row index.
   */
  static getRowIndex(e, n = 1) {
    const r = e + Dt().y - on;
    return Math.round(r / wt / n);
  }
  /**
   * Gets the column index for a given x-coordinate.
   * @param {number} x - The x-coordinate.
   * @returns {number} - The column index.
   */
  static getColIndex(e, n = 1) {
    const r = e + Dt().x - sn;
    return Math.round(r / wt / n);
  }
  /**
   * Checks if a column and row index are within the flow field bounds.
   * @param {number} col - The column index.
   * @param {number} row - The row index.
   * @returns {boolean} - True if the indices are within bounds, false otherwise.
   */
  static isIn(e, n) {
    return e >= 0 && n >= 0 && e < Ut && n < Xt;
  }
}
y.field = {
  isActive: !1,
  current: null,
  wiggle: 1
};
let Zt = /* @__PURE__ */ new Map(), wt, sn, on, Ut, Xt;
const ns = /* @__PURE__ */ new Set(["degrees", "radians"]);
function rs() {
  wt = N * 0.01, sn = -0.5 * N, on = -0.5 * O, Ut = Math.round(2 * N / wt), Xt = Math.round(2 * O / wt), us();
}
function is() {
  return Zt.get(y.field.current).field;
}
function ss(t = {}) {
  const n = (typeof t == "string" ? { angleMode: t } : t || {}).angleMode ?? "degrees";
  if (!ns.has(n))
    throw new Error(
      `Invalid field angle mode "${n}". Use "degrees" or "radians".`
    );
  return n;
}
function os(t, e) {
  if (e !== "radians") return t;
  for (let n = 0; n < t.length; n++)
    for (let r = 0; r < t[n].length; r++)
      t[n][r] = wn(t[n][r], !0);
  return t;
}
function as(t, e) {
  return os(t.gen(e, ls()), t.angleMode);
}
function ls() {
  return new Array(Ut).fill(null).map(() => new Float32Array(Xt));
}
function xr(t) {
  if (y.field.wiggle || (y.field.wiggle = 1), dt(), !Zt.has(t))
    throw new Error(
      `Field "${t}" does not exist. Available fields: ${Array.from(Zt.keys()).join(", ")}.`
    );
  y.field.isActive = !0, y.field.current = t;
  const e = Zt.get(t);
  e.field || (e.field = as(e, 0));
}
function cs() {
  dt(), y.field.isActive = !1;
}
function mt(t, e, n = {}) {
  Zt.set(t, {
    gen: e,
    field: null,
    angleMode: ss(n)
  });
}
function hs(t = 1) {
  xr("hand"), y.field.wiggle = t;
}
function Tt(t, e) {
  for (let n = 0; n < Ut; n++)
    for (let r = 0; r < Xt; r++) t[n][r] = e(n, r);
  return t;
}
function us() {
  mt("hand", (t, e) => {
    const n = Ft(0.2, 0.8), r = W(5, 10);
    return Tt(e, (i, s) => 0.2 * (0.5 * r * V(n * s * i + W(15, 25))) * K(t) + rn(i, s) * r * 0.7);
  }), mt("curved", (t, e) => {
    let n = W(-10, 10);
    return W(0, 100) % 2 == 0 && (n *= -1), Tt(
      e,
      (r, i) => 3 * nt(rn(r * 0.02 + t * 0.03, i * 0.02 + t * 0.03), 0, 1, -n, n)
    );
  }), mt("zigzag", (t, e) => {
    let n = W(-30, -15) + Math.abs(44 * V(t));
    W(0, 100) % 2 == 0 && (n *= -1);
    let r = n, i = 0;
    for (let s = 0; s < Ut; s++) {
      for (let o = 0; o < Xt; o++)
        e[s][o] = i, i += r, r *= -1;
      i += r, r *= -1;
    }
    return e;
  }), mt("waves", (t, e) => {
    const n = W(10, 15) + 5 * V(t), r = W(3, 6) + 3 * K(t), i = W(20, 35);
    return Tt(
      e,
      (s, o) => V(n * s) * i * K(o * r) + W(-3, 3)
    );
  }), mt("seabed", (t, e) => {
    const n = Ft(0.4, 0.8), r = W(18, 26);
    return Tt(
      e,
      (i, s) => 1.1 * r * V(n * s * i + W(15, 20)) * K(t)
    );
  }), mt("spiral", (t, e) => {
    const n = W(5, 10), r = W(0, 2) * 2 - 1, i = W(65, 80), s = Array.from({ length: n }, () => ({
      x: Ft(0.1, 0.9) * Ut,
      y: Ft(0.1, 0.9) * Xt
    }));
    return Tt(e, (o, a) => {
      let c = 0, l = 0;
      for (const h of s) {
        const u = o - h.x, f = a - h.y, m = 1 / (u * u + f * f + 1), g = Math.atan2(f, u) * (180 / Math.PI), _ = r * (g + i) * Math.PI / 180;
        c += m * Math.cos(_), l += m * Math.sin(_);
      }
      return Math.atan2(l, c) * (180 / Math.PI);
    });
  }), mt("columns", (t, e) => {
    const n = W(3, 8), r = W(25, 45);
    return Tt(e, (i, s) => V(i * n) * r);
  });
}
const wr = [];
function fs() {
  dt(), wr.push({
    fill: { ...y.fill },
    wash: y.wash ? { ...y.wash } : null,
    stroke: { ...y.stroke },
    hatch: { ...y.hatch },
    mass: y.mass ? { ...y.mass } : null,
    field: { ...y.field }
  });
}
function ds() {
  const t = wr.pop();
  t && (y.stroke = { ...t.stroke }, y.field = { ...t.field }, y.hatch = { ...t.hatch }, y.fill = { ...t.fill }, t.wash && (y.wash = { ...t.wash }), t.mass ? y.mass = { ...t.mass } : y.mass && (y.mass = {
    ...y.mass,
    isActive: !1,
    brush: null,
    color: null,
    options: {}
  }));
}
const gt = (t, e, n) => Math.max(e, Math.min(t, n)), ms = "radians";
let kt = null, gs = ms;
const an = [];
let St = {
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  x: 0,
  y: 0
};
function ys() {
  if (kt) return kt;
  if (typeof document < "u")
    return kt = document.createElement("canvas").getContext("2d"), kt;
  if (typeof OffscreenCanvas < "u")
    return kt = new OffscreenCanvas(1, 1).getContext("2d"), kt;
  throw new Error("Standalone color parsing requires CanvasRenderingContext2D support.");
}
function br(t, e) {
  return {
    a: t.a * e.a + t.c * e.b,
    b: t.b * e.a + t.d * e.b,
    c: t.a * e.c + t.c * e.d,
    d: t.b * e.c + t.d * e.d,
    x: t.a * e.x + t.c * e.y + t.x,
    y: t.b * e.x + t.d * e.y + t.y
  };
}
class ps {
  constructor(e, n, r) {
    if (e != null && e._array) {
      this.r = Math.round(e._array[0] * 255), this.g = Math.round(e._array[1] * 255), this.b = Math.round(e._array[2] * 255), this.hex = this.rgbToHex(this.r, this.g, this.b), this._array = [...e._array], this.gl = this._array;
      return;
    }
    if (typeof e == "string") {
      const i = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/i.exec(e);
      if (i) {
        this.r = gt(parseInt(i[1]), 0, 255), this.g = gt(parseInt(i[2]), 0, 255), this.b = gt(parseInt(i[3]), 0, 255), this.hex = this.rgbToHex(this.r, this.g, this.b);
        const o = i[4] !== void 0 ? gt(parseFloat(i[4]), 0, 1) : 1;
        this._array = [this.r / 255, this.g / 255, this.b / 255, o], this.gl = this._array;
        return;
      }
      this.hex = this.standardize(e);
      const s = this.hexToRgb(this.hex);
      this.r = s.r, this.g = s.g, this.b = s.b;
    } else
      this.r = gt(e ?? 0, 0, 255), this.g = gt(n ?? e ?? 0, 0, 255), this.b = gt(r ?? e ?? 0, 0, 255), this.hex = this.rgbToHex(this.r, this.g, this.b);
    this._array = [this.r / 255, this.g / 255, this.b / 255, 1], this.gl = this._array;
  }
  rgbToHex(e, n, r) {
    return `#${(1 << 24 | e << 16 | n << 8 | r).toString(16).slice(1)}`;
  }
  hexToRgb(e) {
    e = e.replace(
      /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
      (r, i, s, o) => i + i + s + s + o + o
    );
    const n = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);
    if (!n)
      throw new Error(`Invalid color value "${e}".`);
    return {
      r: parseInt(n[1], 16),
      g: parseInt(n[2], 16),
      b: parseInt(n[3], 16)
    };
  }
  standardize(e) {
    const n = ys();
    return n.fillStyle = e, n.fillStyle;
  }
  _getRed() {
    return this.r;
  }
  _getGreen() {
    return this.g;
  }
  _getBlue() {
    return this.b;
  }
}
function vr() {
  fs(), an.push({ ...St });
}
function _r() {
  an.length !== 0 && (St = an.pop(), ds());
}
function xs(t, e) {
  St = br(St, {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    x: t,
    y: e
  });
}
function ws(t, e = t) {
  St = br(St, {
    a: t,
    b: 0,
    c: 0,
    d: e,
    x: 0,
    y: 0
  });
}
function bs() {
  or({
    usesRadians: () => gs === "radians",
    fromDegrees: (t) => t * Math.PI / 180,
    createColor: (...t) => {
      var e;
      return t.length === 1 && ((e = t[0]) != null && e._array) ? t[0] : new ps(...t);
    },
    getAffineMatrix: () => St
  });
}
let ln = !1, $e = !1;
function vs() {
  $e || ($e = !0, ln = !0, requestAnimationFrame(() => {
    $e = !1, ln && console.warn(
      "[p5.brush] Drawing calls were made but brush.render() was never called. Call brush.render() after your drawing code to flush to the canvas."
    );
  }));
}
or({ notifyDraw: vs });
function _s() {
  M.glMask && M.clearMask(M.glMask), M.mask && M.clearMask(M.mask), M.justChanged = !1, M.isBlending = !1, M.isBrush = null, M.cachedColor = null;
}
function Ms() {
  ln = !1, qi();
}
function Rs(...t) {
  gn(), _s();
  const e = C.drawingContext, n = t.length === 0 ? [1, 1, 1, 0] : [...ie(...t)._array.slice(0, 3), 1];
  e.bindFramebuffer(e.FRAMEBUFFER, null), e.disable(e.SCISSOR_TEST), e.clearColor(n[0], n[1], n[2], n[3]), e.clear(e.COLOR_BUFFER_BIT | e.DEPTH_BUFFER_BIT);
}
let Mr = null, it = null, Rr = !1, cn = 1, Sr = 0, Er = 0;
function Ss(t) {
  return typeof HTMLCanvasElement < "u" && t instanceof HTMLCanvasElement;
}
function Es(t) {
  return typeof OffscreenCanvas < "u" && t instanceof OffscreenCanvas;
}
function As(t) {
  return Ss(t) || Es(t);
}
function Ts(t) {
  return t.getContext("webgl2", { premultipliedAlpha: !0, preserveDrawingBuffer: !0 }) ?? t.getContext("webgl2", { preserveDrawingBuffer: !0 });
}
function ks(t, e, n, r) {
  const i = Ts(t);
  if (!i)
    throw new Error("brush.load(target) requires a canvas with a WebGL2 context.");
  const s = {
    canvas: t,
    drawingContext: i,
    width: e,
    height: n,
    density: r,
    pixelDensity: () => s.density
  };
  return s;
}
function Ps(t, e, n, r) {
  Mr = t, Sr = e, Er = n, cn = r, (it == null ? void 0 : it.canvas) !== t ? it = ks(t, e, n, r) : (it.width = e, it.height = n, it.density = r), ar({
    Renderer: it,
    Cwidth: e,
    Cheight: n,
    Density: r
  }), Rr = !0;
}
function Cs(t = Mr) {
  if (!As(t))
    throw new Error(
      "Standalone brush.load(target) requires an HTMLCanvasElement or OffscreenCanvas."
    );
  Ps(t, t.width, t.height, 1);
}
function Fs() {
  return ar({
    Cwidth: Sr,
    Cheight: Er,
    Density: cn
  }), cn;
}
function Is() {
  if (!Rr)
    throw new Error(
      "No standalone target loaded. Call brush.load(canvasOrOffscreenCanvas) first."
    );
}
function Ds() {
}
function Ls() {
}
function Bs() {
}
function Ns() {
  return null;
}
function Os() {
  var t;
  return ((t = arguments[0]) == null ? void 0 : t.__brushFramebuffer) === !0;
}
function zs() {
  Fi({
    load: Cs,
    syncDensity: Fs,
    isCanvasReady: Is,
    instance: Ds,
    activateInstance: Ls,
    deactivateInstance: Bs,
    getActiveFramebuffer: Ns,
    isFramebufferTarget: Os
  });
}
class me {
  /**
   * Constructs the Polygon object from an array of points.
   * @param {Array} pointsArray - An array of points, where each point is an array of two numbers [x, y].
   * @param {boolean} [useRawVertices=false] - If true, uses the raw array as vertices.
   */
  constructor(e, n = !1) {
    this.a = e, this.vertices = n ? e : e.map(([r, i]) => ({ x: r, y: i })), this.sides = this.vertices.map((r, i, s) => [
      r,
      s[(i + 1) % s.length]
    ]), this._intersectionCache = {};
  }
  /**
   * Intersects a given line with the polygon, returning all intersection points.
   * @param {Object} line - The line to intersect with the polygon, having two properties 'point1' and 'point2'.
   * @returns {Array} An array of intersection points (each with 'x' and 'y' properties) or an empty array if no intersections.
   */
  intersect(e) {
    const n = `${e.point1.x},${e.point1.y}-${e.point2.x},${e.point2.y}`;
    if (this._intersectionCache[n])
      return this._intersectionCache[n];
    const r = [], i = this.sides, s = i.length;
    for (let o = 0; o < s; o++) {
      const a = pr(e.point1, e.point2, i[o][0], i[o][1]);
      a && r.push(a);
    }
    return this._intersectionCache[n] = r, r;
  }
  /**
   * Displays the polygon with optional stroke, hatch, and fill effects.
   */
  show() {
    y.wash && this.wash(), y.fill && this.fill(), y.mass && this.mass(), y.hatch && this.hatch(), y.stroke && this.draw();
  }
}
class Oe {
  /**
   * Creates a new Plot.
   * @param {string} _type - The type of plot, "curve" or "segments".
   */
  constructor(e) {
    this.segments = [], this.angles = [], this.pres = [], this.type = e, this.dir = 0, this._cumLen = [], this.length = 0, this.index = 0, this.suma = 0, this.pol = !1;
  }
  /**
   * Adds a segment to the plot with specified angle, length, and pressure.
   * @param {number} _a - The angle of the segment.
   * @param {number} _length - The length of the segment.
   * @param {number} _pres - The pressure of the segment.
   * @param {boolean} _degrees - Whether the angle is in degrees.
   */
  addSegment(e = 0, n = 0, r = 1, i = !1) {
    this.angles.length > 0 && this.angles.pop(), e = i ? (e % 360 + 360) % 360 : ye(e), this.angles.push(e, e), this.pres.push(r), this._cumLen.push(this.length), this.segments.push(n), this.length += n;
  }
  /**
   * Finalizes the plot by setting the last angle and pressure.
   * @param {number} _a - The final angle.
   * @param {number} _pres - The final pressure.
   * @param {boolean} _degrees - Whether the angle is in degrees.
   */
  endPlot(e = 0, n = 1, r = !1) {
    e = r ? (e % 360 + 360) % 360 : ye(e), this.angles[this.angles.length - 1] = e, this.pres.push(n);
  }
  /**
   * Rotates the entire plot by a given angle.
   * @param {number} _a - The angle to rotate the plot.
   */
  rotate(e) {
    this.dir = ye(e);
  }
  /**
   * Calculates the pressure at a given distance along the plot.
   * Inlined for performance — pressure values never need angle wrap-around.
   * NOTE: relies on this.index / this.suma being set by a prior angle() call.
   * @param {number} _d - The distance along the plot.
   * @returns {number} - The interpolated pressure.
   */
  pressure(e) {
    if (e > this.length) return this.pres[this.pres.length - 1];
    const n = this.pres[this.index], r = this.pres[this.index + 1], i = this.segments[this.index];
    return i === 0 ? n : n + (e - this.suma) / i * (r - n);
  }
  /**
   * Calculates the angle at a given distance along the plot.
   * @param {number} _d - The distance along the plot.
   * @returns {number} - The calculated angle.
   */
  angle(e) {
    if (e > this.length) return this.angles[this.angles.length - 1];
    if (this.calcIndex(e), this.type !== "curve") return this.angles[this.index] + this.dir;
    let n = this.angles[this.index], r = this.angles[this.index + 1];
    Math.abs(r - n) > 180 && (r > n ? r = -(360 - r) : n = -(360 - n));
    const i = this.segments[this.index], s = i === 0 ? 0 : (e - this.suma) / i;
    return n + s * (r - n) + this.dir;
  }
  /**
   * Calculates the current index of the plot based on the distance.
   * Uses sequential forward scan from the cached index (O(1) amortized for
   * monotone access patterns) with binary search fallback for backward jumps.
   * @param {number} _d - The distance along the plot.
   */
  calcIndex(e) {
    const n = this._cumLen, r = n.length;
    if (r === 0)
      return this.index = 0, this.suma = 0, 0;
    let i = this.index < r ? this.index : r - 1;
    for (; i + 1 < r && n[i + 1] <= e; ) i++;
    if (n[i] > e) {
      let s = 0, o = i - 1;
      for (; s < o; ) {
        const a = s + o + 1 >> 1;
        n[a] <= e ? s = a : o = a - 1;
      }
      i = s;
    }
    return this.index = i, this.suma = n[i], i;
  }
  /**
   * Generates a polygon based on the plot.
   * @param {number} _x - The x-coordinate for the starting point.
   * @param {number} _y - The y-coordinate for the starting point.
   * @param {number} _scale - The scale factor for the polygon.
   * @param {number} _side - The side factor for the polygon.
   * @returns {Polygon} - The generated polygon.
   */
  genPol(e, n, r = 1, i) {
    dt();
    const s = i < 0 ? 4 : 1, o = [], a = Math.round(this.length / s), c = new Ne(e + N / 2, n + O / 2);
    let l = 0, h = 0;
    for (let u = 0; u < a; u++) {
      c.plotTo(this, s, s);
      const f = this.index;
      l += s;
      let m = i <= 0 ? 8 : Math.max(this.segments[f] * i * Ft(0.7, 1.3), 20);
      (l >= m || f >= h) && c.x && (o.push([c.x - N / 2, c.y - O / 2]), l = 0, f >= h && h++);
    }
    return new me(o);
  }
  /**
   * Displays the plot with optional stroke, hatch, and fill effects.
   * @param {number} x - The x-coordinate.
   * @param {number} y - The y-coordinate.
   * @param {number} scale - The scale factor.
   */
  show(e, n, r = 1) {
    y.wash && this.wash(e, n, r), y.fill && this.fill(e, n, r), y.mass && this.mass(e, n, r), y.hatch && this.hatch(e, n, r), y.stroke && this.draw(e, n, r);
  }
}
function zn(t) {
  const e = new me(t);
  return e.show(), e;
}
function Us(t, e = 0.5) {
  if (!t || t.length < 2)
    throw new Error(
      "spline() requires at least 2 points. Each point should be [x, y, pressure]."
    );
  let n = Xs(t, e);
  return n.show(), n;
}
function Xs(t, e = 0.5, n = !1) {
  const r = e === 0 ? "segments" : "curve", i = new Oe(r), s = Math.PI * 2;
  if (n && e !== 0 && t.push(t[1]), t && t.length > 0) {
    let o = 0, a, c, l;
    for (let h = 0; h < t.length - 1; h++)
      if (e > 0 && h < t.length - 2) {
        const u = t[h], f = t[h + 1], m = t[h + 2], g = Ct(u[0], u[1], f[0], f[1]), _ = Ct(f[0], f[1], m[0], m[1]), p = pe(u[0], u[1], f[0], f[1]), b = pe(f[0], f[1], m[0], m[1]), w = e * Math.min(g, _, 0.5 * Math.min(g, _)), R = Math.max(g, _), k = g - w, T = _ - w;
        if (Math.floor(p) === Math.floor(b)) {
          const P = n && h === 0 ? 0 : g - o, L = n ? h === 0 ? 0 : _ - l : _;
          i.addSegment(p, P, u[2], !0), h === t.length - 3 && i.addSegment(b, L, f[2], !0), o = 0, h === 0 && (a = g, l = w, c = t[1], o = 0);
        } else {
          const P = {
            x: f[0] - w * K(-p),
            y: f[1] - w * V(-p)
          }, L = {
            x: P.x + R * K(-p + 90),
            y: P.y + R * V(-p + 90)
          }, S = {
            x: f[0] + w * K(-b),
            y: f[1] + w * V(-b)
          }, I = {
            x: S.x + R * K(-b + 90),
            y: S.y + R * V(-b + 90)
          }, D = pr(P, L, S, I, !0), F = Ct(P.x, P.y, D.x, D.y), z = Ct(P.x, P.y, S.x, S.y) / 2, U = 2 * Math.asin(z / F) * (180 / Math.PI), Y = s * F * U / 360, A = n && h === 0 ? 0 : k - o, B = h === t.length - 3 ? n ? a - w : T : 0;
          i.addSegment(p, A, u[2], !0), i.addSegment(p, isNaN(Y) ? 0 : Y, u[2], !0), i.addSegment(b, B, f[2], !0), o = w, h === 0 && (a = k, l = w, c = [P.x, P.y]);
        }
        h === t.length - 3 && i.endPlot(b, f[2], !0);
      } else if (e === 0) {
        const u = t[h], f = t[h + 1], m = Ct(u[0], u[1], f[0], f[1]), g = pe(u[0], u[1], f[0], f[1]);
        i.addSegment(g, m, f[2], !0), h === t.length - 2 && i.endPlot(g, 1, !0);
      }
    i.origin = n && e !== 0 ? c : t[0];
  }
  return i;
}
let Se = {
  createTipSurface: () => {
    throw new Error("No stroke runtime adapter registered.");
  },
  loadImageTip: () => {
    throw new Error("No stroke runtime adapter registered.");
  }
};
function Ys(t) {
  Se = { ...Se, ...t };
}
const Ws = (t, e) => Se.createTipSurface(t, e), $s = (t, e) => Se.loadImageTip(t, e);
let Un = !1;
const Gs = 2;
function Hs(t, e, n, r) {
  return !t.glMask || t.glMask.width !== e || t.glMask.height !== n || typeof t.glMask.pixelDensity == "function" && t.glMask.pixelDensity() !== r;
}
function Vs(t, e, n, r) {
  var i, s, o;
  return Hs(t, e, n, r) && ((i = t.glMask) != null && i.remove && t.glMask.remove(), t.glMask = cr(t, {
    width: e,
    height: n,
    density: r,
    antialias: !1,
    depth: !1,
    stencil: !1
  })), (s = t.glMask).dirtyRect ?? (s.dirtyRect = null), (o = t.glMask).isDrawn ?? (o.isDrawn = !1), t.glMask;
}
function js(t, e) {
  t && (e(t), t.isDrawn = !1, t.dirtyRect = null);
}
function qs(t, e, n, r, i) {
  return t ? !t.dirtyRect || e() ? n() : i(
    r(t.dirtyRect, Gs)
  ) : null;
}
function Ks(t, e) {
  return e;
}
function Zs() {
  Un || (ze == null || ze({
    ensureResources: Vs,
    clearMask: js,
    getCompositeRect: qs,
    getShaderMask: Ks
  }), Un = !0);
}
const hn = (t, e, n) => {
  const r = t.createProgram();
  for (let [i, s] of [
    [t.VERTEX_SHADER, e],
    [t.FRAGMENT_SHADER, n]
  ]) {
    const o = t.createShader(i);
    t.shaderSource(o, s), t.compileShader(o), t.attachShader(r, o);
  }
  return t.linkProgram(r), r;
};
let ae = {
  beginDirectMaskDraw: () => {
    throw new Error("No renderer runtime adapter registered.");
  },
  endDirectMaskDraw: () => {
    throw new Error("No renderer runtime adapter registered.");
  },
  resetDirectShaderTracking: () => {
  }
};
function Qs(t) {
  ae = { ...ae, ...t };
}
const Js = (t, e, n) => ae.beginDirectMaskDraw(t, e, n), to = (t, e, n) => ae.endDirectMaskDraw(t, e, n), Ar = (t, e) => ae.resetDirectShaderTracking(t, e), eo = `#version 300 es
in vec2 a_position;
in float a_radius;
in float a_alpha;
uniform mat4 u_matrix;
out float v_alpha;
void main() {
gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
v_alpha = a_alpha;
gl_PointSize = a_radius * 2.0;
}`, no = `#version 300 es
precision highp float;
in float v_alpha;
out vec4 outColor;
uniform vec4 u_color;
void main() {
vec2 v = gl_PointCoord - vec2(0.5);
float f = length(v);
float a = fwidth(f);
f = 1.0 - smoothstep(0.5 - a, 0.5 + a, f);
if (f < 0.01) {
discard;
}
outColor = vec4(u_color.xyz, v_alpha * f);
}`, ro = `#version 300 es
in vec2 a_corner;
in vec2  a_pos;
in float a_size;
in float a_angle;
in float a_alpha;
uniform mat4 u_proj;
uniform float u_uvScale;
out vec2  v_uv;
out float v_alpha;
void main() {
float c = cos(a_angle);
float s = sin(a_angle);
vec2 rotated = vec2(
c * a_corner.x - s * a_corner.y,
s * a_corner.x + c * a_corner.y
);
gl_Position = u_proj * vec4(a_pos + rotated * a_size, 0.0, 1.0);
v_uv    = a_corner * (0.5 * u_uvScale) + 0.5;
v_alpha = a_alpha;
}`, io = `#version 300 es
precision highp float;
in vec2  v_uv;
in float v_alpha;
uniform sampler2D u_tex;
uniform vec4      u_color;
out vec4 outColor;
void main() {
float inkAlpha = texture(u_tex, v_uv).a;
if (inkAlpha < 0.01) discard;
outColor = vec4(u_color.rgb, inkAlpha * v_alpha);
}`;
let Xn = !1, d, Tr, Lt, Bt, ct, Yn = 0, Wn = 0, Q = null;
const yt = {}, un = {};
let Qt = 1, Jt = 0, bn = 0, vn = 1, _n = 0, Mn = 0, le = 0, ce = 0, Ee = 1, ht = 1;
function so() {
  const t = Dt();
  Qt = t.a, Jt = t.b, bn = t.c, vn = t.d, _n = t.x, Mn = t.y, le = N / 2, ce = O / 2, Ee = Math.sqrt(Qt * Qt + Jt * Jt), ht = $;
}
const Rn = 2048;
let q = new Float32Array(Rn * 4), at = 0, Ge = Rn, Ae = Rn * 4 * 4, te = null, vt = null, Nt = null, ee = null, Ot = null;
const H = {}, Kt = {};
let Te = 0;
const Yt = 5, kr = 256;
let j = new Float32Array(kr * Yt), lt = 0, He = kr, ne = null;
const _t = /* @__PURE__ */ new Map(), oo = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
function ao() {
  const t = C == null ? void 0 : C.glMask;
  return t ? (Q = t, Q.dirtyRect ?? (Q.dirtyRect = null), Q.isDrawn ?? (Q.isDrawn = !1), M.glMask = Q, Q) : null;
}
function Pr() {
  return Tr;
}
function Cr() {
  return Js(C, d, M.glMask);
}
function Fr(t) {
  to(C, d, t);
}
function Ir(t, e, n, r, i) {
  return t ? (e < t.minX && (t.minX = e), n < t.minY && (t.minY = n), r > t.maxX && (t.maxX = r), i > t.maxY && (t.maxY = i), t) : { minX: e, minY: n, maxX: r, maxY: i };
}
function lo() {
  var t;
  if (!d || (t = d.isContextLost) != null && t.call(d)) {
    _t.clear();
    return;
  }
  for (const e of _t.values()) d.deleteTexture(e);
  _t.clear(), ct && d.deleteProgram(ct), Lt && d.deleteVertexArray(Lt), Bt && d.deleteBuffer(Bt), vt && d.deleteProgram(vt), Nt && d.deleteVertexArray(Nt), ee && d.deleteBuffer(ee), Ot && d.deleteBuffer(Ot), ct = Lt = Bt = null, vt = Nt = ee = Ot = null, Ae = 0, Te = 0;
}
function co() {
  Le(), ao();
  const t = C.drawingContext, e = !Xn || d !== t;
  if ((e || Yn !== N || Wn !== O) && (Tr = new Float32Array([
    2 / N,
    0,
    0,
    0,
    0,
    2 / O,
    0,
    0,
    0,
    0,
    1,
    0,
    -1,
    -1,
    0,
    1
  ]), Yn = N, Wn = O), !e) return;
  lo(), d = t, ct = hn(d, eo, no), d.useProgram(ct), d.enable(d.BLEND), d.blendFunc(d.ONE_MINUS_DST_ALPHA, d.ONE), ["a_position", "a_radius", "a_alpha"].forEach(
    (s) => yt[s] = d.getAttribLocation(ct, s)
  ), ["u_matrix", "u_color"].forEach(
    (s) => un[s] = d.getUniformLocation(ct, s)
  ), Lt = d.createVertexArray(), d.bindVertexArray(Lt), Bt = d.createBuffer(), d.bindBuffer(d.ARRAY_BUFFER, Bt), d.bufferData(d.ARRAY_BUFFER, q.byteLength, d.DYNAMIC_DRAW), Ae = q.byteLength;
  const r = 16;
  d.enableVertexAttribArray(yt.a_position), d.vertexAttribPointer(yt.a_position, 2, d.FLOAT, !1, r, 0), d.enableVertexAttribArray(yt.a_radius), d.vertexAttribPointer(yt.a_radius, 1, d.FLOAT, !1, r, 8), d.enableVertexAttribArray(yt.a_alpha), d.vertexAttribPointer(yt.a_alpha, 1, d.FLOAT, !1, r, 12), d.bindVertexArray(null), vt = hn(d, ro, io), ["a_corner", "a_pos", "a_size", "a_angle", "a_alpha"].forEach(
    (s) => H[s] = d.getAttribLocation(vt, s)
  ), ["u_proj", "u_color", "u_tex", "u_uvScale"].forEach(
    (s) => Kt[s] = d.getUniformLocation(vt, s)
  ), Nt = d.createVertexArray(), d.bindVertexArray(Nt), ee = d.createBuffer(), d.bindBuffer(d.ARRAY_BUFFER, ee), d.bufferData(d.ARRAY_BUFFER, oo, d.STATIC_DRAW), d.enableVertexAttribArray(H.a_corner), d.vertexAttribPointer(H.a_corner, 2, d.FLOAT, !1, 0, 0), Ot = d.createBuffer(), d.bindBuffer(d.ARRAY_BUFFER, Ot), d.bufferData(d.ARRAY_BUFFER, j.byteLength, d.DYNAMIC_DRAW), Te = j.byteLength;
  const i = Yt * 4;
  d.enableVertexAttribArray(H.a_pos), d.vertexAttribPointer(H.a_pos, 2, d.FLOAT, !1, i, 0), d.vertexAttribDivisor(H.a_pos, 1), d.enableVertexAttribArray(H.a_size), d.vertexAttribPointer(H.a_size, 1, d.FLOAT, !1, i, 8), d.vertexAttribDivisor(H.a_size, 1), d.enableVertexAttribArray(H.a_angle), d.vertexAttribPointer(H.a_angle, 1, d.FLOAT, !1, i, 12), d.vertexAttribDivisor(H.a_angle, 1), d.enableVertexAttribArray(H.a_alpha), d.vertexAttribPointer(H.a_alpha, 1, d.FLOAT, !1, i, 16), d.vertexAttribDivisor(H.a_alpha, 1), d.bindVertexArray(null), Xn = !0;
}
function Sn(t, e, n, r) {
  if (at >= Ge) {
    Ge *= 2;
    const f = new Float32Array(Ge * 4);
    f.set(q), q = f;
  }
  const i = t - le, s = e - ce, o = at * 4, a = Qt * i + bn * s + _n + le, c = Jt * i + vn * s + Mn + ce, l = ht * n * Ee / 2;
  q[o] = a, q[o + 1] = c, q[o + 2] = l, q[o + 3] = r / 255;
  const h = a * ht, u = c * ht;
  te = Ir(
    te,
    h - l - 1,
    u - l - 1,
    h + l + 1,
    u + l + 1
  ), at++;
}
function ho(t, e, n, r, i, s = 0) {
  if (lt >= He) {
    He *= 2;
    const p = new Float32Array(He * Yt);
    p.set(j), j = p;
  }
  const o = t - le, a = e - ce, c = Qt * o + bn * a + _n + le, l = Jt * o + vn * a + Mn + ce, h = ht * n * Ee / 2, u = ht * s * Ee, f = lt * Yt;
  j[f] = c, j[f + 1] = l, j[f + 2] = h, j[f + 3] = r, j[f + 4] = i / 255;
  const m = c * ht, g = l * ht, _ = h * 1.42 + u;
  ne = Ir(
    ne,
    m - _ - 1,
    g - _ - 1,
    m + _ + 1,
    g + _ + 1
  ), lt++;
}
function $n(t, e) {
  if (lt === 0) return;
  M.glMask.isDrawn = !0;
  const n = Cr();
  let r = _t.get(e);
  r || (r = d.createTexture(), d.bindTexture(d.TEXTURE_2D, r), d.texImage2D(d.TEXTURE_2D, 0, d.RGBA, d.RGBA, d.UNSIGNED_BYTE, t.canvas), d.generateMipmap(d.TEXTURE_2D), d.texParameteri(d.TEXTURE_2D, d.TEXTURE_MIN_FILTER, d.LINEAR_MIPMAP_LINEAR), d.texParameteri(d.TEXTURE_2D, d.TEXTURE_MAG_FILTER, d.LINEAR), d.texParameteri(d.TEXTURE_2D, d.TEXTURE_WRAP_S, d.CLAMP_TO_EDGE), d.texParameteri(d.TEXTURE_2D, d.TEXTURE_WRAP_T, d.CLAMP_TO_EDGE), _t.set(e, r)), d.useProgram(vt), d.enable(d.BLEND), d.blendFunc(d.ONE_MINUS_DST_ALPHA, d.ONE), d.activeTexture(d.TEXTURE0), d.bindTexture(d.TEXTURE_2D, r), d.uniform1i(Kt.u_tex, 0), d.uniform1f(Kt.u_uvScale, t.uvFit ?? 1);
  const i = y.stroke.color._array;
  d.uniform4f(Kt.u_color, ...i), d.uniformMatrix4fv(Kt.u_proj, !1, Pr()), d.bindVertexArray(Nt), d.bindBuffer(d.ARRAY_BUFFER, Ot);
  const s = lt * Yt * 4, o = j.subarray(0, lt * Yt);
  s > Te ? (d.bufferData(d.ARRAY_BUFFER, j, d.DYNAMIC_DRAW), Te = j.byteLength) : d.bufferSubData(d.ARRAY_BUFFER, 0, o), d.drawArraysInstanced(d.TRIANGLE_STRIP, 0, 4, lt), d.bindVertexArray(null), d.bindTexture(d.TEXTURE_2D, null), Fr(n), ne && (M.markDirtyRect(M.glMask, ne), ne = null), lt = 0, Ar(C, d);
}
function uo(t) {
  const e = _t.get(t);
  e && d && d.deleteTexture(e), _t.delete(t);
}
function fo() {
  if (at === 0) return;
  M.glMask.isDrawn = !0;
  const t = Cr(), e = y.stroke.color._array;
  d.useProgram(ct), d.enable(d.BLEND), d.blendFunc(d.ONE_MINUS_DST_ALPHA, d.ONE), d.bindVertexArray(Lt), d.bindBuffer(d.ARRAY_BUFFER, Bt);
  const n = at * 16, r = q.subarray(0, at * 4);
  n > Ae ? (d.bufferData(d.ARRAY_BUFFER, q, d.DYNAMIC_DRAW), Ae = q.byteLength) : d.bufferSubData(d.ARRAY_BUFFER, 0, r), d.uniform4f(un.u_color, ...e), d.uniformMatrix4fv(un.u_matrix, !1, Pr()), d.drawArrays(d.POINTS, 0, at), d.bindVertexArray(null), Fr(t), te && (M.markDirtyRect(M.glMask, te), te = null), at = 0, Ar(C, d);
}
Zs();
y.stroke = {
  color: null,
  weight: 1,
  type: "HB",
  isActive: !1,
  opacity: 1
};
let Mt = /* @__PURE__ */ new Map();
const xe = {
  offset: 0.08,
  scale: 0.08,
  warp: 0.06,
  tilt: 0.06
};
function En() {
  return { ...y.stroke };
}
function Dr(t) {
  y.stroke = { ...t };
}
function mo(t) {
  if (!t) return t;
  if (typeof t == "function")
    return {
      type: "custom",
      min_max: [0, 1],
      curve: t,
      variation: { ...xe }
    };
  if (typeof t == "object" && !Array.isArray(t)) {
    if (t.type === "custom" || t.mode === "custom") {
      const { mode: e, ...n } = t;
      return {
        ...n,
        type: "custom",
        variation: {
          ...xe,
          ...n.variation ?? {}
        }
      };
    }
    return t.type === "gaussian" || t.mode === "gaussian" || Array.isArray(t.curve) && Array.isArray(t.min_max) ? {
      ...t,
      type: "gaussian",
      curve: t.curve,
      min_max: t.min_max
    } : t;
  }
  if (Array.isArray(t)) {
    const [e, n, r] = t.length === 2 ? [t[0], (t[0] + t[1]) / 2, t[1]] : t, i = Math.min(e, n, r), s = Math.max(e, n, r), o = s - i || 1, [a, c, l] = [
      (e - i) / o,
      (n - i) / o,
      (r - i) / o
    ];
    return {
      type: "custom",
      min_max: [i, s],
      variation: { ...xe },
      curve: (h) => h < 0.5 ? a + (c - a) * h * 2 : c + (l - c) * (h - 0.5) * 2
    };
  }
}
function Lr(t, e) {
  const n = ["marker", "custom", "image", "spray"];
  if (e.type = n.includes(e.type) ? e.type : "default", e.markerTip === void 0 && (e.markerTip = !0), e.noise === void 0 && (e.noise = 0.3), e.noise = Math.max(0, Math.min(1, e.noise)), e.vibration !== void 0 && e.scatter === void 0 && (e.scatter = e.vibration), e.definition !== void 0 && e.sharpness === void 0 && (e.sharpness = e.definition), e.quality !== void 0 && e.grain === void 0 && (e.grain = e.quality), e.pressure = mo(e.pressure) ?? {
    // Neutral default so brushes registered without a pressure param work.
    type: "gaussian",
    curve: [0.35, 0.25],
    min_max: [1, 1]
  }, e.type === "custom") {
    if (typeof e.tip != "function")
      throw new Error(`Brush "${t}" is type "custom" but is missing a tip function.`);
    const r = `custom::${t}`;
    uo(r);
    const i = Ws(500, 500);
    i.pixelDensity(1), i.background(255), i.noSmooth(), i.push(), i.translate(250, 250), i.scale(5), i.noStroke(), i.fill(0), e.tip(i), i.pop(), bt.imageToWhite(i), bt.tips.set(r, i), e.tipKey = r, Mt.set(t, { param: e, colors: [], buffers: [] });
    return;
  }
  if (e.type === "image") {
    if (!e.image || !e.image.src)
      throw new Error(
        `Brush "${t}" is type "image" but is missing params.image.src. Example: image: { src: "./tip.jpg" }`
      );
    return bt.add(e.image.src), Mt.set(t, { param: e, colors: [], buffers: [] }), bt.load();
  }
  Mt.set(t, { param: e, colors: [], buffers: [] });
}
function go() {
  return [...Mt.keys()];
}
function Br(t) {
  if (!Mt.has(t))
    throw new Error(
      `Brush "${t}" not found. Available brushes: ${[...Mt.keys()].join(", ")}.`
    );
  y.stroke.type = t;
}
function Nr(t, e, n) {
  gn(), y.stroke.color = ie(...arguments), y.stroke.isActive = !0;
}
function Or(t) {
  y.stroke.weight = t;
}
function zr(t, e, n = 1) {
  Br(t), Nr(e), Or(n);
}
function Gn() {
  y.stroke.isActive = !1;
}
let G, he, Z, ke, Pe = 0;
const x = {};
function Ur(t, e, n, r = !1) {
  so(), G = new Ne(t + N / 2, e + O / 2), he = n, Z = r, Z && Z.calcIndex(0);
}
const ue = [];
mr(() => {
  ue.length = 0;
});
function Xr(t, e) {
  e || (ke = t), yo();
  const n = vo(), r = Math.round(
    he * (e ? t : 1) / n
  );
  x.pressureCount = 10, x.cachedPressure = void 0;
  const i = r * 2;
  for (; ue.length < i; )
    ue.push(zt());
  for (let s = 0; s < r; s++)
    e && (Pe = Z.angle(G.plotted)), xo(), e ? G.plotTo(Z, n, n, t, Pe) : G._moveToDegrees(t, n, n);
  po();
}
function yo() {
  x.seed = E() * 999999;
  const { param: t } = Mt.get(y.stroke.type) ?? {};
  if (!t) return;
  x.p = t;
  const { pressure: e } = t;
  if (x.isCustomPressure = e.type === "custom", x.a = x.isCustomPressure ? 0 : E(-1, 1), x.b = x.isCustomPressure ? 0 : E(1, 1.5), !x.isCustomPressure)
    x.cp = E(3, 3.5), x.ct = 0, x.cs = 1, x.ck = 0;
  else {
    const s = e.variation ?? xe;
    x.cp = E(-s.offset, s.offset), x.ct = E(-s.warp, s.warp), x.cs = E(1 - s.scale, 1 + s.scale), x.ck = E(-s.tilt, s.tilt);
  }
  [x.min, x.max] = e.min_max, Z || (x.cos = K(ke), x.sin = V(ke)), co();
  const n = M.isBrush !== !0;
  M.isBrush = !0, n && (M.justChanged = !0), M.blend(y.stroke.color);
  const r = bo(), i = 0.1 * (x.p.noise ?? 0);
  x.alpha = i > 0 ? Math.max(0, r * (1 + zt(0, i))) : r, x.overscan = _o(), x.drawFn = x.p.type === "spray" ? Mo : x.p.type === "marker" ? Wr : x.p.type === "custom" || x.p.type === "image" ? $r : Ro, Gr();
}
function po() {
  var e;
  Gr(), fo();
  const t = (e = x.p) == null ? void 0 : e.type;
  t === "image" ? $n(bt.tips.get(x.p.image.src), x.p.image.src) : t === "custom" && $n(bt.tips.get(x.p.tipKey), x.p.tipKey);
}
function xo() {
  const t = Yr();
  x.drawFn(t);
}
function Yr() {
  return (x.pressureCount >= 10 || x.cachedPressure === void 0) && (x.cachedPressure = Z ? Hn() * Z.pressure(G.plotted) : Hn(), x.pressureCount = 0), x.pressureCount++, x.cachedPressure;
}
function Hn() {
  if (!x.isCustomPressure) return wo();
  const t = G.plotted / he;
  return nt(
    x.p.pressure.curve(
      Math.max(0, Math.min(1, 0.5 + (t - 0.5 + x.ct) * x.cs))
    ) + x.cp + x.ck * (t - 0.5),
    0,
    1,
    x.min,
    x.max,
    !0
  );
}
function wo(t = 0.5 + x.p.pressure.curve[0] * x.a, e = 1 - x.p.pressure.curve[1] * x.b, n = x.cp, r = x.min, i = x.max) {
  const s = t * he, o = (G.plotted < s ? e * 1.2 : e * 0.8) * (he / 2);
  return nt(
    1 / (1 + Math.pow(Math.abs((G.plotted - s) / o), 2 * n)),
    0,
    1,
    r,
    i
  );
}
function bo() {
  return ["default", "spray"].includes(x.p.type) ? x.p.opacity : x.p.opacity / Math.min(y.stroke.weight, 1.3);
}
function vo() {
  var t;
  return ((t = x.p) == null ? void 0 : t.spacing) ?? 1;
}
function _o() {
  const t = Math.max(1, x.max ?? 1), e = y.stroke.weight * x.p.scatter, n = y.stroke.weight * x.p.weight * t;
  return Math.max(8, e * 1.5 + n * 0.75);
}
function Mo(t) {
  const e = y.stroke.weight * x.p.scatter * t + y.stroke.weight * gr(ue) * x.p.scatter / 3, n = x.p.weight * E(0.9, 1.1), r = Math.ceil(x.p.grain / t);
  for (let i = 0; i < r; i++) {
    const s = E(0.9, 1.1), o = s * e * E(-1, 1), a = E(-1, 1), c = Math.sqrt((s * e) ** 2 - o ** 2);
    Sn(
      G.x + o,
      G.y + a * c,
      n,
      x.alpha
    );
  }
}
function Wr(t, e = !0, n = x.alpha) {
  const r = e ? y.stroke.weight * x.p.scatter : 0, i = e ? r * E(-1, 1) : 0, s = e ? r * E(-1, 1) : 0;
  Sn(
    G.x + i,
    G.y + s,
    y.stroke.weight * x.p.weight * t,
    n * Math.max(0.8, t) * E(0.9, 1.1)
  );
}
function $r(t, e = x.alpha) {
  const n = y.stroke.weight * x.p.scatter, r = n * E(-1, 1), i = n * E(-1, 1), s = x.p.weight * y.stroke.weight * t, o = x.overscan;
  let a = 0;
  x.p.rotate === "random" ? a = yr(0, 360) * (Math.PI / 180) : x.p.rotate === "natural" && (a = ((Z ? -Pe : -ke) + G.angle()) * (Math.PI / 180)), ho(
    G.x + r,
    G.y + i,
    s,
    a,
    e * Math.max(0.8, t) * E(0.9, 1.1),
    o
  );
}
function Ro(t) {
  if (E(0, 1) >= x.p.grain * t) return;
  const e = y.stroke.weight * x.p.scatter * (x.p.sharpness + (1 - x.p.sharpness) * gr(ue) / t);
  let n, r;
  if (Z) {
    const o = Pe, a = K(o), c = V(o), l = e * E(-1, 1), h = 0.3 * e * E(-1, 1);
    n = l * c + h * a, r = l * a - h * c;
  } else {
    const o = e * E(-1, 1), a = 0.3 * e * E(-1, 1);
    n = o * x.sin + a * x.cos, r = o * x.cos - a * x.sin;
  }
  const i = t * t * x.p.weight * E(0.85, 1.15) * y.stroke.weight, s = Math.max(0.9, t) * x.alpha * E(0.75, 1.1);
  Sn(
    G.x + n,
    G.y + r,
    i,
    s
  );
}
function Gr() {
  if (x.p.markerTip === !1) return;
  let t = Yr(), e = x.alpha;
  if (x.p.type === "marker")
    for (let n = 1; n < 10; n++)
      Wr(t * n / 10, !0, e * 8);
  else if (x.p.type === "custom" || x.p.type === "image")
    for (let n = 1; n < 5; n++)
      $r(t * n / 10, e * 2);
}
function Hr(t, e, n, r) {
  if (!y.stroke.isActive || !y.stroke.color)
    throw new Error(
      "No brush or color set. Call brush.set('brushName', color) before drawing."
    );
  dt();
  let i = Ct(t, e, n, r);
  if (i == 0) return;
  Ur(t, e, i);
  let s = pe(t, e, n, r);
  Xr(s, !1);
}
function So(t, e, n, r) {
  dt(), Ur(e, n, t.length, t), Xr(r, !0);
}
const Eo = [
  "weight",
  "scatter",
  "sharpness",
  "grain",
  "opacity",
  "spacing",
  "pressure",
  "type",
  "tip",
  "rotate",
  "markerTip",
  "noise"
], Ao = [
  [
    "pen",
    [0.3, 0.15, 0.9, 0.7, 150, 0.1, { curve: [0.15, 0.2], min_max: [1.2, 1] }]
  ],
  [
    "rotring",
    [0.15, 0.05, 0.7, 0.9, 210, 0.1, { curve: [0.35, 0.2], min_max: [1.3, 1] }]
  ],
  [
    "2B",
    [0.3, 0.75, 0.45, 0.8, 180, 0.1, { curve: [0.1, 0.3], min_max: [1.1, 0.9] }]
  ],
  [
    "HB",
    [0.3, 0.6, 0.3, 0.7, 170, 0.1, { curve: [0.15, 0.2], min_max: [1.1, 0.9] }]
  ],
  [
    "2H",
    [0.2, 0.6, 0.3, 0.75, 120, 0.1, { curve: [0.15, 0.2], min_max: [1.1, 0.9] }]
  ],
  [
    "cpencil",
    [0.35, 0.55, 0.8, 0.7, 75, 0.1, { curve: [0.15, 0.2], min_max: [0.95, 1.1] }]
  ],
  [
    "pastel",
    [
      0.7,
      5,
      0.91,
      1,
      30,
      0.085 / 3,
      { mode: "gaussian", curve: [0.4, 0.05], min_max: [1.09, 0.93] },
      "default",
      void 0,
      "natural",
      !0,
      1
    ]
  ],
  [
    "crayon",
    [
      0.33,
      1.9,
      0.75,
      2,
      159,
      0.07,
      [1.1, 0.9],
      "default",
      void 0,
      "natural",
      !0,
      1
    ]
  ],
  [
    "charcoal",
    [
      0.35,
      1.5,
      0.68,
      2,
      120,
      0.03,
      { curve: [0.15, 0.4], min_max: [1.1, 0.95] }
    ]
  ],
  [
    "spray",
    [
      0.2,
      6,
      15,
      40,
      90,
      0.5,
      { curve: [0.2, 0.35], min_max: [0.7, 1] },
      "spray"
    ]
  ],
  [
    "marker",
    [
      2,
      0.2,
      null,
      null,
      1,
      0.03,
      { curve: [0.35, 0.25], min_max: [1.2, 0.85] },
      "marker"
    ]
  ]
];
for (let t of Ao) {
  let e = {};
  for (let n = 0; n < t[1].length; n++) e[Eo[n]] = t[1][n];
  Lr(t[0], e);
}
me.prototype.draw = function(t = !1, e, n) {
  let r = En();
  if (t && zr(t, e, n), r.isActive)
    for (let i of this.sides)
      Hr(i[0].x, i[0].y, i[1].x, i[1].y);
  return Dr(r), this;
};
Oe.prototype.draw = function(t, e, n) {
  return En().isActive && (this.origin && (t = this.origin[0], e = this.origin[1], n = 1), So(this, t, e, n)), this;
};
const bt = {
  tips: /* @__PURE__ */ new Map(),
  /**
   * Registers an image source for later loading.
   * @param {string} src - The source URL of the image.
   */
  add(t) {
    this.tips.has(t) || this.tips.set(t, !1);
  },
  /**
   * Converts image to white with inverted alpha for tint-based rendering.
   * Also measures the ink's extent around the centre and stores it as
   * `image.uvFit` (0..1 fraction of the half-width), so rendering can sample
   * just the inked region instead of the full buffer — small tip drawings
   * (e.g. a 3-unit diamond in the 100-unit space) would otherwise shrink to
   * a sub-pixel dot inside each stamp.
   * @param {object} image - The host image object to convert.
   */
  imageToWhite(t) {
    t.loadPixels();
    const e = t.width, n = t.height;
    let r = e, i = n, s = -1, o = -1;
    for (let a = 0, c = 0; a < 4 * e * n; a += 4, c++) {
      let l = (t.pixels[a] + t.pixels[a + 1] + t.pixels[a + 2]) / 3;
      t.pixels[a] = t.pixels[a + 1] = t.pixels[a + 2] = 255;
      const h = 255 - l;
      if (t.pixels[a + 3] = h, h > 8) {
        const u = c % e, f = (c - u) / e;
        u < r && (r = u), u > s && (s = u), f < i && (i = f), f > o && (o = f);
      }
    }
    if (t.updatePixels(), s >= 0) {
      const a = e / 2, c = n / 2, l = Math.max(a - r, s + 1 - a, c - i, o + 1 - c);
      t.uvFit = Math.min(1, Math.max(0.02, (l + 2) / a));
    } else
      t.uvFit = 1;
  },
  /**
   * Loads all registered image tips. Returns a promise that resolves
   * when all images are loaded and processed.
   * @returns {Promise}
   */
  async load() {
    const t = [...this.tips.keys()].filter((e) => !this.tips.get(e));
    await Promise.all(
      t.map(
        (e) => $s(e, bt.imageToWhite).then((n) => {
          this.tips.set(e, n);
        })
      )
    );
  }
};
y.hatch = {
  isActive: !1,
  dist: 5,
  angle: 45,
  options: {},
  hBrush: !1
};
function Vr() {
  return { ...y.hatch };
}
function To(t) {
  y.hatch = { ...t };
}
function jr(t = 5, e = 45, n = { rand: !1, continuous: !1, gradient: !1 }) {
  let r = y.hatch;
  r.isActive = !0, r.dist = t, r.angle = wn(e), r.options = n;
}
function ko(t, e = "black", n = 1) {
  y.hatch.hBrush = { brush: t, color: e, weight: n };
}
function Ve() {
  y.hatch.isActive = !1, y.hatch.hBrush = !1;
}
let jt = new Float64Array(256), st = new Float64Array(256), qt = new Float64Array(512), je = new Float64Array(512), qe = new Float64Array(512), Ke = new Float64Array(512);
function Po(t, e, n, r) {
  Array.isArray(t) || (t = [t]);
  const i = e * Math.PI / 180, s = Math.cos(i), o = Math.sin(i);
  let a = 0;
  for (const b of t) a += b.a.length;
  if (a === 0) return [];
  jt.length < a && (jt = new Float64Array(a * 2), st = new Float64Array(a * 2));
  let c = 1 / 0, l = -1 / 0, h = 0, u = 0;
  qt.length < a && (qt = new Float64Array(a * 2), je = new Float64Array(a * 2), qe = new Float64Array(a * 2), Ke = new Float64Array(a * 2));
  for (const b of t) {
    const w = b.a, R = w.length, k = u;
    for (let T = 0; T < R; T++) {
      const P = w[T][0], L = w[T][1];
      jt[u] = P * s - L * o, st[u] = P * o + L * s, st[u] < c && (c = st[u]), st[u] > l && (l = st[u]), u++;
    }
    for (let T = 0; T < R; T++) {
      const P = T + 1 < R ? T + 1 : 0, L = k + T, S = k + P, I = st[L], D = st[S];
      I !== D && (qt[h] = jt[L], je[h] = I, qe[h] = jt[S], Ke[h] = D, h++);
    }
  }
  const f = [], m = [];
  let g = c + n * 0.5, _ = n;
  const p = r !== 1;
  for (; g < l; ) {
    m.length = 0;
    for (let w = 0; w < h; w++) {
      const R = je[w], k = Ke[w];
      R <= g != k <= g && m.push(qt[w] + (g - R) / (k - R) * (qe[w] - qt[w]));
    }
    const b = m.length;
    if (b === 2) {
      let w = m[0], R = m[1];
      if (w > R) {
        const k = w;
        w = R, R = k;
      }
      f.push({
        scanY: g,
        x1: w * s + g * o,
        y1: -w * o + g * s,
        x2: R * s + g * o,
        y2: -R * o + g * s
      });
    } else if (b > 2) {
      m.sort((w, R) => w - R);
      for (let w = 0; w < b - 1; w += 2) {
        const R = m[w], k = m[w + 1];
        f.push({
          scanY: g,
          x1: R * s + g * o,
          y1: -R * o + g * s,
          x2: k * s + g * o,
          y2: -k * o + g * s
        });
      }
    }
    g += _, p && (_ *= r);
  }
  return f;
}
function Co(t, e, n, r) {
  const i = Po(t, n, e, r);
  return i.sort((s, o) => s.scanY === o.scanY ? s.x1 - o.x1 : s.scanY - o.scanY), i;
}
function Fo(t) {
  const e = En();
  t(), Dr(e);
}
function Io(t) {
  const e = y.hatch.dist, n = (y.hatch.angle % 180 + 180) % 180, r = y.hatch.options, i = r.gradient ? nt(r.gradient, 0, 1, 1, 1.1, !0) : 1, s = Co(t, e, n, i);
  return { dist: e, options: r, segs: s };
}
function Do(t) {
  const { dist: e, options: n, segs: r } = Io(t), i = n.rand || 0, s = [];
  for (let o = 0; o < r.length; o++) {
    const a = r[o];
    let c = a.x1, l = a.y1, h = a.x2, u = a.y2;
    i && (c += 2 * i * e * E(-1, 1), l += 2 * i * e * E(-1, 1), h += 2 * i * e * E(-1, 1), u += 2 * i * e * E(-1, 1));
    const m = n.continuous && o % 2 === 1 ? { x1: h, y1: u, x2: c, y2: l, scanY: a.scanY, isConnector: !1 } : { x1: c, y1: l, x2: h, y2: u, scanY: a.scanY, isConnector: !1 };
    if (s.push(m), o > 0 && n.continuous) {
      const g = s[s.length - 2];
      s.push({
        x1: g.x2,
        y1: g.y2,
        x2: m.x1,
        y2: m.y1,
        scanY: a.scanY,
        isConnector: !0
      });
    }
  }
  return s;
}
function Lo(t, e) {
  const n = Do(t);
  Fo(() => {
    for (let r = 0; r < n.length; r++) {
      const i = n[r];
      e(i.x1, i.y1, i.x2, i.y2, r, n);
    }
  });
}
function Bo(t) {
  Lo(t, (e, n, r, i) => {
    y.hatch.hBrush && zr(y.hatch.hBrush.brush, y.hatch.hBrush.color, y.hatch.hBrush.weight * E(0.9, 1.1)), Hr(e, n, r, i);
  });
}
me.prototype.hatch = function(t = !1, e, n) {
  let r = Vr();
  return t && jr(t, e, n), y.hatch.isActive && Bo(this), To(r), this;
};
Oe.prototype.hatch = function(t, e, n) {
  Vr().isActive && (this.origin && (t = this.origin[0], e = this.origin[1], n = 1), this.pol = this.genPol(t, e, n, 0.3), this.pol.hatch());
};
function No(t, e) {
  const n = t.lineWidth || 0;
  return n <= 0 ? 1 : 1 + n * Math.max(Math.hypot(e.a, e.c), Math.hypot(e.b, e.d)) / 2;
}
function Oo(t, e = null) {
  const n = M.ctx;
  e || (e = n.getTransform());
  const r = e.a, i = e.b, s = e.c, o = e.d, a = e.e, c = e.f;
  let l = 1 / 0, h = 1 / 0, u = -1 / 0, f = -1 / 0;
  n.beginPath();
  const m = t[0];
  let g = r * m.x + s * m.y + a, _ = i * m.x + o * m.y + c;
  l = u = g, h = f = _, n.moveTo(m.x, m.y);
  for (let b = 1; b < t.length; b++) {
    const w = t[b];
    g = r * w.x + s * w.y + a, _ = i * w.x + o * w.y + c, l = Math.min(l, g), h = Math.min(h, _), u = Math.max(u, g), f = Math.max(f, _), n.lineTo(w.x, w.y);
  }
  n.closePath();
  const p = No(n, e);
  M.markDirtyRect(M.mask, {
    minX: l - p,
    minY: h - p,
    maxX: u + p,
    maxY: f + p
  });
}
function zo(t, e, n) {
  const r = Math.PI * 2, i = M.ctx, s = n / 2;
  i.moveTo(t + s, e), i.arc(t, e, s, 0, r);
}
let Pt = null, Vn = !1;
const Uo = 4;
function Xo(t, e, n) {
  return !t.mask || t.mask.width !== e || t.mask.height !== n;
}
function Yo(t, e, n, r) {
  return !t.fillMaskFramebuffer || t.fillMaskFramebuffer.width !== e || t.fillMaskFramebuffer.height !== n || typeof t.fillMaskFramebuffer.pixelDensity == "function" && t.fillMaskFramebuffer.pixelDensity() !== r;
}
function Wo(t, e, n, r, i) {
  var a, c, l;
  const s = Math.max(1, Math.round(e * r)), o = Math.max(1, Math.round(n * r));
  return Xo(t, s, o) && (t.mask = Ie(s, o)), Yo(t, e, n, r) && ((a = t.fillMaskFramebuffer) != null && a.remove && t.fillMaskFramebuffer.remove(), t.fillMaskFramebuffer = cr(t, {
    width: e,
    height: n,
    density: r,
    antialias: !1,
    depth: !1,
    stencil: !1
  }), i(t.fillMaskFramebuffer)), (c = t.mask).dirtyRect ?? (c.dirtyRect = null), (l = t.mask).isDrawn ?? (l.isDrawn = !1), t.mask.drawingContext.imageSmoothingEnabled = !1, {
    mask: t.mask,
    ctx: t.mask.drawingContext
  };
}
function $o(t, e) {
  t && (e(t), t.isDrawn = !1, t.dirtyRect = null);
}
function Go(t, e, n, r, i) {
  return t ? t.dirtyRect ? i(
    r(t.dirtyRect, Uo)
  ) : n() : null;
}
function Ho(t, e, n, r, i) {
  const s = t.fillMaskFramebuffer, o = t.drawingContext, a = n ?? r(), c = a.maxX - a.minX, l = a.maxY - a.minY;
  (!Pt || Pt.width !== c || Pt.height !== l) && (Pt = Ie(c, l));
  const h = Pt.drawingContext;
  return h.clearRect(0, 0, c, l), h.drawImage(
    e,
    a.minX,
    a.minY,
    c,
    l,
    0,
    0,
    c,
    l
  ), i(s), o.bindTexture(o.TEXTURE_2D, s.colorTexture), o.texSubImage2D(
    o.TEXTURE_2D,
    0,
    a.minX,
    a.minY,
    o.RGBA,
    o.UNSIGNED_BYTE,
    Pt
  ), s;
}
function Vo() {
  Vn || (Ue == null || Ue({
    ensureResources: Wo,
    clearMask: $o,
    getCompositeRect: Go,
    getShaderMask: Ho
  }), Vn = !0);
}
Vo();
const jo = 2024;
let pt, Ze = [], jn = [], Qe = [], qn = [];
y.fill = {
  opacity: 150,
  bleed_strength: 0.07,
  texture_strength: 0.8,
  border_strength: 0.5,
  direction: "out",
  scatter: !0,
  isActive: !1
};
const qr = () => ({ ...y.fill }), qo = (t) => {
  y.fill = { ...t };
};
function Kr(t, e, n, r) {
  y.fill.opacity = (arguments.length < 4 ? e : r) || 150, y.fill.color = arguments.length < 3 ? ie(t) : ie(t, e, n), y.fill.isActive = !0;
}
function Zr(t, e = "out") {
  y.fill.bleed_strength = oe(t, 0, 1), y.fill.direction = e;
}
function Qr(t = 0.4, e = 0.4, n = !0) {
  y.fill.texture_strength = oe(t, 0, 1), y.fill.border_strength = oe(e, 0, 1), y.fill.scatter = n;
}
function Je() {
  y.fill.isActive = !1;
}
let fn, we, be, ve, _e;
const Ko = 512, re = [[], []];
function Jr() {
  for (let t = 0; t < Ko; t++)
    re[0][t] = zt(0.5, 0.2), re[1][t] = zt(0, 0.02);
}
mr(Jr);
function Zo(t) {
  const e = t.length;
  if (e === 0)
    return { x: 0, y: 0 };
  if (e < 8) {
    let s = 0, o = 0;
    for (let a = 0; a < e; a++)
      s += t[a].x, o += t[a].y;
    return { x: s / e, y: o / e };
  }
  let n = 0, r = 0, i = 0;
  for (let s = 0; s < e; s++) {
    const o = s + 1 < e ? s + 1 : 0, a = t[s].x, c = t[s].y, l = t[o].x, h = t[o].y, u = a * h - l * c;
    n += u, r += (a + l) * u, i += (c + h) * u;
  }
  return n *= 0.5, n ? { x: r / (6 * n), y: i / (6 * n) } : { x: v[0].x, y: v[0].y };
}
function Qo(t) {
  if (!y.fill.isActive || !y.fill.color)
    throw new Error(
      "No fill color set. Call brush.fill(color) before drawing shapes."
    );
  fn = t, we = 1 / 0, be = 1 / 0, ve = -1 / 0, _e = -1 / 0;
  for (const [h] of t.sides)
    h.x < we && (we = h.x), h.x > ve && (ve = h.x), h.y < be && (be = h.y), h.y > _e && (_e = h.y);
  const e = [...t.vertices], n = E(0, 75), r = ~~(e.length * 0.25 * (n < 5 ? 1 : n < 15 ? 2 : 3)), i = y.fill.bleed_strength, s = e.map(
    (h, u) => (u > r ? 1 : 0.3) * E(0.85, 1.4) * i
  ), o = yr(0, e.length), a = e.length, c = new Array(a);
  for (let h = 0; h < a; h++) c[h] = e[(h + o) % a];
  const l = Zo(c);
  return new It(c, s, l, [], !0).fill(
    y.fill.color,
    nt(y.fill.opacity, 0, 255, 0, 1, !0),
    y.fill.texture_strength
  );
}
class It {
  /**
   * Constructs a FillPolygon.
   * @param {Object[]} _v - Vertices of the polygon.
   * @param {number[]} _m - Multipliers for the bleed effect at each vertex.
   * @param {Object} _center - The polygon's center {x, y}.
   * @param {boolean[]} dir - Array indicating bleed direction per vertex.
   * @param {boolean} isFirst - True for initial polygon.
   */
  constructor(e, n, r, i = [], s = !1, o, a) {
    if (this.v = e, this.m = n, this.dir = i, this.midP = r, s) {
      let c = 0, l = 0;
      const h = [];
      for (let g = 0; g < e.length; g++) {
        const _ = Math.abs(r.x - e[g].x), p = Math.abs(r.y - e[g].y);
        c = Math.max(c, _), l = Math.max(l, p);
        const b = e[g], w = e[(g + 1) % e.length], R = { x: w.x - b.x, y: w.y - b.y }, k = es(0, 0, R.x, R.y, 90), T = { x: b.x + R.x / 2, y: b.y + R.y / 2 };
        h.push({
          v1: b,
          v2: w,
          ray: {
            point1: T,
            point2: { x: T.x + k.x, y: T.y + k.y }
          }
        });
      }
      this.sizeX = c, this.sizeY = l;
      const u = fn.sides;
      this.dir = Array(e.length);
      for (let g = 0; g < h.length; g++) {
        const _ = h[g], p = _.ray.point1.x, b = _.ray.point1.y, w = _.ray.point2.x, R = _.ray.point2.y, k = w - p, T = R - b, P = _.v2.x - _.v1.x, L = _.v2.y - _.v1.y, S = -(P * P + L * L);
        let I = 0;
        for (let D = 0; D < u.length; D++) {
          const F = u[D][0], z = u[D][1], U = z.x - F.x, Y = z.y - F.y, A = Y * k - U * T;
          if (A === 0) continue;
          const B = (k * (b - F.y) - T * (p - F.x)) / A;
          B < 0 || B > 1 || (U * (b - F.y) - Y * (p - F.x)) / A * S <= 0.01 || I++;
        }
        this.dir[g] = I % 2 === 0;
      }
      const f = E(-0.6, 0.6) * c, m = E(-0.6, 0.6) * l;
      this.midP = { x: r.x + f, y: r.y + m };
    } else
      this.sizeX = o, this.sizeY = a;
  }
  /**
   * Trims vertices from the polygon based on a factor.
   * @param {number} [factor=1] - Factor determining amount of trimming.
   * @returns {Object} An object containing trimmed vertices, multipliers, and direction.
   */
  trim(e = 1) {
    if (e >= 1 || e < 0 || this.v.length <= 8)
      return { v: this.v, m: this.m, dir: this.dir };
    const n = this.v.length, r = ~~((1 - e) * n), i = ~~(n / 2 - r / 2), s = i, o = i + r, a = this.v[(s - 1 + n) % n], c = this.v[o % n], l = c.x - a.x, h = c.y - a.y, u = Math.hypot(l, h), f = i >= 2 ? ~~E(0, i - 1) : o < n - 1 ? o : 0, m = this.v[f], g = this.v[(f + 1) % n], _ = Math.max(1, Math.hypot(g.x - m.x, g.y - m.y)), p = Math.max(2, Math.ceil(u / _ * 0.05)), b = n - r + p, w = new Array(b), R = new Array(b), k = new Array(b);
    let T = 0;
    for (let S = 0; S < i; S++, T++)
      w[T] = this.v[S], R[T] = this.m[S], k[T] = this.dir[S];
    const P = u * 0.06, L = this.dir[s % this.dir.length];
    for (let S = 0; S < p; S++, T++) {
      const I = (S + 1) / (p + 1);
      w[T] = {
        x: a.x + l * I + E(-P, P),
        y: a.y + h * I + E(-P, P)
      }, R[T] = E(0.3, 0.5), k[T] = L;
    }
    for (let S = o; S < n; S++, T++)
      w[T] = this.v[S], R[T] = this.m[S], k[T] = this.dir[S];
    return { v: w, m: R, dir: k };
  }
  /**
   * Randomly samples a fraction of vertices, keeping their order.
   * Any sampled vertex outside the original polygon is pulled inward.
   * @param {number} [ratio=0.3] - Fraction of vertices to keep.
   * @returns {FillPoly} A new FillPoly with fewer vertices, guaranteed inside the original.
   */
  scatter(e = 0.3) {
    const n = this.v.length, r = Math.max(3, ~~(n * e)), i = n / r, s = i * 0.8, o = [], a = [], c = [], l = this.midP, h = fn.sides;
    for (let u = 0; u < r; u++) {
      const f = ~~(u * i + E(0, s)) % n;
      let m = this.v[f], g = !1;
      if (m.x < we || m.x > ve || m.y < be || m.y > _e)
        g = !0;
      else {
        let _ = 0;
        for (const [p, b] of h) {
          const w = p.y, R = b.y;
          if (w > m.y == R > m.y) continue;
          const k = (m.y - w) / (R - w);
          m.x < p.x + k * (b.x - p.x) && _++;
        }
        g = _ % 2 === 0;
      }
      g && (m = {
        x: l.x + (m.x - l.x) * E(0.3, 0.6),
        y: l.y + (m.y - l.y) * E(0.3, 0.6)
      }), o.push(m), a.push(this.m[f]), c.push(!this.dir[f]);
    }
    return new It(o, a, this.midP, c, !1, this.sizeX, this.sizeY);
  }
  /**
   * Returns a copy with all bleed directions flipped.
   */
  flipDirs() {
    return new It(this.v, this.m, this.midP, this.dir.map((e) => !e), !1, this.sizeX, this.sizeY);
  }
  /**
   * Grows (or shrinks) the polygon vertices to simulate watercolor spread.
   * @param {number} [growthFactor=1] - Factor controlling growth.
   * @returns {FillPoly} A new FillPoly with adjusted vertices.
   */
  grow(e = 1) {
    const { v: n, m: r, dir: i } = this.trim(e), s = n.length, o = s * 2;
    Ze.length < s && (Ze = new Array(s), jn = new Array(s)), Qe.length < o && (Qe = new Array(o), qn = new Array(o));
    const a = Ze, c = jn, l = Qe, h = qn, u = y.fill.direction === "out" ? -90 : 90;
    re[0].length === 0 && Jr();
    const f = re[0], m = f.length, g = re[1], _ = g.length;
    let p = 0, b = 0, w = e === 999 ? E(0.6, 0.8) : y.fill.bleed_strength;
    const R = pt && s * 2 > pt ? Math.ceil(s * 2 / pt) : 1;
    if (R >= 2 && (R & 1) === 0) {
      for (let S = 0; S < s; S++) {
        const I = r[S];
        e < 997 && (w = I), w >= 0.05 && (E(-1, 1), f[~~(E(0, 1) * m)], E(0.65, 1.35), g[~~(E(0, 1) * _)]);
      }
      return new It(n, r, this.midP, i, !1, this.sizeX, this.sizeY);
    } else
      for (let S = 0; S < s; S++) {
        const I = n[S], D = n[S + 1 < s ? S + 1 : 0], F = r[S], z = i[S];
        if (e < 997 && (w = F), w < 0.05) {
          l[p] = F, h[p] = z, p++, a[b] = (I.x + D.x) / 2, c[b] = (I.y + D.y) / 2, l[p] = F, h[p] = z, p++, b++;
          continue;
        }
        const U = (z ? u : -u) + E(-1, 1) * 5, Y = Re(U), A = Y[0], B = Y[1], X = D.x - I.x, Ht = D.y - I.y, ri = A * X + B * Ht, ii = A * Ht - B * X, An = f[~~(E(0, 1) * m)] * E(0.65, 1.35) * w, si = F + g[~~(E(0, 1) * _)];
        l[p] = F, h[p] = z, p++, a[b] = I.x + X * 0.5 + ri * An, c[b] = I.y + Ht * 0.5 + ii * An, l[p] = si, h[p] = z, p++, b++;
      }
    let T, P, L;
    if (pt && p > pt) {
      const S = Math.ceil(p / pt), I = Math.ceil(p / S);
      T = new Array(I), P = new Array(I), L = new Array(I);
      let D = 0;
      for (let F = 0; F < p; F += S, D++)
        T[D] = F % 2 === 0 ? n[F >> 1] : { x: a[F >> 1], y: c[F >> 1] }, P[D] = l[F], L[D] = h[F];
    } else {
      T = new Array(p);
      for (let S = 0; S < p; S++)
        T[S] = S % 2 === 0 ? n[S >> 1] : { x: a[S >> 1], y: c[S >> 1] };
      P = l.slice(0, p), L = h.slice(0, p);
    }
    return new It(T, P, this.midP, L, !1, this.sizeX, this.sizeY);
  }
  /**
   * Fills the polygon with multiple layers to simulate a watercolor effect.
   * @param {Color|string} color - The fill color.
   * @param {number} intensity - Opacity intensity (mapped from 0 to 1).
   * @param {number} tex - Texture factor.
   */
  fill(e, n, r) {
    const s = r * 3, o = 2 * n * (1 + r / 2), a = M.isBrush !== !1;
    M.isBrush = !1, a && (M.justChanged = !0), M.blend(e);
    const c = Dt();
    M.ctx.save(), M.ctx.setTransform(
      $ * c.a,
      $ * c.b,
      $ * c.c,
      $ * c.d,
      $ * (c.x + N / 2),
      $ * (c.y + O / 2)
    );
    const l = "rgb(255 0 0 / ";
    M.ctx.strokeStyle = l + y.fill.border_strength * 0.01 + ")", M.ctx.lineCap = "round", pt = jo * Math.max(0.2, 2 * y.fill.bleed_strength);
    const h = M.ctx.getTransform(), u = Math.max(this.sizeX, this.sizeY), f = E(0.15, 0.7);
    let m = this.grow();
    const g = this.scatter(0.1).grow().scatter(0.75).flipDirs();
    let _;
    for (let p = 0; p < 20; p++) {
      p % 4 === 0 && (m = m.grow()), p % 2 === 0 && (_ = [
        m.grow(1 - 0.0125 * p),
        m.grow(0.7 - 0.0125 * p),
        m.grow(0.4 - 0.0125 * p)
      ]);
      for (const b of _)
        b.grow(999).grow(997).layer(p, u, o, h);
      y.fill.scatter && g.grow(999).flipDirs().grow(997).layer(p, u, o * s, h), p % 2 === 0 && m.grow(f).grow(999).layer(p, u, o * 2, h), (p % 8 === 0 || p === 19) && (s !== 0 && m.erase(s * 3, n), M.blend(e, !0));
    }
    M.ctx.restore();
  }
  /**
   * Draws a layer of the fill polygon with stroke and fill.
   * @param {number} i - The layer index.
   */
  layer(e, n, r, i = null) {
    M.ctx.lineWidth = nt(e, 0, 24, n / 25, n / 30, !0) * y.fill.border_strength, M.ctx.fillStyle = "rgb(255 0 0 / " + r + "%)", Oo(this.v, i), M.ctx.fill(), M.ctx.stroke();
  }
  /**
   * Erases parts of the polygon to create a natural watercolor texture.
   * @param {number} texture - Texture strength factor.
   * @param {number} intensity - Intensity value for size scaling.
   */
  erase(e, n) {
    M.ctx.save();
    const r = ~~(E(80, 110) * nt(e, 0, 1, 2, 3.5)), i = this.sizeX / 1.3, s = this.sizeY / 1.3, o = Math.min(this.sizeX, this.sizeY) * 1.3, a = 0.03 * o, c = 0.45 * o, { x: l, y: h } = this.midP;
    M.ctx.globalCompositeOperation = "destination-out";
    const u = (5 - nt(n, 80, 100, 0.3, 0.7, !0)) * e / 255;
    M.ctx.fillStyle = `rgb(255 0 0 / ${u})`, M.ctx.lineWidth = 0;
    for (let f = 0; f < r; f++) {
      const m = l + zt(0, i), g = h + zt(0, s), _ = E(a, c);
      M.ctx.beginPath(), zo(m, g, _), f % 5 !== 0 && M.ctx.fill();
    }
    M.ctx.globalCompositeOperation = "source-over", M.ctx.restore();
  }
}
me.prototype.fill = function(t = !1, e, n, r, i, s) {
  let o = qr();
  return t && (Kr(t, e), Zr(n, s), Qr(r, i)), o.isActive && (dt(), Qo(this)), qo(o), this;
};
Oe.prototype.fill = function(t, e, n) {
  qr().isActive && (this.origin && (t = this.origin[0], e = this.origin[1], n = 1), this.pol = this.genPol(
    t,
    e,
    n,
    y.fill.bleed_strength < 0.06 ? 0 : nt(y.fill.bleed_strength, 0, 0.6, 0.2, 0.6, !0)
  ), this.pol.fill());
};
function Jo(t, e, n) {
  const r = e.isEnabled(e.DEPTH_TEST);
  return r && e.disable(e.DEPTH_TEST), e.bindFramebuffer(e.FRAMEBUFFER, n.framebuffer), e.viewport(0, 0, n.width * n.density, n.height * n.density), { hadDepthTest: r };
}
function ta(t, e, n) {
  n != null && n.hadDepthTest && e.enable(e.DEPTH_TEST), e.bindFramebuffer(e.FRAMEBUFFER, null), e.viewport(
    0,
    0,
    Math.max(1, Math.round(N * $)),
    Math.max(1, Math.round(O * $))
  );
}
function ea(t, e) {
  e.activeTexture(e.TEXTURE0), e.bindTexture(e.TEXTURE_2D, null), e.blendEquation(e.FUNC_ADD), e.blendFunc(e.ONE, e.ONE_MINUS_SRC_ALPHA);
}
function na() {
  Qs({
    beginDirectMaskDraw: Jo,
    endDirectMaskDraw: ta,
    resetDirectShaderTracking: ea
  });
}
function ra(t, e, n) {
  if (!e) return;
  if (n(e)) {
    const i = t.drawingContext, s = i.getParameter(i.FRAMEBUFFER_BINDING), o = i.getParameter(i.VIEWPORT);
    i.bindFramebuffer(i.FRAMEBUFFER, e.framebuffer), i.viewport(0, 0, e.width * e.density, e.height * e.density), i.clearColor(0, 0, 0, 0), i.clear(i.COLOR_BUFFER_BIT), i.bindFramebuffer(i.FRAMEBUFFER, s), i.viewport(
      o[0],
      o[1],
      o[2],
      o[3]
    );
    return;
  }
  const r = e.drawingContext;
  r.save(), r.setTransform(1, 0, 0, 1, 0, 0), r.clearRect(0, 0, e.width, e.height), r.restore();
}
function ia(t, e, n) {
  const r = hn(t, e, n), i = /* @__PURE__ */ new Map(), s = t.createVertexArray(), o = (h) => (i.has(h) || i.set(h, t.getUniformLocation(r, h)), i.get(h)), a = t.getUniformLocation(r, "u_source"), c = t.getUniformLocation(r, "u_mask"), l = t.getUniformLocation(r, "u_color");
  return {
    program: r,
    quadVao: s,
    loc_source: a,
    loc_mask: c,
    loc_color: l,
    setUniform(h, u) {
      const f = o(h);
      if (f) {
        if (typeof u == "boolean") {
          t.uniform1i(f, u ? 1 : 0);
          return;
        }
        if (typeof u == "number") {
          t.uniform1f(f, u);
          return;
        }
        if (Array.isArray(u)) {
          u.length === 3 ? t.uniform3f(f, u[0], u[1], u[2]) : u.length === 4 && t.uniform4f(f, u[0], u[1], u[2], u[3]);
          return;
        }
      }
    }
  };
}
function sa(t, e, n) {
  return t.shaderProgram ?? (t.shaderProgram = ia(t.drawingContext, e, n)), t.shaderProgram;
}
function oa(t, e, n) {
  const r = t.createTexture();
  return t.bindTexture(t.TEXTURE_2D, r), t.texImage2D(
    t.TEXTURE_2D,
    0,
    t.RGBA,
    e,
    n,
    0,
    t.RGBA,
    t.UNSIGNED_BYTE,
    null
  ), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.LINEAR), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.LINEAR), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE), t.bindTexture(t.TEXTURE_2D, null), r;
}
function ti(t, e) {
  const n = t.drawingContext, r = e.density ?? 1, i = n.createFramebuffer(), s = Math.max(1, e.width), o = Math.max(1, e.height), a = Math.max(1, Math.round(s * r)), c = Math.max(1, Math.round(o * r)), l = oa(n, a, c);
  return n.bindFramebuffer(n.FRAMEBUFFER, i), n.framebufferTexture2D(
    n.FRAMEBUFFER,
    n.COLOR_ATTACHMENT0,
    n.TEXTURE_2D,
    l,
    0
  ), n.bindFramebuffer(n.FRAMEBUFFER, null), {
    __brushFramebuffer: !0,
    framebuffer: i,
    colorTexture: l,
    width: s,
    height: o,
    density: r,
    pixelDensity: () => r,
    remove() {
      n.deleteFramebuffer(i), n.deleteTexture(l);
    }
  };
}
function aa(t, e, n, r, i) {
  var s;
  return (s = e == null ? void 0 : e.remove) == null || s.call(e), ti(t, {
    width: n,
    height: r,
    density: i
  });
}
function la({
  renderer: t,
  shader: e,
  source: n,
  mask: r,
  color: i,
  isBrushMask: s,
  dirtyRect: o,
  targetIsFramebuffer: a,
  withScissor: c
}) {
  const l = t.drawingContext, h = l.isEnabled(l.DEPTH_TEST), u = l.getParameter(l.FRAMEBUFFER_BINDING), f = l.getParameter(l.CURRENT_PROGRAM), m = l.getParameter(l.VERTEX_ARRAY_BINDING);
  l.bindVertexArray(e.quadVao), l.useProgram(e.program), l.disable(l.DEPTH_TEST), l.enable(l.BLEND), l.blendEquation(l.FUNC_ADD), l.blendFunc(l.ONE, l.ONE_MINUS_SRC_ALPHA), l.activeTexture(l.TEXTURE0), l.bindTexture(l.TEXTURE_2D, n.colorTexture), l.uniform1i(e.loc_source, 0), l.activeTexture(l.TEXTURE1), l.bindTexture(l.TEXTURE_2D, r.colorTexture), l.uniform1i(e.loc_mask, 1), e.setUniform("u_targetIsFramebuffer", a), e.setUniform("u_isBrush", s), l.uniform3f(e.loc_color, i[0], i[1], i[2]), l.bindFramebuffer(l.FRAMEBUFFER, null), c(
    l,
    o,
    () => {
      l.drawArrays(l.TRIANGLES, 0, 3);
    },
    !a
  ), l.bindTexture(l.TEXTURE_2D, null), l.activeTexture(l.TEXTURE0), l.bindVertexArray(m), l.useProgram(f), l.bindFramebuffer(l.FRAMEBUFFER, u), h && l.enable(l.DEPTH_TEST);
}
function ca(t) {
  return Ui(t);
}
function ha() {
  Xi({
    clearTarget: ra,
    ensureBlendShaderProgram: sa,
    ensureBlendSourceFramebuffer: aa,
    createFramebuffer: ti,
    runBlendShaderPass: la,
    blitSourceToFramebuffer: ca
  });
}
function tn(t) {
  if (typeof t == "number") {
    const e = Math.max(0, Math.min(255, t));
    return `rgb(${e} ${e} ${e})`;
  }
  return t ?? "black";
}
function ei(t) {
  const e = zi(t, !0), n = {
    canvas: t,
    drawingContext: e,
    width: t.width,
    height: t.height,
    pixels: null,
    _fillStyle: "#ffffff",
    _strokeStyle: "transparent",
    _lineWidth: 1,
    pixelDensity() {
      return 1;
    },
    background(r) {
      e.save(), e.setTransform(1, 0, 0, 1, 0, 0), e.fillStyle = tn(r), e.fillRect(0, 0, t.width, t.height), e.restore();
    },
    noSmooth() {
      e.imageSmoothingEnabled = !1;
    },
    push() {
      e.save();
    },
    pop() {
      e.restore();
    },
    translate(r, i) {
      e.translate(r, i);
    },
    scale(r, i = r) {
      e.scale(r, i);
    },
    rotate(r) {
      e.rotate(r);
    },
    noStroke() {
      n._strokeStyle = "transparent";
    },
    stroke(r) {
      n._strokeStyle = tn(r);
    },
    noFill() {
      n._fillStyle = "transparent";
    },
    fill(r) {
      n._fillStyle = tn(r);
    },
    strokeWeight(r) {
      n._lineWidth = r;
    },
    rect(r, i, s, o) {
      e.beginPath(), e.rect(r, i, s, o), n._paint();
    },
    circle(r, i, s) {
      e.beginPath(), e.arc(r, i, s / 2, 0, Math.PI * 2), n._paint();
    },
    ellipse(r, i, s, o) {
      e.beginPath(), e.ellipse(r, i, s / 2, o / 2, 0, 0, Math.PI * 2), n._paint();
    },
    line(r, i, s, o) {
      e.beginPath(), e.moveTo(r, i), e.lineTo(s, o), e.strokeStyle = n._strokeStyle, e.lineWidth = n._lineWidth, e.stroke();
    },
    beginShape() {
      e.beginPath(), n._shapeStarted = !1;
    },
    vertex(r, i) {
      n._shapeStarted ? e.lineTo(r, i) : (e.moveTo(r, i), n._shapeStarted = !0);
    },
    endShape(r = !1) {
      r && e.closePath(), n._paint();
    },
    loadPixels() {
      n.pixels = e.getImageData(0, 0, t.width, t.height).data;
    },
    updatePixels() {
      const r = e.getImageData(0, 0, t.width, t.height);
      r.data.set(n.pixels), e.putImageData(r, 0, 0);
    },
    _paint() {
      n._fillStyle !== "transparent" && (e.fillStyle = n._fillStyle, e.fill()), n._strokeStyle !== "transparent" && (e.strokeStyle = n._strokeStyle, e.lineWidth = n._lineWidth, e.stroke());
    }
  };
  return n;
}
function ua(t, e) {
  return ei(Ie(t, e, !0));
}
function fa(t, e) {
  return new Promise((n, r) => {
    const i = globalThis.Image;
    if (!i) {
      r(new Error("Standalone image brush loading requires Image support."));
      return;
    }
    const s = new i();
    s.onload = () => {
      const o = ei(
        Ie(s.naturalWidth, s.naturalHeight, !0)
      );
      o.drawingContext.drawImage(s, 0, 0), e(o), n(o);
    }, s.onerror = () => r(new Error(`Failed to load image tip: ${t}`)), s.crossOrigin = "anonymous", s.src = t;
  });
}
function da() {
  Ys({
    createTipSurface: ua,
    loadImageTip: fa
  });
}
zs();
bs();
na();
ha();
da();
const ma = "2B", Kn = "#c93030";
function Ba(t, e) {
  return Lr(t, e);
}
function Na() {
  return go();
}
const ga = {
  pen: 1.5,
  rotring: 1,
  "2B": 3,
  HB: 2.5,
  "2H": 2.5,
  cpencil: 2.5,
  pastel: 12,
  crayon: 6,
  charcoal: 5,
  spray: 26,
  marker: 3
};
function ya(t, e) {
  const n = ga[t] ?? 8;
  return Math.max(10, n * e * 2 + 8);
}
function pa(t, e) {
  const n = (t == null ? void 0 : t.scaleWithFont) === !1 ? 1 : e / 16, r = t != null && t.fill ? {
    color: t.fill.color ?? t.color ?? Kn,
    opacity: t.fill.opacity ?? 80,
    bleed: t.fill.bleed ?? 0.15,
    texture: t.fill.texture ?? 0.6,
    border: t.fill.border ?? 0.4
  } : !1, i = t != null && t.hatch ? {
    distance: (t.hatch.distance ?? 5) * n,
    angle: t.hatch.angle ?? 45,
    rand: t.hatch.rand,
    brush: t.hatch.brush,
    color: t.hatch.color,
    weight: t.hatch.weight
  } : !1;
  return {
    name: (t == null ? void 0 : t.name) ?? ma,
    color: (t == null ? void 0 : t.color) ?? Kn,
    weightFinal: ((t == null ? void 0 : t.weight) ?? 1) * n,
    wiggle: (t == null ? void 0 : t.wiggle) ?? !1,
    field: (t == null ? void 0 : t.field) ?? !1,
    fill: r,
    hatch: i
  };
}
function xa(t, e) {
  vr();
  try {
    if (e.field ? xr(e.field) : e.wiggle !== !1 && e.wiggle > 0 ? hs(e.wiggle) : cs(), t.kind === "spline") {
      Br(e.name), Nr(e.color), Or(e.weightFinal * t.weightMul), Je(), Ve();
      const n = t.closed ? [...t.polyline, t.polyline[0], t.polyline[1]] : t.polyline;
      Us(n, t.curvature);
    } else if (t.kind === "wash") {
      const n = e.fill || {
        color: e.color,
        opacity: 80,
        bleed: 0.15,
        texture: 0.6,
        border: 0.4
      };
      Gn(), Ve(), Kr(n.color, n.opacity), Zr(n.bleed), Qr(n.texture, n.border), zn(t.polyline.map((r) => [r[0], r[1]])), Je();
    } else t.kind === "hatch" && e.hatch && (Gn(), Je(), jr(e.hatch.distance, e.hatch.angle, {
      rand: e.hatch.rand ?? 0.1
    }), ko(
      e.hatch.brush ?? e.name,
      e.hatch.color ?? e.color,
      e.hatch.weight ?? 1
    ), zn(t.polyline.map((n) => [n[0], n[1]])), Ve());
  } finally {
    _r();
  }
}
const xt = 4096;
class wa {
  constructor() {
    this.canvas = null, this.contextLost = !1;
  }
  ensureCanvas(e, n) {
    return this.canvas ? ((this.canvas.width < e || this.canvas.height < n) && (this.canvas.width = Math.min(xt, Math.max(this.canvas.width, e)), this.canvas.height = Math.min(xt, Math.max(this.canvas.height, n)), Ye(this.canvas)), this.canvas) : (this.canvas = document.createElement("canvas"), this.canvas.width = Math.min(xt, Math.max(e, 512)), this.canvas.height = Math.min(xt, Math.max(n, 512)), this.canvas.addEventListener("webglcontextlost", (r) => {
      r.preventDefault(), this.contextLost = !0;
    }), this.canvas.addEventListener("webglcontextrestored", () => {
      this.contextLost = !1;
    }), Ye(this.canvas), this.canvas);
  }
  get lost() {
    return this.contextLost;
  }
  /**
   * Render all strokes of a job, one snapshot per layer (layers may overlap
   * each other, e.g. crossed-off diagonals, so they are masked separately).
   */
  render(e) {
    let n = e.dpr, r = Math.ceil(e.widthCss * n), i = Math.ceil(e.heightCss * n);
    if (r > xt || i > xt) {
      const c = xt / Math.max(r, i);
      n *= c, r = Math.ceil(e.widthCss * n), i = Math.ceil(e.heightCss * n);
    }
    const s = this.ensureCanvas(r, i);
    Ye(s);
    const o = [...new Set(e.strokes.map((c) => c.layer))].sort((c, l) => c - l), a = [], P = bmPaper(e);
    for (const c of o) {
      Ji(e.seed + c * 101), ts(e.seed + c * 101), Rs(P.value, P.value, P.value), vr(), xs(-s.width / 2, -s.height / 2), ws(n);
      try {
        for (const u of e.strokes)
          u.layer === c && xa(u, e.resolved);
      } finally {
        _r();
      }
      Ms();
      const l = document.createElement("canvas");
      l.width = Math.ceil(e.widthCss * e.dpr), l.height = Math.ceil(e.heightCss * e.dpr);
      const h = l.getContext("2d", { willReadFrequently: !0 });
      h && (h.drawImage(s, 0, 0, r, i, 0, 0, l.width, l.height), ba(h, l.width, l.height, P.value, P.contrast)), a.push({ canvas: l, layer: c });
    }
    return a;
  }
}
let bmProbe = null;
function bmParseColor(t) {
  const e = t.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (e) {
    let s = e[1];
    return s.length === 3 && (s = s.split("").map((o) => o + o).join("")), [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }
  try {
    if (bmProbe || (bmProbe = document.createElement("canvas").getContext("2d")), !bmProbe) return null;
    bmProbe.fillStyle = "#000", bmProbe.fillStyle = t;
    const s = String(bmProbe.fillStyle).match(/^#([0-9a-f]{6})/i);
    if (s) return [parseInt(s[1].slice(0, 2), 16), parseInt(s[1].slice(2, 4), 16), parseInt(s[1].slice(4, 6), 16)];
    const o = String(bmProbe.fillStyle).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (o) return [+o[1], +o[2], +o[3]];
  } catch {
  }
  return null;
}
// Paper that contrasts most with the job's inks (see src/core/renderer.ts choosePaper).
function bmPaper(t) {
  const e = [t.resolved.color];
  for (const o of t.strokes)
    o.kind === "wash" && t.resolved.fill && e.push(t.resolved.fill.color), o.kind === "hatch" && t.resolved.hatch?.color && e.push(t.resolved.hatch.color);
  let n = 255, r = 255;
  for (const o of new Set(e)) {
    const a = bmParseColor(o);
    a && (n = Math.min(n, 255 - Math.min(a[0], a[1], a[2])), r = Math.min(r, Math.max(a[0], a[1], a[2])));
  }
  return n >= r ? { value: 255, contrast: Math.max(1, n) } : { value: 0, contrast: Math.max(1, r) };
}
// Key the paper out: alpha = ink density normalized by the ink's contrast; color un-composited against the paper.
function ba(t, e, n, r = 255, i = 255) {
  const s = t.getImageData(0, 0, e, n), o = s.data, a = 255 / Math.max(1, i);
  for (let c = 0; c < o.length; c += 4) {
    const l = o[c], h = o[c + 1], u = o[c + 2], f = r === 255 ? 255 - Math.min(l, h, u) : Math.max(l, h, u);
    if (f === 0) {
      o[c + 3] = 0;
      continue;
    }
    const d = Math.min(255, Math.round(f * a)), p = 255 / d;
    o[c] = Math.max(0, Math.min(255, Math.round(r + (l - r) * p))), o[c + 1] = Math.max(0, Math.min(255, Math.round(r + (h - r) * p))), o[c + 2] = Math.max(0, Math.min(255, Math.round(r + (u - r) * p))), o[c + 3] = d;
  }
  t.putImageData(s, 0, 0);
}
let en = null;
function va() {
  return en || (en = new wa()), en;
}
let ot = null;
function _a(t, e) {
  ot || (ot = document.createElement("canvas")), ot.width < t && (ot.width = t), ot.height < e && (ot.height = e);
  const n = ot.getContext("2d");
  if (!n) throw new Error("brushmark: 2D context unavailable");
  return n;
}
function Ma(t, e, n) {
  switch (t) {
    case "rtl":
      return -(e - n);
    case "center-out":
      return -((e - n) / 2);
    default:
      return 0;
  }
}
const fe = (t) => Math.min(1, Math.max(0, t));
function Ra(t, e, n, r) {
  const i = e * fe(n), s = i * fe(r), o = i - s;
  return t === "rtl" ? { start: e - i, len: o } : { start: s, len: o };
}
function Sa(t, e, n, r) {
  const i = t.w * fe(n), s = i * fe(r), o = i - s;
  return e === "rtl" ? { x: t.x + t.w - i, y: t.y, w: o, h: t.h } : { x: t.x + s, y: t.y, w: o, h: t.h };
}
function Zn(t, e) {
  const n = e.polyline;
  t.beginPath(), t.moveTo(n[0][0], n[0][1]);
  for (let r = 1; r < n.length; r++) t.lineTo(n[r][0], n[r][1]);
  e.closed && t.closePath();
}
function Ea(t, e, n) {
  switch (e) {
    case "rtl":
      return { x: t.x + t.w * (1 - n), y: t.y, w: t.w * n, h: t.h };
    case "center-out": {
      const r = t.w * n;
      return { x: t.x + (t.w - r) / 2, y: t.y, w: r, h: t.h };
    }
    default:
      return { x: t.x, y: t.y, w: t.w * n, h: t.h };
  }
}
function ni(t) {
  var o;
  const { overlayCtx: e, dpr: n } = t, r = Math.ceil(t.widthCss * n), i = Math.ceil(t.heightCss * n);
  if (e.clearRect(0, 0, r, i), t.alpha.value <= 0) return;
  e.save(), e.globalAlpha = t.alpha.value;
  const s = [...new Set(t.layers.map((a) => a.layer))].sort((a, c) => a - c);
  for (const a of s) {
    const c = (o = t.layers.find((f) => f.layer === a)) == null ? void 0 : o.canvas;
    if (!c) continue;
    const l = [];
    for (const f of t.groups) {
      const m = Math.min(1, Math.max(0, f.progress.value));
      for (const g of f.strokes)
        g.layer === a && l.push({ stroke: g, t: m });
    }
    if (l.length === 0 || l.every((f) => f.t <= 0)) continue;
    const h = t.wipe;
    if (l[0].stroke.reveal === "fade") {
      const f = Math.min(...l.map((g) => g.t)), m = t.alpha.value * f * (h ? 1 - fe(h.value) : 1);
      if (m <= 0) continue;
      e.save(), e.globalAlpha = m, e.drawImage(c, 0, 0, r, i), e.restore();
      continue;
    }
    if (!h && l.every((f) => f.t >= 1)) {
      e.drawImage(c, 0, 0, r, i);
      continue;
    }
    const u = _a(r, i);
    u.save(), u.setTransform(1, 0, 0, 1, 0, 0), u.globalCompositeOperation = "source-over", u.clearRect(0, 0, r, i), u.setTransform(n, 0, 0, n, 0, 0), u.strokeStyle = "#000", u.fillStyle = "#000", u.lineCap = "round", u.lineJoin = "round";
    for (const { stroke: f, t: m } of l) {
      if (m <= 0) continue;
      if (f.reveal === "sweep") {
        const p = f.sweepBox ?? { x: 0, y: 0, w: t.widthCss, h: t.heightCss }, b = h ? Sa(p, t.direction, m, h.value) : Ea(p, t.direction, m);
        b.w > 0 && b.h > 0 && u.fillRect(b.x, b.y, b.w, b.h);
        continue;
      }
      const g = f.lengthPx;
      if (u.lineWidth = f.maskWidth, h) {
        const { start: p, len: b } = Ra(t.direction, g, m, h.value);
        if (b <= 0.01) continue;
        u.setLineDash([b, g + 10]), u.lineDashOffset = -p, Zn(u, f), u.stroke(), u.setLineDash([]);
        continue;
      }
      const _ = g * m;
      _ <= 0.01 || (m >= 1 ? u.setLineDash([]) : (u.setLineDash([_, g + 10]), u.lineDashOffset = Ma(t.direction, g, _)), Zn(u, f), u.stroke(), u.setLineDash([]));
    }
    u.setTransform(1, 0, 0, 1, 0, 0), u.globalCompositeOperation = "source-in", u.drawImage(c, 0, 0, r, i), u.restore(), e.drawImage(ot, 0, 0, r, i, 0, 0, r, i);
  }
  e.restore();
}
const Ce = /* @__PURE__ */ new Set(), Qn = /* @__PURE__ */ new WeakSet();
function Aa() {
  for (const t of Ce)
    ni(t), t.dirty = !1;
  Ce.clear();
}
function et(t) {
  t.dirty = !0, Ce.add(t), Qn.has(t.engine) || (Qn.add(t.engine), t.engine.ticker.add(Aa));
}
function Jn(t) {
  Ce.delete(t);
}
const Ta = 0.8;
function ka() {
  return typeof matchMedia < "u" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function Pa(t, e) {
  return e.createTimeline({
    paused: !0,
    repeat: t.repeat,
    yoyo: t.yoyo,
    ...t.timelineVars
  });
}
function Ca(t, e, n, r) {
  t.clear();
  const i = r.duration ?? Ta, s = r.ease ?? "power2.out", o = [...e].sort((h, u) => h.order - u.order);
  r.direction === "rtl" && o.reverse();
  const a = o.reduce((h, u) => h + Math.max(1, u.lengthPx), 0), c = r.stagger || void 0;
  let l = r.delay ?? 0;
  for (const h of o) {
    const u = Math.max(1, h.lengthPx) / a, f = Math.max(0.02, i * u);
    t.to(
      h.progress,
      {
        value: 1,
        duration: f,
        ease: s,
        onUpdate: () => et(n)
      },
      l
    ), (c == null ? void 0 : c.each) !== void 0 ? l += c.each : (c == null ? void 0 : c.overlap) !== void 0 ? l += f * (1 - Math.min(1, Math.max(0, c.overlap))) : l += f;
  }
  t.call(() => et(n), void 0, Math.max(l, t.duration()));
}
let Fa = 0;
const Ia = /* @__PURE__ */ new Set(["underline", "strike-through", "highlight"]);
class Oa {
  constructor(e, n) {
    var r;
    this.built = !1, this.showing = !1, this.removed = !1, this.lastRelativeLines = [], this.revealState = null, this.groups = [], this.fadeTween = null, this.wipeTween = null, this.element = e, this.config = { ...n }, this.seedValue = n.seed ?? ai(`${n.type}:${((r = e.textContent) == null ? void 0 : r.slice(0, 64)) ?? ""}`) + Fa++ >>> 0, this.overlay = Si(e), this.engine = er(), this.timeline = Pa(this.config, this.engine), this.stopObserving = Pi(e, () => this.onLayoutChange());
  }
  // -- lifecycle ------------------------------------------------------------
  /** Build geometry + art without playing (used by annotationGroup). */
  prepare() {
    this.removed || this.built || this.build();
  }
  /** Mark as showing without driving the timeline (group master drives it). */
  beginShowing() {
    this.removed || !this.revealState || (this.showing = !0, this.cancelFade(), this.cancelWipe(), this.revealState.alpha.value = 1);
  }
  async show() {
    if (!this.removed && (this.built || this.build(), !!this.revealState)) {
      if (this.showing = !0, this.cancelFade(), this.cancelWipe(), this.revealState.alpha.value = 1, this.config.animate === !1 || ka()) {
        this.timeline.progress(1).pause(), et(this.revealState);
        return;
      }
      this.timeline.play(), await this.timeline.then();
    }
  }
  async hide(e = "reverse") {
    if (!(this.removed || !this.revealState)) {
      if (this.showing = !1, this.cancelFade(), this.cancelWipe(), e === "instant") {
        this.timeline.pause(0), et(this.revealState);
        return;
      }
      if (e === "fade") {
        await new Promise((n) => {
          this.fadeTween = this.engine.to(this.revealState.alpha, {
            value: 0,
            duration: 0.35,
            ease: "power1.out",
            onUpdate: () => this.revealState && et(this.revealState),
            onComplete: () => {
              this.timeline.pause(0), n();
            }
          });
        });
        return;
      }
      if (e === "wipe") {
        const n = this.revealState, r = this.timeline.progress();
        if (this.timeline.pause(), r <= 0) {
          this.timeline.pause(0), et(n);
          return;
        }
        const i = Math.max(0.02, this.timeline.duration() * r);
        n.wipe = { value: 0 }, await new Promise((s) => {
          this.wipeTween = this.engine.to(n.wipe, {
            value: 1,
            duration: i,
            ease: "power1.out",
            onUpdate: () => this.revealState && et(this.revealState),
            onComplete: () => {
              this.wipeTween = null, this.revealState && (this.revealState.wipe = null), this.timeline.pause(0), this.revealState && et(this.revealState), s();
            }
          });
        });
        return;
      }
      await this.reverseToStart();
    }
  }
  /** Play the timeline backwards to progress 0 and resolve when it lands. */
  reverseToStart() {
    return new Promise((e) => {
      const n = () => {
        (this.timeline.progress() <= 0 || this.removed) && (this.engine.ticker.remove(n), e());
      };
      this.engine.ticker.add(n), this.timeline.reverse();
    });
  }
  remove() {
    this.removed || (this.removed = !0, this.stopObserving(), this.cancelFade(), this.cancelWipe(), this.timeline.kill(), this.revealState && Jn(this.revealState), Ti(this.overlay));
  }
  isShowing() {
    return this.showing;
  }
  refresh() {
    this.removed || this.rebuildPreservingProgress();
  }
  update(e) {
    this.removed || (this.config = { ...this.config, ...e }, e.seed !== void 0 && (this.seedValue = e.seed), this.rebuildPreservingProgress());
  }
  // -- internals ------------------------------------------------------------
  cancelFade() {
    this.fadeTween && (this.fadeTween.kill(), this.fadeTween = null), this.revealState && (this.revealState.alpha.value = 1);
  }
  cancelWipe() {
    this.wipeTween && (this.wipeTween.kill(), this.wipeTween = null), this.revealState && (this.revealState.wipe = null);
  }
  /**
   * Measure line rects with every brushmark overlay inside the element
   * hidden — each annotation's canvas would otherwise contribute a
   * full-element rect to the Range (multiple annotations can share a host).
   */
  measureLines() {
    const e = this.element.querySelectorAll(".brushmark-overlay"), n = [];
    e.forEach((r, i) => {
      n[i] = r.style.display, r.style.display = "none";
    });
    try {
      return ui(this.element, this.config.multiline !== !1);
    } finally {
      e.forEach((r, i) => {
        r.style.display = n[i];
      });
    }
  }
  toRelative(e) {
    const n = this.element.getBoundingClientRect();
    return e.map((r) => ({ x: r.x - n.left, y: r.y - n.top, w: r.w, h: r.h }));
  }
  onLayoutChange() {
    if (!this.built || this.removed) return;
    const e = this.measureLines();
    di(this.toRelative(e), this.lastRelativeLines) || this.rebuildPreservingProgress();
  }
  rebuildPreservingProgress() {
    const e = this.timeline.progress(), n = this.timeline.paused();
    this.build(), this.revealState && (this.config.onResize === "replay" && this.showing ? this.timeline.restart() : (this.timeline.progress(e), n && this.timeline.pause()), et(this.revealState));
  }
  /** Measure, build geometry, render art, refill the timeline. */
  build() {
    var z, U, Y;
    const e = this.element, n = this.config, r = Math.max(1, window.devicePixelRatio || 1), i = this.measureLines();
    if (this.lastRelativeLines = this.toRelative(i), i.length === 0) return;
    const s = getComputedStyle(e), o = parseFloat(s.fontSize) || 16, a = i[0].h || o * 1.2, c = hi(n.padding, n.type === "highlight" ? 1 : 4), l = i.map((A) => fi(A, c)), h = Gt(l);
    let u = null;
    if (Ia.has(n.type)) {
      const A = Ri(e, i);
      A && (u = A.map(
        (B) => B.map((X) => ({ x: X.x - h.x, y: X.y - h.y, w: X.w, h: X.h }))
      ));
    }
    const f = pa(n.brush, o), m = {
      lines: l.map((A) => ({
        x: A.x - h.x,
        y: A.y - h.y,
        w: A.w,
        h: A.h
      })),
      wordBoxes: u,
      config: n,
      seed: this.seedValue,
      fontSize: o,
      lineHeight: a,
      weightFinal: f.weightFinal,
      strokeWidthEstimate: ya(f.name, f.weightFinal)
    };
    /* VENDOR PATCH (presentation-test): element-local → annotation-local
       mapping for type "path" (mirrors src/core/annotation.ts). */
    if (n.type === "path") {
      const A = e.getBoundingClientRect();
      m.pathTransform = {
        x: A.left - h.x,
        y: A.top - h.y,
        scaleX: e.offsetWidth ? A.width / e.offsetWidth : 1,
        scaleY: e.offsetHeight ? A.height / e.offsetHeight : 1
      };
    }
    const g = mi(m);
    if (g.length === 0) return;
    const _ = n.type === "highlight" || !!((z = n.brush) != null && z.fill) || !!((U = n.brush) != null && U.hatch);
    Ei(this.overlay, e, _, n.zIndex);
    let p = 1 / 0, b = 1 / 0, w = -1 / 0, R = -1 / 0;
    for (const A of g) {
      const B = Math.max(A.maskWidth / 2 + 4, 10);
      for (const X of A.polyline)
        p = Math.min(p, X[0] - B), b = Math.min(b, X[1] - B), w = Math.max(w, X[0] + B), R = Math.max(R, X[1] + B);
      A.sweepBox && (p = Math.min(p, A.sweepBox.x), b = Math.min(b, A.sweepBox.y), w = Math.max(w, A.sweepBox.x + A.sweepBox.w), R = Math.max(R, A.sweepBox.y + A.sweepBox.h));
    }
    const k = -p, T = -b;
    for (const A of g)
      A.polyline = A.polyline.map((B) => [B[0] + k, B[1] + T, B[2]]), A.sweepBox && (A.sweepBox = { ...A.sweepBox, x: A.sweepBox.x + k, y: A.sweepBox.y + T });
    const P = w - p, L = R - b;
    Ai(
      this.overlay,
      { x: h.x + p, y: h.y + b, w: P, h: L },
      r
    );
    const S = va().render({
      strokes: g,
      resolved: f,
      widthCss: P,
      heightCss: L,
      dpr: r,
      seed: this.seedValue
    }), I = [...new Set(g.map((A) => A.group))].sort((A, B) => A - B), D = new Map(this.groups.map((A) => [A.order, A.progress.value]));
    this.groups = I.map((A) => {
      const B = g.filter((X) => X.group === A);
      return {
        progress: { value: D.get(A) ?? 0 },
        order: A,
        strokes: B,
        lengthPx: B.reduce((X, Ht) => X + Ht.lengthPx, 0)
      };
    });
    const F = ((Y = this.revealState) == null ? void 0 : Y.alpha.value) ?? 1;
    this.revealState && Jn(this.revealState), this.revealState = {
      overlayCtx: this.overlay.ctx,
      widthCss: P,
      heightCss: L,
      dpr: r,
      layers: S,
      groups: this.groups,
      direction: this.config.direction ?? "ltr",
      alpha: { value: F },
      wipe: null,
      engine: this.engine,
      dirty: !1
    }, Ca(this.timeline, this.groups, this.revealState, this.config), this.built = !0, ni(this.revealState);
  }
}
function za(t, e) {
  const { overlap: n = 0, ...r } = e ?? {}, i = t.length ? t[0].engine : er(), s = i.createTimeline({ paused: !0, ...r });
  for (const o of t) {
    const a = o;
    if (a.engine !== i)
      throw new Error(
        `brushmark: annotationGroup() requires all annotations to share one animation engine — found "${a.engine.name}" and "${i.name}". Call setAnimationEngine() before creating them.`
      );
    a.prepare(), a.timeline.paused(!1), s.add(a.timeline, n > 0 ? `>-${n}` : ">");
  }
  return {
    timeline: s,
    annotations: t,
    async show() {
      for (const o of t) o.beginShowing();
      s.play(0), await s.then();
    },
    hide() {
      s.pause(0);
      for (const o of t) o.hide("instant");
    }
  };
}
export {
  Oa as B,
  za as a,
  er as g,
  Na as l,
  Ba as r,
  La as s
};
