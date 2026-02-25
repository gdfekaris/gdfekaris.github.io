import { useState, useEffect } from "react";

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return mobile;
}

const WIN_COLORS = {
  titleBar: "#000080",
  titleText: "#FFFFFF",
  borderDark: "#808080",
  borderLight: "#FFFFFF",
  bg: "#C0C0C0",
};

function navigate(path) {
  history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/* ── Scanline overlay ── */
function ScanlineOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 99998,
        background:
          "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)",
        mixBlendMode: "multiply",
      }}
    />
  );
}

/* ── Menu item with hover ── */
function MenuItem({ label, onClick, bold }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "2px 8px",
        cursor: onClick ? "pointer" : "default",
        background: hovered ? WIN_COLORS.titleBar : "transparent",
        color: hovered ? "#fff" : "#000",
        fontWeight: bold ? "bold" : "normal",
      }}
    >
      {label}
    </div>
  );
}

/* ── Toolbar button ── */
function ToolButton({ label }) {
  return (
    <button
      style={{
        height: 22,
        padding: "2px 6px",
        fontSize: 10,
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        background: "#c0c0c0",
        border: "2px outset #ddd",
        cursor: "default",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

/* ── Ruler ── */
function Ruler() {
  return (
    <div
      style={{
        background: "#fff",
        borderBottom: "1px solid #808080",
        height: 18,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Inch numbers */}
      {Array.from({ length: 17 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 60 + i * 48,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 7, color: "#000", lineHeight: "8px" }}>
            {i > 0 ? i : ""}
          </span>
          <div
            style={{
              width: 1,
              height: i % 2 === 0 ? 6 : 4,
              background: "#000",
            }}
          />
        </div>
      ))}
      {/* Minor ticks */}
      {Array.from({ length: 33 }, (_, i) => (
        <div
          key={`m${i}`}
          style={{
            position: "absolute",
            left: 60 + i * 24,
            bottom: 0,
            width: 1,
            height: 3,
            background: "#808080",
          }}
        />
      ))}
      {/* Left margin marker */}
      <div
        style={{
          position: "absolute",
          left: 56,
          bottom: 0,
          width: 0,
          height: 0,
          borderLeft: "4px solid transparent",
          borderRight: "4px solid transparent",
          borderBottom: "6px solid #000",
        }}
      />
      {/* Right margin marker */}
      <div
        style={{
          position: "absolute",
          left: 60 + 13 * 48,
          bottom: 0,
          width: 0,
          height: 0,
          borderLeft: "4px solid transparent",
          borderRight: "4px solid transparent",
          borderBottom: "6px solid #000",
        }}
      />
    </div>
  );
}

/* ── Main About Page ── */
export default function AboutPage() {
  const isMobile = useIsMobile();
  const toolbarItems = [
    "New",
    "Open",
    "Save",
    "Print",
    "|",
    "Cut",
    "Copy",
    "Paste",
    "|",
    "Undo",
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        cursor: "default",
        background: `
          radial-gradient(ellipse at 30% 20%, #006868 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, #005858 0%, transparent 50%),
          linear-gradient(180deg, #006060 0%, #008080 30%, #007070 70%, #005858 100%)
        `,
        fontFamily:
          '"MS Sans Serif", "Pixelated MS Sans Serif", Arial, sans-serif',
        fontSize: 11,
        userSelect: "none",
      }}
    >
      <ScanlineOverlay />

      {/* Maximized window frame */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          border: `2px solid ${WIN_COLORS.borderDark}`,
          borderTopColor: WIN_COLORS.borderLight,
          borderLeftColor: WIN_COLORS.borderLight,
          background: WIN_COLORS.bg,
        }}
      >
        {/* Inner bevel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            border: "1px solid",
            borderColor: `${WIN_COLORS.borderLight} ${WIN_COLORS.borderDark} ${WIN_COLORS.borderDark} ${WIN_COLORS.borderLight}`,
            padding: 2,
            overflow: "hidden",
          }}
        >
          {/* Title bar */}
          <div
            style={{
              background: `linear-gradient(90deg, ${WIN_COLORS.titleBar}, #1084d0)`,
              color: WIN_COLORS.titleText,
              padding: "2px 4px",
              fontWeight: "bold",
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              letterSpacing: 0.5,
              flexShrink: 0,
            }}
          >
            <span style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.4)" }}>
              About - George D. Fekaris
            </span>
            <div style={{ display: "flex", gap: 2 }}>
              {["_", "□", "×"].map((btn, i) => (
                <button
                  key={i}
                  style={{
                    width: 16,
                    height: 14,
                    fontSize: 10,
                    lineHeight: "10px",
                    border: "1px outset #ddd",
                    background: "#c0c0c0",
                    cursor: "default",
                    padding: 0,
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>

          {/* Menu bar */}
          <div
            style={{
              background: WIN_COLORS.bg,
              borderBottom: "1px solid #808080",
              display: "flex",
              alignItems: "center",
              padding: "1px 0",
              flexShrink: 0,
            }}
          >
            <MenuItem
              label="← Home"
              onClick={() => navigate("/")}
              bold
            />
            {["File", "Edit", "View", "Insert", "Format", "Help"].map(
              (menu) => (
                <MenuItem key={menu} label={menu} />
              )
            )}
          </div>

          {/* Toolbar */}
          <div
            style={{
              background: WIN_COLORS.bg,
              borderBottom: "1px solid #808080",
              display: "flex",
              alignItems: "center",
              padding: "2px 4px",
              gap: 2,
              flexShrink: 0,
            }}
          >
            {toolbarItems.map((item, i) =>
              item === "|" ? (
                <div
                  key={i}
                  style={{
                    width: 1,
                    height: 18,
                    borderLeft: "1px solid #808080",
                    borderRight: "1px solid #fff",
                    margin: "0 2px",
                  }}
                />
              ) : (
                <ToolButton key={i} label={item} />
              )
            )}
          </div>

          {/* Ruler */}
          <Ruler />

          {/* Document area — gray canvas with white page */}
          <div
            style={{
              flex: 1,
              background: "#808080",
              overflow: "auto",
              display: "flex",
              justifyContent: "center",
              padding: "20px 0",
            }}
          >
            {/* White document page */}
            <div
              style={{
                width: isMobile ? "auto" : 640,
                minHeight: 800,
                background: "#fff",
                padding: isMobile ? "32px 20px" : "60px 72px",
                margin: isMobile ? "0 8px" : undefined,
                boxShadow: "2px 2px 8px rgba(0,0,0,0.3)",
                fontFamily: '"Times New Roman", "MS Serif", serif',
                fontSize: 14,
                lineHeight: 1.6,
                color: "#000",
                cursor: "text",
                userSelect: "text",
              }}
            >
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  marginBottom: 16,
                  fontFamily: '"Times New Roman", serif',
                }}
              >
                About Me
              </h1>
              <p style={{ marginBottom: 12 }}>
                George D. Fekaris writes technical documentation and designs
                technical content delivery strategies. He has done it for six
                years in application security, building docs for CLIs and APIs
                and CI/CD integrations, working with docs as code the way
                writers once worked in typeset. He has designed more than sixty
                training modules. Over a thousand people use them every month.
                He works with AI tools now, in his{" "}
                <a
                  href="https://documentation.blackduck.com/bundle/bridge/page/documentation/c_overview.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#000080" }}
                >
                  professional docs work
                </a>{" "}
                and on his own time, during which he builds{" "}
                <a
                  href="https://github.com/gdfekaris"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#000080" }}
                >
                  open-source projects
                </a>{" "}
                that show what he knows about security and writing clearly.
              </p>
              <p style={{ marginBottom: 12 }}>
                Before any of that, he taught. Eight years of composition and
                creative writing. He studied poetry and English and philosophy,
                and he earned the degrees to prove it. That training never left.
                Close reading, rhetorical precision, the habit of caring whether
                a sentence does what it is supposed to do, he still carries all
                of it. The best documentation and design, he believes, have more
                in common with good prose and poetry than most people admit.
              </p>
            </div>
          </div>

          {/* Status bar */}
          <div
            style={{
              background: WIN_COLORS.bg,
              borderTop: "1px solid #808080",
              display: "flex",
              alignItems: "center",
              padding: "2px 4px",
              flexShrink: 0,
              fontSize: 10,
            }}
          >
            <div
              style={{
                border: "1px inset #888",
                padding: "1px 8px",
                flex: 1,
              }}
            >
              Page 1
            </div>
            <div
              style={{
                border: "1px inset #888",
                padding: "1px 8px",
                width: 80,
                textAlign: "center",
              }}
            >
              Ln 1
            </div>
            <div
              style={{
                border: "1px inset #888",
                padding: "1px 8px",
                width: 80,
                textAlign: "center",
              }}
            >
              Col 1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
