import React, { useEffect, useState } from "react";
import { startBuild, getBuildStatus } from "../admin/api.js";

// "Build" button: runs `vite build` on the server, polls status, links to the
// preview server for dist/.
export default function BuildPanel({ notify }) {
  const [status, setStatus] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [now, setNow] = useState(Date.now());

  const poll = () => getBuildStatus().then(setStatus).catch(() => {});
  useEffect(() => {
    poll();
  }, []);
  useEffect(() => {
    if (status?.state !== "running") return;
    const t = setInterval(() => {
      setNow(Date.now());
      poll();
    }, 1000);
    return () => clearInterval(t);
  }, [status?.state]);

  const run = async () => {
    try {
      const s = await startBuild();
      setStatus(s);
      setShowLog(false);
    } catch (err) {
      notify?.(`Build: ${err.message}`);
    }
  };

  const secs = (ms) => `${(ms / 1000).toFixed(1)} s`;
  let text = "";
  let cls = "";
  if (status?.state === "running") {
    text = `building… ${secs(now - status.startedAt)}`;
  } else if (status?.state === "ok") {
    text = `built in ${secs(status.durationMs)}`;
    cls = "ok";
  } else if (status?.state === "error") {
    text = `build failed (exit ${status.exitCode})`;
    cls = "error";
  }

  return (
    <div className="ed-build">
      <button className="ed-btn accent" onClick={run} disabled={status?.state === "running"} title="run `vite build` into dist/">
        {status?.state === "running" ? "Building…" : "Build"}
      </button>
      {text && (
        <span className={`status ${cls}`}>
          {text}
          {status?.log && (
            <>
              {" · "}
              <button className="ed-btn small" onClick={() => setShowLog((v) => !v)}>
                log
              </button>
            </>
          )}
        </span>
      )}
      {status?.state === "ok" && status.previewUrl && (
        <a className="ed-btn small" href={status.previewUrl} target="_blank" rel="noreferrer">
          Open preview ↗
        </a>
      )}
      {showLog && status?.log && <pre className="log">{status.log}</pre>}
    </div>
  );
}
