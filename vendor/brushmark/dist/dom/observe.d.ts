/**
 * Watch everything that can change the target's line geometry: element and
 * offset-parent resize, window resize (viewport reflow), and web font
 * arrival. Calls back debounced.
 */
export declare function observeLayout(el: HTMLElement, onChange: () => void): () => void;
