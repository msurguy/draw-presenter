import React, { useEffect, useRef } from "react";
import { useSlide } from "../deck/SlideContext.jsx";

// Muted, autoplaying, looping video. Plays only while its slide is active.
// When the slide becomes outgoing during a transition it just pauses, freezing
// the current frame — never rewind here: the element is still visible under
// the transition, and a currentTime reset reads as a visible jump. Re-entry
// remounts the slide, so a fresh element starts at frame 0 anyway.
export default function VideoLayer({
  src,
  fit = "cover", // 'cover' | 'contain'
  loop = true,
  playbackRate = 1,
  poster,
  opacity = 1,
  className,
  style,
  ...rest // data-* attributes (the editor's data-loc) reach the DOM
}) {
  const ref = useRef(null);
  const { isActive, isPreview } = useSlide();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.playbackRate = playbackRate;
    if (isActive && !isPreview) {
      video.play().catch(() => {
        /* autoplay policies never block muted video, but be safe */
      });
    } else {
      video.pause();
    }
  }, [isActive, isPreview, playbackRate, src]);

  return (
    <video
      {...rest}
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop={loop}
      playsInline
      preload="auto"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: fit,
        opacity,
        ...style,
      }}
    />
  );
}
