import { jsx as g } from "react/jsx-runtime";
import { useRef as l, useState as w, useMemo as h, useEffect as p, useContext as y, createContext as C, useCallback as R } from "react";
import { B as v, a as B } from "./group-ZfSWLnUM.js";
function S(s) {
  const { show: c, ...o } = s, i = l(null), [r, f] = w(null), n = h(
    () => JSON.stringify(o, (u, t) => typeof t == "function" ? t.toString() : t),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(o, (u, t) => typeof t == "function" ? t.toString() : t)]
  );
  return p(() => {
    const u = i.current;
    if (!u) return;
    const t = new v(u, o);
    return f(t), () => {
      t.remove(), f((e) => e === t ? null : e);
    };
  }, [n]), p(() => {
    !r || c === void 0 || (c ? r.show() : r.hide());
  }, [r, c]), {
    ref: i,
    annotation: r,
    show: () => void (r == null ? void 0 : r.show()),
    hide: () => void (r == null ? void 0 : r.hide())
  };
}
const x = C(null);
function G({
  show: s = !0,
  as: c = "span",
  onTimeline: o,
  className: i,
  children: r,
  ...f
}) {
  const n = y(x), u = l(null);
  n && u.current === null && (u.current = n.nextOrder());
  const { ref: t, annotation: e } = S({
    ...f,
    // Inside a group the master timeline drives visibility.
    show: n ? void 0 : s
  });
  return p(() => {
    e && o && (e.prepare(), o(e.timeline));
  }, [e, o]), p(() => {
    if (!(!n || !e))
      return n.register(u.current ?? 0, e), () => n.unregister(e);
  }, [n, e]), /* @__PURE__ */ g(c, { ref: t, className: i, children: r });
}
function b({
  show: s = !0,
  overlap: c = 0,
  onTimeline: o,
  children: i
}) {
  const r = l(/* @__PURE__ */ new Map()), f = l(0), n = l(null), u = l(s);
  u.current = s;
  const t = R(() => {
    n.current !== null && cancelAnimationFrame(n.current), n.current = requestAnimationFrame(() => {
      if (n.current = null, !u.current || r.current.size === 0) return;
      const a = [...r.current.entries()].sort((m, A) => m[1] - A[1]).map(([m]) => m), d = B(a, { overlap: c });
      o == null || o(d.timeline), d.show();
    });
  }, [c, o]), e = h(
    () => ({
      nextOrder: () => f.current++,
      register(a, d) {
        r.current.set(d, a), t();
      },
      unregister(a) {
        r.current.delete(a);
      }
    }),
    [t]
  );
  return p(() => (s && t(), () => {
    n.current !== null && cancelAnimationFrame(n.current);
  }), [s, t]), /* @__PURE__ */ g(x.Provider, { value: e, children: i });
}
export {
  G as BrushAnnotation,
  b as BrushAnnotationGroup,
  S as useBrushAnnotation
};
