import { EaseFunction, EaseInput } from './engine';
/**
 * GSAP-style named eases for the built-in engine. Families: linear/none,
 * power1..power4, sine, expo, circ, back, elastic, bounce. Suffixes .in /
 * .out / .inOut; a bare family name means .out (gsap convention).
 */
export type EaseDir = "in" | "out" | "inOut";
/** "power2.out" → { family: "power2", dir: "out" }. Strips "(…)" params. */
export declare function splitEase(name: string): {
    family: string;
    dir: EaseDir;
};
/** Resolve an ease input to a function; unknown names warn once and fall back. */
export declare function parseEase(input: EaseInput | undefined): EaseFunction;
