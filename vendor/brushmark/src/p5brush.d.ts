declare module "p5.brush/standalone" {
  export const DEGREES: "degrees";
  export const RADIANS: "radians";

  export function createCanvas(
    width: number,
    height: number,
    options?: { pixelDensity?: number; parent?: string | Element | null; id?: string },
  ): HTMLCanvasElement;
  export function load(target?: HTMLCanvasElement | OffscreenCanvas): void;
  export function render(): void;
  export function clear(...color: unknown[]): void;

  export function push(): void;
  export function pop(): void;
  export function translate(x: number, y: number): void;
  export function rotate(angle: number): void;
  export function scale(x: number, y?: number): void;
  export function angleMode(mode: "degrees" | "radians"): void;

  export function seed(n: number): void;
  export function noiseSeed(n: number): void;
  export function random(min?: number, max?: number): number;
  export function noise(x: number, y?: number, z?: number): number;

  export function add(name: string, params: Record<string, unknown>): void | Promise<void>;
  export function box(): string[];
  export function scaleBrushes(factor: number): void;
  export function pick(name: string): void;
  export function stroke(...color: unknown[]): void;
  export function noStroke(): void;
  export function strokeWeight(weight: number): void;
  export function set(name: string, color?: unknown, weight?: number): void;
  export function clip(region: [number, number, number, number]): void;
  export function noClip(): void;

  export function line(x1: number, y1: number, x2: number, y2: number): void;
  export function flowLine(x: number, y: number, length: number, dir: number): void;
  export function spline(points: Array<[number, number, number?]>, curvature?: number): unknown;
  export function polygon(points: Array<[number, number]>): unknown;
  export function rect(x: number, y: number, w: number, h: number, mode?: string): void;
  export function circle(x: number, y: number, radius: number, r?: boolean): unknown;
  export function arc(x: number, y: number, radius: number, start: number, end: number): unknown;
  export function beginShape(curvature?: number): void;
  export function vertex(x: number, y: number, pressure?: number): void;
  export function endShape(close?: boolean): unknown;
  export function beginStroke(type: string, x: number, y: number): void;
  export function move(angle: number, length: number, pressure?: number): void;
  export function endStroke(angle: number, pressure?: number): void;

  export function fill(...args: unknown[]): void;
  export function noFill(): void;
  export function fillBleed(strength: number, direction?: string): void;
  export function fillTexture(texture: number, border?: number, scatter?: boolean): void;
  export function wash(...args: unknown[]): void;
  export function noWash(): void;

  export function hatch(distance?: number, angle?: number, options?: Record<string, unknown>): void;
  export function hatchStyle(brush: string, color?: unknown, weight?: number): void;
  export function noHatch(): void;
  export function hatchArray(polygons: unknown): void;

  export function field(name: string): void;
  export function noField(): void;
  export function addField(name: string, fn: (t: number, field: number[][]) => number[][], options?: Record<string, unknown>): void;
  export function refreshField(t?: number): void;
  export function listFields(): string[];
  export function wiggle(intensity?: number): void;

  export const Polygon: new (points: Array<[number, number]>) => unknown;
  export const Plot: new (type: string) => unknown;
  export const Position: new (x: number, y: number) => unknown;
}
