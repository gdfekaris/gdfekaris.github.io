import { useState, useEffect } from "react";

// Pieces used by both pages

export const WIN_COLORS = {
  titleBar: "#000080",
  titleText: "#FFFFFF",
  borderDark: "#808080",
  borderLight: "#FFFFFF",
  bg: "#C0C0C0",
};

export const LINKS = {
  about: "/about",
  linkedin: "https://www.linkedin.com/in/george-dino-fekaris/",
  github: "https://github.com/gdfekaris",
};

export function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const onResize = () => setVp(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return vp;
}

// Props for a real <a>, so links work with the keyboard, screen readers,
// long-press and middle-click. Internal paths navigate in-app unless a
// modifier key asks for a new tab or window.
export function linkProps(href) {
  if (!href.startsWith('/')) return { href, target: "_blank", rel: "noopener noreferrer" };
  return {
    href,
    onClick: (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    },
  };
}

/* ── Scanline overlay ── */
export function ScanlineOverlay() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99998,
      background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)",
      mixBlendMode: "multiply",
    }} />
  );
}

/* ── Title-bar _ □ × buttons (decorative: hidden from screen readers and the tab order) ── */
export function TitleBarButtons() {
  return (
    <div aria-hidden="true" style={{ display: "flex", gap: 2 }}>
      {["_", "□", "×"].map((btn, i) => (
        <button key={i} tabIndex={-1} style={{
          width: 16, height: 14, fontSize: 10, lineHeight: "10px",
          border: "1px outset #ddd", background: "#c0c0c0",
          cursor: "inherit", padding: 0, fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {btn}
        </button>
      ))}
    </div>
  );
}
