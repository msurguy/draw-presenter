import { AnnotationConfig, BrushAnnotation } from '../types';
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
export declare function useBrushAnnotation<T extends HTMLElement = HTMLElement>(options: UseBrushAnnotationOptions): UseBrushAnnotationResult<T>;
