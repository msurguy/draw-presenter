import { useEffect, useMemo, useRef, useState } from "react";
import { BrushAnnotationImpl } from "../core/annotation";
import type { AnnotationConfig, BrushAnnotation } from "../types";

export interface UseBrushAnnotationOptions extends AnnotationConfig {
  /** Declarative visibility. Omit to control via the returned show/hide. */
  show?: boolean;
}

export interface UseBrushAnnotationResult<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  annotation: BrushAnnotation | null;
  show: () => void;
  hide: () => void;
}

/**
 * Attach a brush annotation to a ref'd element. The annotation is recreated
 * when the config meaningfully changes and removed on unmount
 * (StrictMode-safe: create/remove are idempotent).
 */
export function useBrushAnnotation<T extends HTMLElement = HTMLElement>(
  options: UseBrushAnnotationOptions,
): UseBrushAnnotationResult<T> {
  const { show, ...config } = options;
  const ref = useRef<T | null>(null);
  const [annotation, setAnnotation] = useState<BrushAnnotation | null>(null);

  // Structural identity for the config, so callers can pass inline objects.
  const configKey = useMemo(
    () => JSON.stringify(config, (_k, v) => (typeof v === "function" ? v.toString() : v)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(config, (_k, v) => (typeof v === "function" ? v.toString() : v))],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const a = new BrushAnnotationImpl(el, config);
    setAnnotation(a);
    return () => {
      a.remove();
      setAnnotation((cur) => (cur === a ? null : cur));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  useEffect(() => {
    if (!annotation || show === undefined) return;
    if (show) void annotation.show();
    else void annotation.hide();
  }, [annotation, show]);

  return {
    ref,
    annotation,
    show: () => void annotation?.show(),
    hide: () => void annotation?.hide(),
  };
}
