import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { annotationGroup } from "../core/group";
import type { BrushTimeline } from "../animation/engine";
import type { BrushAnnotation as BrushAnnotationHandle } from "../types";
import { GroupContext, type GroupContextValue } from "./BrushAnnotation";

export interface BrushAnnotationGroupProps {
  /** Play the sequenced group when true (default true) */
  show?: boolean;
  /** Seconds of overlap between consecutive annotations */
  overlap?: number;
  onTimeline?: (tl: BrushTimeline) => void;
  children: ReactNode;
}

/**
 * Sequences child <BrushAnnotation>s in render order on one master timeline.
 */
export function BrushAnnotationGroup({
  show = true,
  overlap = 0,
  onTimeline,
  children,
}: BrushAnnotationGroupProps) {
  const membersRef = useRef(new Map<BrushAnnotationHandle, number>());
  const counterRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const showRef = useRef(show);
  showRef.current = show;

  const play = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    // Batch: children register one by one during mount; play on next frame.
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!showRef.current || membersRef.current.size === 0) return;
      const ordered = [...membersRef.current.entries()]
        .sort((a, b) => a[1] - b[1])
        .map(([a]) => a);
      const group = annotationGroup(ordered, { overlap });
      onTimeline?.(group.timeline);
      void group.show();
    });
  }, [overlap, onTimeline]);

  const ctx = useMemo<GroupContextValue>(
    () => ({
      nextOrder: () => counterRef.current++,
      register(order, annotation) {
        membersRef.current.set(annotation, order);
        play();
      },
      unregister(annotation) {
        membersRef.current.delete(annotation);
      },
    }),
    [play],
  );

  useEffect(() => {
    if (show) play();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [show, play]);

  return <GroupContext.Provider value={ctx}>{children}</GroupContext.Provider>;
}
