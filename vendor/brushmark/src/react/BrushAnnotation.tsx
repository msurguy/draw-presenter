import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { BrushTimeline } from "../animation/engine";
import type { AnnotationConfig, BrushAnnotation as BrushAnnotationHandle } from "../types";
import { useBrushAnnotation } from "./useBrushAnnotation";

export interface GroupContextValue {
  register(order: number, annotation: BrushAnnotationHandle): void;
  unregister(annotation: BrushAnnotationHandle): void;
  nextOrder(): number;
}

export const GroupContext = createContext<GroupContextValue | null>(null);

export interface BrushAnnotationProps extends AnnotationConfig {
  /** Declarative visibility (default true: draws on mount) */
  show?: boolean;
  /** Wrapper tag — inline elements measure wrapped lines correctly */
  as?: keyof React.JSX.IntrinsicElements;
  /** Called with the annotation's timeline (adopt it, don't re-parent) */
  onTimeline?: (tl: BrushTimeline) => void;
  className?: string;
  children: ReactNode;
}

export function BrushAnnotation({
  show = true,
  as: Tag = "span",
  onTimeline,
  className,
  children,
  ...config
}: BrushAnnotationProps) {
  const group = useContext(GroupContext);
  const orderRef = useRef<number | null>(null);
  if (group && orderRef.current === null) orderRef.current = group.nextOrder();

  const { ref, annotation } = useBrushAnnotation<HTMLElement>({
    ...config,
    // Inside a group the master timeline drives visibility.
    show: group ? undefined : show,
  });

  useEffect(() => {
    if (annotation && onTimeline) {
      annotation.prepare();
      onTimeline(annotation.timeline);
    }
  }, [annotation, onTimeline]);

  useEffect(() => {
    if (!group || !annotation) return;
    group.register(orderRef.current ?? 0, annotation);
    return () => group.unregister(annotation);
  }, [group, annotation]);

  const Component = Tag as "span";
  return (
    <Component ref={ref as React.Ref<HTMLSpanElement>} className={className}>
      {children}
    </Component>
  );
}
