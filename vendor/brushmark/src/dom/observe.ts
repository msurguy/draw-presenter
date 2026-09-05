const DEBOUNCE_MS = 250;

/**
 * Watch everything that can change the target's line geometry: element and
 * offset-parent resize, window resize (viewport reflow), and web font
 * arrival. Calls back debounced.
 */
export function observeLayout(el: HTMLElement, onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  const trigger = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!disposed) onChange();
    }, DEBOUNCE_MS);
  };

  const ro = new ResizeObserver(trigger);
  ro.observe(el);
  if (el.offsetParent instanceof HTMLElement && el.offsetParent !== document.body) {
    ro.observe(el.offsetParent);
  }

  window.addEventListener("resize", trigger, { passive: true });

  let fontsPending = true;
  if (document.fonts?.status === "loading") {
    document.fonts.ready.then(() => {
      if (fontsPending && !disposed) trigger();
    });
  } else {
    fontsPending = false;
  }

  return () => {
    disposed = true;
    fontsPending = false;
    if (timer) clearTimeout(timer);
    ro.disconnect();
    window.removeEventListener("resize", trigger);
  };
}
