import { LineRect } from '../types';
/**
 * Per-word boxes inside each measured DOM line, read directly from the
 * rendered layout with a DOM Range (layout reads only, no writes — no forced
 * reflow). Coordinates are viewport CSS px, so they agree with the line rects
 * by construction: kerning, ligatures, letter-spacing, text-transform and
 * nested markup (e.g. a bold span inside a word) are all reflected exactly.
 *
 * Words are whitespace-separated runs; a word split across nodes by inline
 * markup is merged back into one box, and a word broken across lines
 * (hyphenation, overflow-wrap) contributes one box per line.
 *
 * Returns null when the words don't group into exactly one row per measured
 * line (e.g. `multiline: false` while the text actually wraps) — callers
 * fall back to line-level animation.
 */
export declare function measureWordBoxes(el: HTMLElement, domLines: LineRect[]): LineRect[][] | null;
