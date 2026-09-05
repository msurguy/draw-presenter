import React from "react";
import * as THREE from "three";
import { effect as vgpuEffect, frame, surface } from "vgpu";
import ThreeScene from "../components/ThreeScene.jsx";
import HersheyText from "../components/HersheyText.jsx";

export const meta = {
  id: "13-three-scene",
  title: "Three.js × WGSL",
  background: "#08080c",
  transition: { kind: "shatter-shader", duration: 1.3, params: { color: "#ffcc33" } },
};

const TEXTURE_SIZE = 512;

// WGSL rainbow drawn by vgpu into an offscreen canvas, uploaded to Three.js
// as the cube's texture every frame.
const rainbowShader = /* wgsl */ `
struct Params {
  time: f32,
  speed: f32,
  bands: f32,
  swirl: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

const TAU = 6.2831853;

fn palette(t: f32) -> vec3f {
  let a = vec3f(0.5, 0.5, 0.5);
  let b = vec3f(0.5, 0.5, 0.5);
  let c = vec3f(1.0, 1.0, 1.0);
  let d = vec3f(0.0, 0.33, 0.67);
  return a + b * cos(TAU * (c * t + d));
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let p = uv - vec2f(0.5);
  let radius = length(p);
  let angle = atan2(p.y, p.x);
  let t = params.time * params.speed;
  let hue = angle / TAU + radius * params.swirl + t;
  var color = palette(hue);
  let ring = sin(radius * params.bands - t * TAU);
  color *= 0.82 + 0.18 * ring;
  color += 0.12 * exp(-radius * 6.0);
  return vec4f(clamp(color, vec3f(0.0), vec3f(1.0)), 1.0);
}
`;

export default function Slide() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <ThreeScene
        background="#08080c"
        camera={{ fov: 45, position: [2.6, 2.0, 3.4] }}
        setup={({ scene, gpu, renderer }) => {
          let drawRainbow = null;
          let rainbowTexture = null;
          let fx = null;

          const geo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
          let mat;

          if (gpu) {
            const shaderCanvas = document.createElement("canvas");
            shaderCanvas.width = TEXTURE_SIZE;
            shaderCanvas.height = TEXTURE_SIZE;
            const shaderSurface = surface(gpu, shaderCanvas, { size: [TEXTURE_SIZE, TEXTURE_SIZE], alphaMode: "opaque" });
            fx = vgpuEffect(gpu, rainbowShader, { set: { params: { time: 0, speed: 0.12, bands: 34, swirl: 0.85 } } });
            drawRainbow = () => frame(gpu, (f) => f.pass(shaderSurface, fx));
            drawRainbow();

            rainbowTexture = new THREE.CanvasTexture(shaderCanvas);
            rainbowTexture.colorSpace = THREE.SRGBColorSpace;
            rainbowTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            mat = new THREE.MeshStandardMaterial({
              map: rainbowTexture,
              emissiveMap: rainbowTexture,
              emissive: 0xffffff,
              emissiveIntensity: 0.28,
              roughness: 0.35,
              metalness: 0.1,
            });
          } else {
            // No WebGPU: still show the cube, just without the shader skin.
            mat = new THREE.MeshStandardMaterial({ color: 0x1c76e1, roughness: 0.35 });
          }

          const cube = new THREE.Mesh(geo, mat);
          scene.add(cube);
          scene.add(new THREE.AmbientLight(0xffffff, 0.3));
          const key = new THREE.DirectionalLight(0xffffff, 2.0);
          key.position.set(3, 4, 2);
          scene.add(key);
          const rim = new THREE.DirectionalLight(0x88aaff, 0.7);
          rim.position.set(-3, -1, -2);
          scene.add(rim);

          return {
            update(t) {
              if (fx && drawRainbow) {
                fx.set({ params: { time: t } });
                drawRainbow();
                rainbowTexture.needsUpdate = true;
              }
              cube.rotation.x = t * 0.35;
              cube.rotation.y = t * 0.5;
            },
            dispose() {
              geo.dispose();
              mat.dispose();
              rainbowTexture?.dispose();
            },
          };
        }}
      />

      <div style={{ position: "absolute", left: 120, top: 90 }}>
        <HersheyText font="HersheySans1" size={72} align="left" color="var(--ink-bright)" strokeWidth={2.2} drawDuration={1.4}>
          WGSL inside Three.js
        </HersheyText>
      </div>

      <div style={{ position: "absolute", left: 122, top: 210, fontSize: 26, color: "var(--muted)", maxWidth: 560, lineHeight: 1.5 }}>
        A vgpu fragment shader renders to an offscreen canvas; Three.js re-uploads
        it as the cube's texture each frame.
      </div>
    </div>
  );
}
