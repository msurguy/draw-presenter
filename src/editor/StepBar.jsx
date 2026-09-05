import React from "react";

// Final (everything built, static) vs Steps (timeline paused at a step).
export default function StepBar({ mode, step, maxStep, onMode, onStep, onPlay }) {
  return (
    <div className="ed-stepbar">
      <span className="label">Preview</span>
      <div className="ed-btngroup">
        <button className={`ed-btn small${mode === "final" ? " active" : ""}`} onClick={() => onMode("final")} title="all steps built, no animation">
          Final
        </button>
        <button className={`ed-btn small${mode === "steps" ? " active" : ""}`} onClick={() => onMode("steps")} title="scrub build steps">
          Steps
        </button>
      </div>
      {mode === "steps" && (
        <>
          <span className="label">step</span>
          <div className="ed-btngroup">
            {Array.from({ length: maxStep + 1 }, (_, k) => (
              <button key={k} className={`ed-btn small${step === k ? " active" : ""}`} onClick={() => onStep(k)}>
                {k}
              </button>
            ))}
          </div>
          <button className="ed-btn small" onClick={onPlay} title="replay this step's entrances">
            ▶ Play step {step}
          </button>
          <span className="label">[ / ] to change step</span>
        </>
      )}
    </div>
  );
}
