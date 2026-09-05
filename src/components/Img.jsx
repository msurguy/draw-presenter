import React from "react";

// Positioned image for the 1920×1080 stage. Give it x/y/width (stage pixels)
// or position it yourself via `style`. Wrap in <Appear> to animate it in.
export default function Img({ src, alt = "", x, y, width, height, className, style, ...rest }) {
  const positioned = x != null || y != null;
  return (
    <img
      {...rest}
      src={src}
      alt={alt}
      draggable={false}
      className={className}
      style={{
        ...(positioned ? { position: "absolute", left: x ?? 0, top: y ?? 0 } : {}),
        ...(width != null ? { width } : {}),
        ...(height != null ? { height } : {}),
        ...style,
      }}
    />
  );
}
