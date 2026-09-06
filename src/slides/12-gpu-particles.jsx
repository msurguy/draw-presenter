import React, { useRef } from "react";
import gsap from "gsap";
import { compute, storage } from "vgpu";
import ThreeGpuScene from "../components/ThreeGpuScene.jsx";
import StepCall from "../components/StepCall.jsx";
import HersheyText from "../components/HersheyText.jsx";
import Appear from "../components/Appear.jsx";
import { particleSimShader } from "../shaders/particles.wgsl.js";
import { loadFont } from "../hershey/fontLoader.js";
import { createTextPaths } from "../hershey/textLayout.js";

export const meta = {
  id: "12-gpu-particles",
  title: "A million points (vgpu × Three.js)",
  background: "#050508",
  transition: { kind: "halftone-shader", duration: 1.2, params: { color: "#08080c" } },
};

// 1024² particles. vgpu's compute shader moves them; Three.js draws them
// from the very same GPU buffer — the two libraries share one GPUDevice.
const COUNT = 1024 * 1024;
const TARGETS = 256 * 1024;
const WORD = "vgpu + three.js";

export default function Slide() {
  const sceneRef = useRef(null); // { setMode }
  const fpsRef = useRef(null);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <ThreeGpuScene
        background="#050508"
        camera={{ fov: 38, position: [0, 0.4, 5.2] }}
        fallback={
          <p style={{ position: "absolute", left: 120, top: 540, fontSize: 28, color: "var(--muted)" }}>
            This slide needs WebGPU — open it in Chrome, Edge or Safari 26+.
          </p>
        }
        setup={async ({ scene, camera, renderer, gpu, THREE, TSL }) => {
          const { instancedArray, instanceIndex, uv, vec3, vec4, float, mix, smoothstep, uniform, Fn } = TSL;

          // ---- Three.js side: one instanced sprite per particle -------------
          const positions = instancedArray(COUNT, "vec4"); // StorageInstancedBufferAttribute
          const arr = positions.value.array;
          for (let i = 0; i < COUNT; i++) {
            // start as a thin spinning disc
            const a = Math.random() * Math.PI * 2;
            const r = 0.3 + Math.sqrt(Math.random()) * 2.0;
            arr[i * 4 + 0] = Math.cos(a) * r;
            arr[i * 4 + 1] = (Math.random() - 0.5) * 0.25;
            arr[i * 4 + 2] = Math.sin(a) * r;
            arr[i * 4 + 3] = 0;
          }

          const size = uniform(0.008);
          const glow = uniform(0.09);
          const mat = new THREE.SpriteNodeMaterial();
          mat.transparent = true;
          mat.depthWrite = false;
          mat.depthTest = false;
          mat.blending = THREE.AdditiveBlending;
          const particle = positions.element(instanceIndex);
          mat.positionNode = particle.xyz;
          mat.scaleNode = size.mul(float(1).add(particle.w.mul(0.35)));
          mat.colorNode = Fn(() => {
            const d = uv().sub(0.5).length();
            const disc = smoothstep(0.5, 0.12, d);
            const speed = smoothstep(0.3, 1.3, particle.w);
            const ink = vec3(0.56, 0.71, 0.91); // brand-2 blue
            const hot = vec3(1.0, 0.8, 0.2); // gold accent
            const col = mix(ink, hot, speed).mul(disc).mul(glow);
            return vec4(col, disc.mul(glow));
          })();

          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
          mesh.count = COUNT;
          mesh.frustumCulled = false;
          scene.add(mesh);

          // First render uploads the attribute → Three creates the GPUBuffer.
          renderer.render(scene, camera);
          const gpuBuffer = renderer.backend.get(positions.value).buffer;
          if (!gpuBuffer) throw new Error("Three.js did not allocate the particle buffer");
          // vgpu wraps the caller-owned buffer without taking ownership.
          const particles = gpu.device.wrapBuffer(gpuBuffer);

          // ---- vgpu side: compute writes into Three's buffer ------------------
          const velocities = storage(gpu, COUNT * 16, "read-write");
          const vel = new Float32Array(COUNT * 4);
          for (let i = 0; i < COUNT; i++) vel[i * 4 + 3] = Math.random();
          velocities.write(vel);

          const targets = storage(gpu, TARGETS * 16, "read");
          targets.write(knotTargets(TARGETS)); // placeholder until a mode needs them

          const sim = compute(gpu, particleSimShader, {
            set: {
              params: { time: 0, dt: 0, attract: 0, burst: 0, noiseScale: 0.9, flowSpeed: 0.14, stiffness: 14, spread: 0.006 },
              particles,
              velocities,
              targets,
            },
          });

          // ---- modes / build steps ------------------------------------------
          // Warm up: a couple of seconds of simulated flow before the first
          // frame, so the slide opens on developed wisps instead of a disc.
          for (let k = 0; k < 150; k++) {
            sim.set({ params: { time: k / 60, dt: 1 / 60 } });
            sim.dispatch(Math.ceil(COUNT / 256));
          }

          const p = { attract: 0, burst: 0 };
          const view = { angle: Math.PI / 2, spin: 0.16, height: 0.45, radius: 5.2 };
          let textPoints = null;
          const textReady = wordTargets(WORD, TARGETS).then((pts) => (textPoints = pts));

          const setMode = (mode, how) => {
            const instant = how === "final";
            const go = (vars, extra = {}) =>
              instant ? Object.assign(p, vars) : gsap.to(p, { duration: 1.6, ease: "power2.inOut", ...vars, ...extra });
            gsap.killTweensOf(p);
            gsap.killTweensOf(view);
            const front = Math.round((view.angle - Math.PI / 2) / (Math.PI * 2)) * Math.PI * 2 + Math.PI / 2;
            if (mode === "flow") {
              go({ attract: 0 });
              if (!instant) {
                p.burst = 1.4; // fling everything outward, then let the flow take over
                gsap.to(p, { burst: 0, duration: 0.5, ease: "power3.out" });
              }
              gsap.to(view, { spin: 0.16, height: 0.45, radius: 5.2, duration: instant ? 0 : 2 });
            } else if (mode === "text") {
              textReady.then(() => textPoints && targets.write(textPoints));
              go({ attract: 1 }, { delay: 0.05 });
              gsap.to(view, { spin: 0, angle: front, height: 0.05, radius: 4.6, duration: instant ? 0 : 1.8, ease: "power2.inOut" });
            } else if (mode === "knot") {
              targets.write(knotTargets(TARGETS));
              if (!instant) {
                p.burst = 0.8;
                gsap.to(p, { burst: 0, duration: 0.4, ease: "power3.out" });
              }
              go({ attract: 1 });
              gsap.to(view, { spin: 0.22, height: 0.9, radius: 4.8, duration: instant ? 0 : 2 });
            }
          };
          sceneRef.current = { setMode };

          let fpsAcc = 0;
          let fpsN = 0;
          let fpsAt = 0;

          return {
            update(t, dt) {
              sim.set({ params: { time: t + 2.5, dt, attract: p.attract, burst: p.burst } });
              sim.dispatch(Math.ceil(COUNT / 256));

              view.angle += view.spin * dt;
              camera.position.set(Math.cos(view.angle) * view.radius, view.height, Math.sin(view.angle) * view.radius);
              camera.lookAt(0, 0, 0);

              if (dt > 0) {
                fpsAcc += dt;
                fpsN++;
                if (t - fpsAt > 0.5) {
                  if (fpsRef.current) fpsRef.current.textContent = `${Math.round(fpsN / fpsAcc)} fps`;
                  fpsAcc = 0;
                  fpsN = 0;
                  fpsAt = t;
                }
              }
            },
            dispose() {
              gsap.killTweensOf(p);
              gsap.killTweensOf(view);
              sceneRef.current = null;
              mesh.geometry.dispose();
              mat.dispose();
              particles.dispose(); // detaches the wrapper; Three still owns the buffer
              velocities.destroy?.();
              targets.destroy?.();
            },
          };
        }}
      />

      <StepCall step={1} on={(how) => sceneRef.current?.setMode("text", how)} />
      <StepCall step={2} on={(how) => sceneRef.current?.setMode("knot", how)} />
      <StepCall step={3} on={(how) => sceneRef.current?.setMode("flow", how)} />

      <div style={{ position: "absolute", left: 120, top: 80 }}>
        <HersheyText font="HersheySans1" size={88} align="left" color="var(--ink-bright)" strokeWidth={2.6} drawDuration={1.4} order={0}>
          One million points
        </HersheyText>
      </div>

      <Appear effect="fade" order={1} delay={0.8} style={{ position: "absolute", left: 122, top: 200, maxWidth: 640, fontSize: 26, lineHeight: 1.5, color: "var(--muted)" }}>
        A vgpu compute shader moves every point. Three.js draws them from the
        same GPU buffer — one device, one queue, zero copies.
      </Appear>

      <Appear effect="fade" order={2} delay={1.2} style={{ position: "absolute", right: 120, top: 92, textAlign: "right", fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: "var(--muted)" }}>
        1,048,576 particles · WebGPU · <span ref={fpsRef}>— fps</span>
      </Appear>

      <div style={{ position: "absolute", left: 120, right: 120, bottom: 70, display: "flex", gap: 18, alignItems: "center", fontSize: 24, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)" }}>
        <Appear effect="fade-up" order={3} delay={1.4}>
          <span style={{ border: "2px solid var(--muted)", borderRadius: 999, padding: "10px 26px" }}>curl-noise flow field</span>
        </Appear>
        <Appear effect="fade-up" step={1}>
          <span style={{ border: "2px solid var(--brand-2)", color: "var(--brand-2)", borderRadius: 999, padding: "10px 26px" }}>Hershey strokes as attractors</span>
        </Appear>
        <Appear effect="fade-up" step={2}>
          <span style={{ border: "2px solid var(--brand-2)", color: "var(--brand-2)", borderRadius: 999, padding: "10px 26px" }}>torus knot</span>
        </Appear>
        <Appear effect="fade-up" step={3}>
          <span style={{ border: "2px solid var(--accent)", color: "var(--accent)", borderRadius: 999, padding: "10px 26px" }}>release</span>
        </Appear>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- targets --

// Points along the pen strokes of a Hershey word, centered, ~3.8 units wide.
async function wordTargets(text, count) {
  const font = await loadFont("HersheySans1", 1);
  const paths = createTextPaths(text, font, { alignment: "center" });
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
  document.body.appendChild(svg);
  const els = paths.map(({ d }) => {
    const el = document.createElementNS(svgNS, "path");
    el.setAttribute("d", d);
    svg.appendChild(el);
    return el;
  });
  const lengths = els.map((el) => el.getTotalLength());
  const total = lengths.reduce((a, b) => a + b, 0) || 1;

  const pts = [];
  els.forEach((el, k) => {
    const n = Math.max(1, Math.round((count * lengths[k]) / total));
    for (let j = 0; j < n; j++) {
      const q = el.getPointAtLength((j / n) * lengths[k]);
      pts.push(q.x, q.y);
    }
  });
  svg.remove();

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    minX = Math.min(minX, pts[i]); maxX = Math.max(maxX, pts[i]);
    minY = Math.min(minY, pts[i + 1]); maxY = Math.max(maxY, pts[i + 1]);
  }
  const scale = 3.9 / Math.max(1e-6, maxX - minX);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const out = new Float32Array(count * 4);
  const m = pts.length / 2;
  for (let i = 0; i < count; i++) {
    const s = i % m;
    out[i * 4 + 0] = (pts[s * 2] - cx) * scale;
    out[i * 4 + 1] = -(pts[s * 2 + 1] - cy) * scale; // SVG y-down → world y-up
    out[i * 4 + 2] = (Math.random() - 0.5) * 0.03;
    out[i * 4 + 3] = 0;
  }
  return out;
}

// Points on the tube surface of a (2,3) torus knot.
function knotTargets(count) {
  const out = new Float32Array(count * 4);
  const P = 2, Q = 3, R = 0.62, TUBE = 0.2;
  const c = (t, o) => {
    const r = 2 + Math.cos(Q * t);
    o[0] = r * Math.cos(P * t) * R;
    o[1] = Math.sin(Q * t) * R * 1.1;
    o[2] = r * Math.sin(P * t) * R;
  };
  const a = [0, 0, 0], b = [0, 0, 0];
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    c(t, a);
    c(t + 0.01, b);
    // tangent, then two perpendiculars
    let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2];
    const tl = Math.hypot(tx, ty, tz) || 1;
    tx /= tl; ty /= tl; tz /= tl;
    let nx = -ty, ny = tx, nz = 0; // ⟂ to tangent (tangent is never vertical here)
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl; ny /= nl; nz /= nl;
    const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
    const cp = Math.cos(phi) * TUBE, sp = Math.sin(phi) * TUBE;
    out[i * 4 + 0] = a[0] + nx * cp + bx * sp;
    out[i * 4 + 1] = a[1] + ny * cp + by * sp;
    out[i * 4 + 2] = a[2] + nz * cp + bz * sp;
    out[i * 4 + 3] = 0;
  }
  return out;
}
