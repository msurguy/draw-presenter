import { domTransitions } from "./domTransitions.js";
import { shaderTransitions } from "./shaderTransitions.js";
import { TRANSITION_GROUPS } from "./params.js";

export { TRANSITION_PARAMS, transitionParamFields, pruneParams } from "./params.js";

// Transition contract:
//   run({ outgoingEl, incomingEl, stageEl, duration, params, reverse, onRevealed, onComplete })
//     → gsap timeline/tween (must support .progress(), .reverse(0) and .kill()), or null.
// Every transition MUST eventually call onRevealed() (releases the incoming
// slide's entrance timeline) and onComplete() (unmounts the outgoing slide) —
// on forward completion, on reverse completion (`reverse: true` means the
// host will play the timeline backwards from its end; skip any synchronous
// "hide incomingEl before the first tick" setup in that case) and on kill.
const registry = {
  ...domTransitions,
  ...shaderTransitions,
};

export function resolveTransition(transition = {}) {
  const kind = transition.kind || "fade";
  if (registry[kind]) return { kind, run: registry[kind] };
  console.warn(`[deck] unknown transition kind "${kind}" — falling back to fade.`);
  return { kind: "fade", run: registry.fade };
}

export function transitionKinds() {
  return Object.keys(registry);
}

/** Grouped select options for the editor: [{ value, label, group }]. */
export function transitionOptions() {
  const seen = new Set();
  const out = [];
  for (const g of TRANSITION_GROUPS) {
    for (const kind of g.kinds) {
      if (!registry[kind]) continue;
      seen.add(kind);
      out.push({ value: kind, label: kind, group: g.label });
    }
  }
  for (const kind of Object.keys(registry)) {
    if (!seen.has(kind)) out.push({ value: kind, label: kind, group: "Other" });
  }
  return out;
}
