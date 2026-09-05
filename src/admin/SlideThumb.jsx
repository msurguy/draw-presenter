import React from "react";
import { SlideProvider } from "../deck/SlideContext.jsx";

// A live, honest miniature of the real slide: the actual component mounted
// inert (no timeline playback, videos paused, render-once 3D) and scaled down.
export default function SlideThumb({ slide }) {
  return (
    <div className="thumb">
      <div
        className="thumb-stage"
        style={{ background: slide.meta.background || "var(--bg)" }}
      >
        <ThumbBoundary>
          <SlideProvider isActive={false} isPreview revealAll>
            <div className="slide-root">
              <slide.Component assets={slide.assets} />
            </div>
          </SlideProvider>
        </ThumbBoundary>
      </div>
    </div>
  );
}

class ThumbBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#9ba3ad", fontSize: 60 }}>
          render error
        </div>
      );
    }
    return this.props.children;
  }
}
