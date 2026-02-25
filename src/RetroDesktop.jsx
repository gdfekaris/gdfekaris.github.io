import { useState, useRef, useCallback, useEffect } from "react";

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

const PIXEL_BORDER = "2px solid";
const WIN_COLORS = {
  titleBar: "#000080",
  titleText: "#FFFFFF",
  border: "#C0C0C0",
  borderDark: "#808080",
  borderLight: "#FFFFFF",
  bg: "#C0C0C0",
  desktop: "#008080",
};

/* ── tiny pixel-art generators (canvas based) ── */
function usePixelCanvas(width, height, drawFn, deps = []) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, width, height);
  }, deps);
  return ref;
}

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ── Pixel Art Scenes ── */
function SpaceScene({ width = 320, height = 200 }) {
  const ref = usePixelCanvas(width, height, (ctx, w, h) => {
    const rng = seededRandom(42);
    // deep space gradient
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const r = Math.floor(2 + t * 8);
      const g = Math.floor(2 + t * 12);
      const b = Math.floor(30 + t * 60);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, y, w, 1);
    }
    // stars
    for (let i = 0; i < 300; i++) {
      const x = Math.floor(rng() * w);
      const y = Math.floor(rng() * h);
      const brightness = 150 + Math.floor(rng() * 105);
      const size = rng() > 0.92 ? 2 : 1;
      ctx.fillStyle = `rgb(${brightness},${brightness},${Math.min(255, brightness + 30)})`;
      ctx.fillRect(x, y, size, size);
    }
    // galaxy arc
    for (let i = 0; i < 2000; i++) {
      const angle = (i / 2000) * Math.PI * 1.2 - 0.3;
      const radius = 60 + rng() * 120 + Math.sin(angle * 3) * 20;
      const x = w * 0.5 + Math.cos(angle) * radius + (rng() - 0.5) * 30;
      const y = h * 0.3 + Math.sin(angle) * radius * 0.4 + (rng() - 0.5) * 15;
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const brightness = 100 + Math.floor(rng() * 155);
      const blue = Math.min(255, brightness + 50);
      ctx.fillStyle = `rgba(${brightness},${brightness},${blue},${0.5 + rng() * 0.5})`;
      ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    }
    // clouds at bottom
    for (let i = 0; i < 800; i++) {
      const x = Math.floor(rng() * w);
      const y = h - 30 + Math.floor(rng() * 30) - Math.floor(Math.sin(x / 40) * 15);
      if (y < 0 || y >= h) continue;
      const b = 200 + Math.floor(rng() * 55);
      ctx.fillStyle = `rgba(${b},${b},${b},${0.4 + rng() * 0.4})`;
      ctx.fillRect(x, y, 1 + Math.floor(rng() * 2), 1);
    }
  });
  return <canvas ref={ref} style={{ width: "100%", height: "100%", imageRendering: "pixelated", display: "block" }} />;
}

function LandscapeScene({ width = 280, height = 180 }) {
  const ref = usePixelCanvas(width, height, (ctx, w, h) => {
    const rng = seededRandom(101);
    // sky
    for (let y = 0; y < h * 0.5; y++) {
      const t = y / (h * 0.5);
      ctx.fillStyle = `rgb(${100 + Math.floor(t * 80)},${140 + Math.floor(t * 60)},${200 + Math.floor(t * 40)})`;
      ctx.fillRect(0, y, w, 1);
    }
    // moon
    const mx = w * 0.5, my = h * 0.2, mr = 25;
    for (let dy = -mr; dy <= mr; dy++) {
      for (let dx = -mr; dx <= mr; dx++) {
        if (dx * dx + dy * dy <= mr * mr) {
          const shade = 200 + Math.floor(((dx + dy) / mr) * 25);
          ctx.fillStyle = `rgb(${shade},${shade},${shade + 10})`;
          ctx.fillRect(Math.floor(mx + dx), Math.floor(my + dy), 1, 1);
        }
      }
    }
    // water
    for (let y = Math.floor(h * 0.45); y < Math.floor(h * 0.6); y++) {
      for (let x = 0; x < w; x++) {
        const wave = Math.sin(x / 8 + y / 3) * 10;
        const g = 120 + Math.floor(wave) + Math.floor(rng() * 20);
        const b = 160 + Math.floor(wave) + Math.floor(rng() * 20);
        ctx.fillStyle = `rgb(${40 + Math.floor(rng() * 20)},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // terrain
    for (let y = Math.floor(h * 0.55); y < h; y++) {
      for (let x = 0; x < w; x++) {
        const t = (y - h * 0.55) / (h * 0.45);
        const noise = Math.sin(x / 12) * 10 + Math.cos(x / 7 + y / 5) * 8;
        if (t < 0.3 + noise / 100) {
          const g = 80 + Math.floor(rng() * 40) + Math.floor(noise);
          ctx.fillStyle = `rgb(${40 + Math.floor(rng() * 20)},${Math.min(160, g)},${30 + Math.floor(rng() * 20)})`;
        } else {
          const r = 140 + Math.floor(rng() * 40) + Math.floor(noise / 2);
          ctx.fillStyle = `rgb(${Math.min(200, r)},${80 + Math.floor(rng() * 30)},${40 + Math.floor(rng() * 20)})`;
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  return <canvas ref={ref} style={{ width: "100%", height: "100%", imageRendering: "pixelated", display: "block" }} />;
}

function DomeScene({ width = 200, height = 160 }) {
  const ref = usePixelCanvas(width, height, (ctx, w, h) => {
    const rng = seededRandom(77);
    // sky gradient
    for (let y = 0; y < h; y++) {
      const t = y / h;
      ctx.fillStyle = `rgb(${80 + Math.floor(t * 100)},${100 + Math.floor(t * 80)},${180 + Math.floor(t * 50)})`;
      ctx.fillRect(0, y, w, 1);
    }
    // dome
    const cx = w * 0.5, cy = h * 0.75, rx = 50, ry = 45;
    for (let dy = -ry; dy <= 0; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
          const shine = Math.max(0, 1 - ((dx + 10) * (dx + 10) + (dy + 10) * (dy + 10)) / (rx * rx));
          const b = 160 + Math.floor(shine * 80) + Math.floor(rng() * 10);
          ctx.fillStyle = `rgba(${140 + Math.floor(shine * 60)},${150 + Math.floor(shine * 60)},${Math.min(255, b)},0.85)`;
          ctx.fillRect(Math.floor(cx + dx), Math.floor(cy + dy), 1, 1);
        }
      }
    }
    // ground
    for (let y = Math.floor(h * 0.75); y < h; y++) {
      for (let x = 0; x < w; x++) {
        const g = 100 + Math.floor(rng() * 40);
        ctx.fillStyle = `rgb(${60 + Math.floor(rng() * 30)},${g},${60 + Math.floor(rng() * 30)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // clouds
    for (let i = 0; i < 400; i++) {
      const x = Math.floor(rng() * w);
      const y = Math.floor(rng() * h * 0.4);
      const b = 220 + Math.floor(rng() * 35);
      ctx.fillStyle = `rgba(${b},${b},${b},${0.3 + rng() * 0.3})`;
      ctx.fillRect(x, y, 1 + Math.floor(rng() * 3), 1);
    }
  });
  return <canvas ref={ref} style={{ width: "100%", height: "100%", imageRendering: "pixelated", display: "block" }} />;
}

function DataScreen({ width = 200, height = 150 }) {
  const ref = usePixelCanvas(width, height, (ctx, w, h) => {
    const rng = seededRandom(55);
    ctx.fillStyle = "#0a0a2e";
    ctx.fillRect(0, 0, w, h);
    // bar chart
    const bars = 8;
    const barW = Math.floor(w / (bars * 2));
    for (let i = 0; i < bars; i++) {
      const barH = 20 + Math.floor(rng() * (h * 0.5));
      const hue = i * 30;
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(10 + i * barW * 2, h - 20 - barH, barW, barH);
    }
    // text lines
    for (let i = 0; i < 6; i++) {
      const lineW = 30 + Math.floor(rng() * 80);
      ctx.fillStyle = `rgb(${100 + Math.floor(rng() * 100)},${200 + Math.floor(rng() * 55)},${100 + Math.floor(rng() * 100)})`;
      ctx.fillRect(w * 0.55, 10 + i * 12, lineW, 6);
    }
    // dots
    for (let i = 0; i < 50; i++) {
      const x = Math.floor(rng() * w);
      const y = Math.floor(rng() * h * 0.3);
      ctx.fillStyle = `rgba(255,${100 + Math.floor(rng() * 155)},0,${0.5 + rng() * 0.5})`;
      ctx.fillRect(x, y, 2, 2);
    }
  });
  return <canvas ref={ref} style={{ width: "100%", height: "100%", imageRendering: "pixelated", display: "block" }} />;
}

function StarMap({ width = 220, height = 160 }) {
  const ref = usePixelCanvas(width, height, (ctx, w, h) => {
    const rng = seededRandom(33);
    ctx.fillStyle = "#050520";
    ctx.fillRect(0, 0, w, h);
    // constellation lines
    const points = [];
    for (let i = 0; i < 20; i++) {
      points.push([Math.floor(rng() * w), Math.floor(rng() * h)]);
    }
    ctx.strokeStyle = "rgba(80,80,200,0.4)";
    ctx.lineWidth = 1;
    for (let i = 0; i < points.length - 1; i++) {
      if (rng() > 0.4) {
        ctx.beginPath();
        ctx.moveTo(points[i][0], points[i][1]);
        ctx.lineTo(points[i + 1][0], points[i + 1][1]);
        ctx.stroke();
      }
    }
    // stars
    for (let i = 0; i < 200; i++) {
      const x = Math.floor(rng() * w);
      const y = Math.floor(rng() * h);
      const b = 150 + Math.floor(rng() * 105);
      const size = rng() > 0.9 ? 2 : 1;
      ctx.fillStyle = `rgb(${b},${b},${Math.min(255, b + 40)})`;
      ctx.fillRect(x, y, size, size);
    }
    // nebula blobs
    for (let i = 0; i < 500; i++) {
      const cx = w * 0.6 + (rng() - 0.5) * 80;
      const cy = h * 0.4 + (rng() - 0.5) * 60;
      ctx.fillStyle = `rgba(${100 + Math.floor(rng() * 80)},${50 + Math.floor(rng() * 50)},${180 + Math.floor(rng() * 75)},${0.05 + rng() * 0.1})`;
      ctx.fillRect(Math.floor(cx), Math.floor(cy), 2, 2);
    }
  });
  return <canvas ref={ref} style={{ width: "100%", height: "100%", imageRendering: "pixelated", display: "block" }} />;
}

function DesertScene({ width = 200, height = 130 }) {
  const ref = usePixelCanvas(width, height, (ctx, w, h) => {
    const rng = seededRandom(88);
    for (let y = 0; y < h * 0.4; y++) {
      const t = y / (h * 0.4);
      ctx.fillStyle = `rgb(${180 + Math.floor(t * 40)},${160 + Math.floor(t * 50)},${120 + Math.floor(t * 60)})`;
      ctx.fillRect(0, y, w, 1);
    }
    for (let y = Math.floor(h * 0.4); y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dune = Math.sin(x / 25 + y / 20) * 15;
        const r = 190 + Math.floor(dune) + Math.floor(rng() * 20);
        const g = 160 + Math.floor(dune * 0.8) + Math.floor(rng() * 15);
        const b = 100 + Math.floor(rng() * 20);
        ctx.fillStyle = `rgb(${Math.min(240, r)},${Math.min(210, g)},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  return <canvas ref={ref} style={{ width: "100%", height: "100%", imageRendering: "pixelated", display: "block" }} />;
}

function PieChart({ width = 180, height = 140 }) {
  const ref = usePixelCanvas(width, height, (ctx, w, h) => {
    const rng = seededRandom(22);
    ctx.fillStyle = "#c0c0c0";
    ctx.fillRect(0, 0, w, h);
    const cx = w * 0.6, cy = h * 0.55, r = Math.min(w, h) * 0.35;
    const slices = [0.3, 0.25, 0.2, 0.15, 0.1];
    const colors = ["#000080", "#0000FF", "#4040C0", "#6060E0", "#8080FF"];
    let angle = -Math.PI / 2;
    slices.forEach((s, i) => {
      const end = angle + s * Math.PI * 2;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, end);
      ctx.closePath();
      ctx.fill();
      angle = end;
    });
    // legend lines
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(8, 10 + i * 14, 10, 8);
      ctx.fillStyle = "#000";
      ctx.fillRect(22, 12 + i * 14, 30 + Math.floor(rng() * 30), 4);
    }
  });
  return <canvas ref={ref} style={{ width: "100%", height: "100%", imageRendering: "pixelated", display: "block" }} />;
}

/* ── Animated canvas hook (for CRT monitors) ── */
function useAnimatedCanvas(width, height, setupFn) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const drawFrame = setupFn(ctx, width, height);
    let animId;
    const loop = (time) => {
      drawFrame(time);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);
  return ref;
}

function AnimatedSpaceScene({ width = 100, height = 70 }) {
  const ref = useAnimatedCanvas(width, height, (ctx, w, h) => {
    const rng = seededRandom(42);
    const bg = document.createElement("canvas");
    bg.width = w; bg.height = h;
    const bgCtx = bg.getContext("2d");
    bgCtx.imageSmoothingEnabled = false;
    // gradient
    for (let y = 0; y < h; y++) {
      const t = y / h;
      bgCtx.fillStyle = `rgb(${Math.floor(2 + t * 8)},${Math.floor(2 + t * 12)},${Math.floor(30 + t * 60)})`;
      bgCtx.fillRect(0, y, w, 1);
    }
    // galaxy arc
    for (let i = 0; i < 2000; i++) {
      const angle = (i / 2000) * Math.PI * 1.2 - 0.3;
      const radius = 60 + rng() * 120 + Math.sin(angle * 3) * 20;
      const x = w * 0.5 + Math.cos(angle) * radius + (rng() - 0.5) * 30;
      const y = h * 0.3 + Math.sin(angle) * radius * 0.4 + (rng() - 0.5) * 15;
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const brightness = 100 + Math.floor(rng() * 155);
      bgCtx.fillStyle = `rgba(${brightness},${brightness},${Math.min(255, brightness + 50)},${0.5 + rng() * 0.5})`;
      bgCtx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    }
    // clouds
    for (let i = 0; i < 800; i++) {
      const x = Math.floor(rng() * w);
      const y = h - 30 + Math.floor(rng() * 30) - Math.floor(Math.sin(x / 40) * 15);
      if (y < 0 || y >= h) continue;
      const b = 200 + Math.floor(rng() * 55);
      bgCtx.fillStyle = `rgba(${b},${b},${b},${0.4 + rng() * 0.4})`;
      bgCtx.fillRect(x, y, 1 + Math.floor(rng() * 2), 1);
    }
    // pre-compute stars
    const starRng = seededRandom(142);
    const stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.floor(starRng() * w), y: Math.floor(starRng() * h),
        base: 150 + Math.floor(starRng() * 105),
        size: starRng() > 0.92 ? 2 : 1,
        phase: starRng() * Math.PI * 2,
        speed: 1 + starRng() * 4,
      });
    }
    return (time) => {
      const t = time / 1000;
      ctx.drawImage(bg, 0, 0);
      for (const s of stars) {
        const b = Math.max(30, Math.min(255, Math.floor(s.base + Math.sin(t * s.speed + s.phase) * 120)));
        ctx.fillStyle = `rgb(${b},${b},${Math.min(255, b + 30)})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
    };
  });
  return <canvas ref={ref} style={{ width: "100%", height: "100%", imageRendering: "pixelated", display: "block" }} />;
}

function AnimatedStarMap({ width = 100, height = 70 }) {
  const ref = useAnimatedCanvas(width, height, (ctx, w, h) => {
    const rng = seededRandom(33);
    const bg = document.createElement("canvas");
    bg.width = w; bg.height = h;
    const bgCtx = bg.getContext("2d");
    bgCtx.imageSmoothingEnabled = false;
    bgCtx.fillStyle = "#050520";
    bgCtx.fillRect(0, 0, w, h);
    // constellation lines
    const points = [];
    for (let i = 0; i < 20; i++) {
      points.push([Math.floor(rng() * w), Math.floor(rng() * h)]);
    }
    bgCtx.strokeStyle = "rgba(80,80,200,0.4)";
    bgCtx.lineWidth = 1;
    for (let i = 0; i < points.length - 1; i++) {
      if (rng() > 0.4) {
        bgCtx.beginPath();
        bgCtx.moveTo(points[i][0], points[i][1]);
        bgCtx.lineTo(points[i + 1][0], points[i + 1][1]);
        bgCtx.stroke();
      }
    }
    // pre-compute stars
    const stars = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.floor(rng() * w), y: Math.floor(rng() * h),
        base: 150 + Math.floor(rng() * 105),
        size: rng() > 0.9 ? 2 : 1,
        phase: rng() * Math.PI * 2,
        speed: 0.8 + rng() * 3,
      });
    }
    // pre-compute nebula
    const nebula = [];
    for (let i = 0; i < 500; i++) {
      nebula.push({
        x: Math.floor(w * 0.6 + (rng() - 0.5) * 80),
        y: Math.floor(h * 0.4 + (rng() - 0.5) * 60),
        r: 100 + Math.floor(rng() * 80), g: 50 + Math.floor(rng() * 50),
        b: 180 + Math.floor(rng() * 75),
        baseAlpha: 0.05 + rng() * 0.1,
        phase: rng() * Math.PI * 2,
      });
    }
    return (time) => {
      const t = time / 1000;
      ctx.drawImage(bg, 0, 0);
      for (const s of stars) {
        const b = Math.max(30, Math.min(255, Math.floor(s.base + Math.sin(t * s.speed + s.phase) * 120)));
        ctx.fillStyle = `rgb(${b},${b},${Math.min(255, b + 40)})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
      const pulse = 0.4 + Math.sin(t * 0.8) * 0.6;
      for (const n of nebula) {
        const alpha = n.baseAlpha * pulse * (0.6 + Math.sin(t * 0.5 + n.phase) * 0.4);
        ctx.fillStyle = `rgba(${n.r},${n.g},${n.b},${alpha})`;
        ctx.fillRect(n.x, n.y, 2, 2);
      }
    };
  });
  return <canvas ref={ref} style={{ width: "100%", height: "100%", imageRendering: "pixelated", display: "block" }} />;
}

function AnimatedLandscapeScene({ width = 100, height = 70 }) {
  const ref = useAnimatedCanvas(width, height, (ctx, w, h) => {
    const rng = seededRandom(101);
    const bg = document.createElement("canvas");
    bg.width = w; bg.height = h;
    const bgCtx = bg.getContext("2d");
    bgCtx.imageSmoothingEnabled = false;
    // sky
    for (let y = 0; y < h * 0.5; y++) {
      const t = y / (h * 0.5);
      bgCtx.fillStyle = `rgb(${100 + Math.floor(t * 80)},${140 + Math.floor(t * 60)},${200 + Math.floor(t * 40)})`;
      bgCtx.fillRect(0, y, w, 1);
    }
    // moon
    const mx = w * 0.5, my = h * 0.2, mr = 25;
    for (let dy = -mr; dy <= mr; dy++) {
      for (let dx = -mr; dx <= mr; dx++) {
        if (dx * dx + dy * dy <= mr * mr) {
          const shade = 200 + Math.floor(((dx + dy) / mr) * 25);
          bgCtx.fillStyle = `rgb(${shade},${shade},${shade + 10})`;
          bgCtx.fillRect(Math.floor(mx + dx), Math.floor(my + dy), 1, 1);
        }
      }
    }
    // water (drawn to bg to keep rng sequence; overdrawn per frame)
    const waterTop = Math.floor(h * 0.45);
    const waterBottom = Math.floor(h * 0.6);
    for (let y = waterTop; y < waterBottom; y++) {
      for (let x = 0; x < w; x++) {
        const wave = Math.sin(x / 8 + y / 3) * 10;
        const g = 120 + Math.floor(wave) + Math.floor(rng() * 20);
        const b = 160 + Math.floor(wave) + Math.floor(rng() * 20);
        bgCtx.fillStyle = `rgb(${40 + Math.floor(rng() * 20)},${g},${b})`;
        bgCtx.fillRect(x, y, 1, 1);
      }
    }
    // terrain
    for (let y = Math.floor(h * 0.55); y < h; y++) {
      for (let x = 0; x < w; x++) {
        const t = (y - h * 0.55) / (h * 0.45);
        const noise = Math.sin(x / 12) * 10 + Math.cos(x / 7 + y / 5) * 8;
        if (t < 0.3 + noise / 100) {
          const g = 80 + Math.floor(rng() * 40) + Math.floor(noise);
          bgCtx.fillStyle = `rgb(${40 + Math.floor(rng() * 20)},${Math.min(160, g)},${30 + Math.floor(rng() * 20)})`;
        } else {
          const r = 140 + Math.floor(rng() * 40) + Math.floor(noise / 2);
          bgCtx.fillStyle = `rgb(${Math.min(200, r)},${80 + Math.floor(rng() * 30)},${40 + Math.floor(rng() * 20)})`;
        }
        bgCtx.fillRect(x, y, 1, 1);
      }
    }
    return (time) => {
      const t = time / 1000;
      ctx.drawImage(bg, 0, 0);
      // animated water shimmer
      for (let y = waterTop; y < waterBottom; y++) {
        for (let x = 0; x < w; x++) {
          const wave = Math.sin(x / 6 + y / 3 + t * 3) * 15;
          const shimmer = Math.sin(x / 4 + t * 4) * 12 + Math.cos(y / 3 + t * 2.5) * 10;
          const g = 120 + Math.floor(wave + shimmer);
          const b = 160 + Math.floor(wave + shimmer);
          ctx.fillStyle = `rgb(40,${Math.max(80, Math.min(200, g))},${Math.max(120, Math.min(220, b))})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    };
  });
  return <canvas ref={ref} style={{ width: "100%", height: "100%", imageRendering: "pixelated", display: "block" }} />;
}

/* ── CRT Monitor component ── */
function CRTMonitor({ children, scale = 1, style = {}, href = null }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={href ? () => window.open(href, "_blank", "noopener") : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex", flexDirection: "column", alignItems: "center",
        background: "linear-gradient(135deg, #d4d0c8 0%, #b8b4a8 50%, #a09c90 100%)",
        borderRadius: 6, padding: `${8 * scale}px ${12 * scale}px ${16 * scale}px`,
        boxShadow: "3px 3px 8px rgba(0,0,0,0.5), inset 1px 1px 0 #e8e4d8",
        border: "2px solid #908c80",
        cursor: href ? "pointer" : "default",
        transition: "transform 0.15s, box-shadow 0.15s",
        transform: hovered && href ? "scale(1.05)" : "scale(1)",
        ...style,
    }}>
      <div style={{
        background: "#000", borderRadius: 4, padding: 4,
        border: "3px solid #2a2a2a",
        boxShadow: "inset 0 0 15px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.3)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
        }} />
        {children}
        {/* hover overlay */}
        {href && hovered && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 2,
            background: "rgba(0,0,128,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              background: "rgba(0,0,0,0.7)", color: "#fff",
              padding: "2px 6px", fontSize: 8, fontWeight: "bold",
              border: "1px solid #fff",
              fontFamily: '"MS Sans Serif", Arial, sans-serif',
            }}>
              OPEN →
            </span>
          </div>
        )}
      </div>
      <div style={{
        marginTop: 6 * scale, display: "flex", gap: 8, alignItems: "center",
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4a4", boxShadow: "0 0 4px #0f0" }} />
        <div style={{ width: 30, height: 3, background: "#706c60", borderRadius: 2 }} />
      </div>
    </div>
  );
}

/* ── Win3.1-style Window ── */
function Win31Window({
  title = "Window",
  x: initialX = 50,
  y: initialY = 50,
  width = 300,
  height = 200,
  children,
  zIndex = 1,
  minimized = false,
  href = null,
  titleFontSize = 11,
  titlePadding = "2px 4px",
  isMobile = false,
}) {
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    const onMove = (e2) => {
      if (dragging.current) {
        setPos({ x: e2.clientX - offset.current.x, y: e2.clientY - offset.current.y });
      }
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [pos]);

  const onTouchStart = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    dragging.current = true;
    offset.current = { x: touch.clientX - pos.x, y: touch.clientY - pos.y };
    const onMove = (e2) => {
      e2.preventDefault();
      if (dragging.current) {
        const t = e2.touches[0];
        setPos({ x: t.clientX - offset.current.x, y: t.clientY - offset.current.y });
      }
    };
    const onEnd = () => {
      dragging.current = false;
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  }, [pos]);

  if (minimized) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width,
        zIndex,
        fontFamily: '"MS Sans Serif", "Pixelated MS Sans Serif", Arial, sans-serif',
        fontSize: 11,
        userSelect: "none",
      }}
    >
      {/* outer beveled border */}
      <div style={{
        border: `${PIXEL_BORDER} ${WIN_COLORS.borderDark}`,
        borderTopColor: WIN_COLORS.borderLight,
        borderLeftColor: WIN_COLORS.borderLight,
        background: WIN_COLORS.bg,
        boxShadow: "2px 2px 0 #000",
      }}>
        {/* inner bevel */}
        <div style={{
          border: "1px solid",
          borderColor: `${WIN_COLORS.borderLight} ${WIN_COLORS.borderDark} ${WIN_COLORS.borderDark} ${WIN_COLORS.borderLight}`,
          padding: 2,
        }}>
          {/* title bar */}
          <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            style={{
              background: `linear-gradient(90deg, ${WIN_COLORS.titleBar}, #1084d0)`,
              color: WIN_COLORS.titleText,
              padding: titlePadding,
              fontWeight: "bold",
              fontSize: titleFontSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "grab",
              letterSpacing: 0.5,
            }}
          >
            <span style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.4)" }}>{title}</span>
            <div style={{ display: "flex", gap: 2 }}>
              {["_", "□", "×"].map((btn, i) => (
                <button key={i} style={{
                  width: 16, height: 14, fontSize: 10, lineHeight: "10px",
                  border: "1px outset #ddd", background: "#c0c0c0",
                  cursor: "grab", padding: 0, fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {btn}
                </button>
              ))}
            </div>
          </div>
          {/* spacer bar */}
          <div style={{
            background: WIN_COLORS.bg, padding: "1px 0", borderBottom: "1px solid #808080",
            height: 4,
          }} />
          {/* content */}
          <div
            onClick={href ? () => {
              if (href.startsWith('/')) {
                history.pushState({}, '', href);
                window.dispatchEvent(new PopStateEvent('popstate'));
              } else {
                window.open(href, "_blank", "noopener");
              }
            } : undefined}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              height: height - 50,
              overflow: "hidden",
              background: "#fff",
              border: "1px solid",
              borderColor: `${WIN_COLORS.borderDark} ${WIN_COLORS.borderLight} ${WIN_COLORS.borderLight} ${WIN_COLORS.borderDark}`,
              cursor: href ? "pointer" : "default",
              position: "relative",
            }}
          >
            {children}
            {/* hover overlay for linked windows (desktop only) */}
            {href && !isMobile && hovered && (
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,128,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "opacity 0.15s",
              }}>
                <span style={{
                  background: "rgba(0,0,0,0.7)", color: "#fff",
                  padding: "4px 12px", fontSize: 12, fontWeight: "bold",
                  border: "1px solid #fff", letterSpacing: 1,
                }}>
                  OPEN →
                </span>
              </div>
            )}
            {/* persistent tap hint for linked windows (mobile only) */}
            {href && isMobile && (
              <div style={{
                position: "absolute", bottom: 4, left: 4, zIndex: 2,
                background: "rgba(0,0,0,0.55)", color: "#fff",
                padding: "2px 6px", fontSize: 9, fontWeight: "bold",
                border: "1px solid rgba(255,255,255,0.5)",
                letterSpacing: 0.5, pointerEvents: "none",
                fontFamily: '"MS Sans Serif", Arial, sans-serif',
              }}>
                TAP ↗
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Taskbar ── */
function TaskbarButton({ label, href, isMobile }) {
  const [hovered, setHovered] = useState(false);
  const hasLink = !!href;
  return (
    <button
      onClick={hasLink ? () => {
        if (href.startsWith('/')) {
          history.pushState({}, '', href);
          window.dispatchEvent(new PopStateEvent('popstate'));
        } else {
          window.open(href, "_blank", "noopener");
        }
      } : undefined}
      onMouseEnter={hasLink ? () => setHovered(true) : undefined}
      onMouseLeave={hasLink ? () => setHovered(false) : undefined}
      style={{
        height: isMobile ? 28 : 22, padding: isMobile ? "0 10px" : "0 8px", fontSize: isMobile ? 13 : 10,
        border: "1px inset #888",
        background: hovered ? "#c8c8c8" : "#b8b8b8",
        cursor: hasLink ? "pointer" : "default",
        maxWidth: 120, overflow: "hidden",
        textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

function Taskbar({ windows, isMobile }) {
  const items = isMobile ? windows.filter(w => w.href) : windows;
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, height: isMobile ? 44 : 32, zIndex: 9999,
      background: WIN_COLORS.bg,
      borderTop: `2px solid ${WIN_COLORS.borderLight}`,
      display: "flex", alignItems: "center", padding: "0 4px", gap: 2,
      fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: isMobile ? 13 : 11,
      boxShadow: "0 -1px 0 #808080",
    }}>
      {/* Start button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        style={{
        height: isMobile ? 30 : 24, padding: "0 8px", fontWeight: "bold", fontSize: isMobile ? 13 : 11,
        border: "2px outset #ddd", background: "#c0c0c0", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit",
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" style={{ display: "block" }}>
          <polygon points="8,1 15,8 8,15 1,8" fill="#000080" />
          <polygon points="8,3 13,8 8,13 3,8" fill="#4040C0" />
          <polygon points="8,5 11,8 8,11 5,8" fill="#8080E0" />
          <polygon points="8,6.5 9.5,8 8,9.5 6.5,8" fill="#C0C0FF" />
        </svg>
        Home
      </button>
      <div style={{ width: 1, height: isMobile ? 28 : 20, borderLeft: "1px solid #808080", borderRight: "1px solid #fff", margin: "0 2px" }} />
      {/* Window buttons */}
      {items.map((w) => (
        <TaskbarButton key={w.label} label={w.label} href={w.href} isMobile={isMobile} />
      ))}
      <div style={{ flex: 1 }} />
      {/* System tray */}
      <div style={{
        border: "1px inset #888", padding: "2px 8px", fontSize: isMobile ? 13 : 11,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: isMobile ? 12 : 10 }}>🔊</span>
        <span style={{ fontSize: isMobile ? 18 : 16, lineHeight: isMobile ? "13px" : "11px" }}>∞</span>
      </div>
    </div>
  );
}

/* ── Clock Hook ── */
function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/* ── Scanline overlay ── */
function ScanlineOverlay() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99998,
      background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)",
      mixBlendMode: "multiply",
    }} />
  );
}

/* ── Desktop Icons ── */
function DesktopIcon({ label, icon, x, y }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y, display: "flex", flexDirection: "column",
      alignItems: "center", cursor: "default", width: 68, userSelect: "none",
    }}>
      <div style={{
        width: 32, height: 32, background: "linear-gradient(135deg, #fff 0%, #c0c0ff 100%)",
        border: "1px solid #000080", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, marginBottom: 2,
      }}>
        {icon}
      </div>
      <span style={{
        color: "#fff", fontSize: 10, textAlign: "center", textShadow: "1px 1px 0 #000",
        fontFamily: '"MS Sans Serif", Arial, sans-serif', lineHeight: 1.2,
      }}>{label}</span>
    </div>
  );
}

/* ── Main App ── */
export default function RetroDesktop() {
  const time = useClock();
  const isMobile = useIsMobile();
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const windowTitles = [
    "George D. Fekaris - [cosmos.bmp]",
    "LinkedIn - [planet_surface.dat]",
    "GitHub - [bio_dome.bmp]",
    "Sensor Array Data",
    "Star Chart v2.4",
    "Desert Recon - Sector 7",
    "Outpost Statistics",
  ];

  const windowLinks = {
    0: "/about",                                    // About me page (internal)
    1: "https://www.linkedin.com/in/george-dino-fekaris/",
    2: "https://github.com/gdfekaris",
    // 3: null,  // Sensor Array Data — add link later
    // 4: null,  // Star Chart v2.4 — add link later
    // 5: null,  // Desert Recon - Sector 7 — add link later
    // 6: null,  // Outpost Statistics — add link later
  };

  // CRT links — add later
  const crtLinks = [null, null, null];

  // Mobile-specific window props
  const mobileTitle = { titleFontSize: 13, titlePadding: "3px 6px" };

  // Conditional CRT list
  const crtSize = isMobile ? 56 : 70;
  const crtW = isMobile ? 80 : 100;
  const crtList = isMobile
    ? [
        { scene: <AnimatedSpaceScene width={crtW} height={crtSize} />, link: crtLinks[0] },
        { scene: <AnimatedLandscapeScene width={crtW} height={crtSize} />, link: crtLinks[2] },
      ]
    : [
        { scene: <AnimatedSpaceScene width={crtW} height={crtSize} />, link: crtLinks[0] },
        { scene: <AnimatedStarMap width={crtW} height={crtSize} />, link: crtLinks[1] },
        { scene: <AnimatedLandscapeScene width={crtW} height={crtSize} />, link: crtLinks[2] },
      ];

  return (
    <div style={{
      position: "fixed", inset: 0, overflow: "hidden", cursor: "default",
      background: `
        radial-gradient(ellipse at 30% 20%, #006868 0%, transparent 50%),
        radial-gradient(ellipse at 70% 80%, #005858 0%, transparent 50%),
        linear-gradient(180deg, #006060 0%, #008080 30%, #007070 70%, #005858 100%)
      `,
    }}>
      <ScanlineOverlay />

      {/* Desktop Icons */}
      <DesktopIcon label="My Computer" icon="🖥" x={16} y={12} />
      <DesktopIcon label="Network" icon="🌐" x={16} y={90} />
      <DesktopIcon label="Recycle Bin" icon="🗑" x={16} y={168} />
      <DesktopIcon label="Galaxy DB" icon="🌌" x={16} y={246} />
      <DesktopIcon label="Comm Link" icon="📡" x={16} y={324} />

      {/* Background space window - largest */}
      <Win31Window
        title={windowTitles[0]}
        x={isMobile ? 8 : 60} y={isMobile ? 8 : 10}
        width={isMobile ? vw - 16 : 680} height={isMobile ? 260 : 420}
        zIndex={1}
        href={windowLinks[0]}
        isMobile={isMobile}
        {...(isMobile ? mobileTitle : {})}
      >
        <SpaceScene width={680} height={370} />
      </Win31Window>

      {/* Center landscape */}
      <Win31Window
        title={windowTitles[1]}
        x={isMobile ? vw - 260 : 200} y={isMobile ? 220 : 100}
        width={isMobile ? 250 : 420} height={isMobile ? 220 : 320}
        zIndex={2}
        href={windowLinks[1]}
        isMobile={isMobile}
        {...(isMobile ? mobileTitle : {})}
      >
        <LandscapeScene width={420} height={270} />
      </Win31Window>

      {/* Bio-dome left */}
      <Win31Window
        title={windowTitles[2]}
        x={isMobile ? 10 : 20} y={isMobile ? 340 : 220}
        width={isMobile ? 220 : 220} height={isMobile ? 220 : 200}
        zIndex={3}
        href={windowLinks[2]}
        isMobile={isMobile}
        {...(isMobile ? mobileTitle : {})}
      >
        <DomeScene width={220} height={150} />
      </Win31Window>

      {/* Unlinked windows — hidden on mobile */}
      {!isMobile && (
        <>
          {/* Data screen right */}
          <Win31Window
            title={windowTitles[3]}
            x={600} y={200} width={240} height={200}
            zIndex={4}
          >
            <DataScreen width={240} height={150} />
          </Win31Window>

          {/* Star map */}
          <Win31Window
            title={windowTitles[4]}
            x={500} y={380} width={260} height={200}
            zIndex={5}
          >
            <StarMap width={260} height={150} />
          </Win31Window>

          {/* Desert bottom left */}
          <Win31Window
            title={windowTitles[5]}
            x={30} y={430} width={230} height={170}
            zIndex={6}
          >
            <DesertScene width={230} height={120} />
          </Win31Window>

          {/* Pie chart */}
          <Win31Window
            title={windowTitles[6]}
            x={720} y={420} width={210} height={180}
            zIndex={7}
          >
            <PieChart width={210} height={130} />
          </Win31Window>
        </>
      )}

      {/* CRT Monitors row at bottom */}
      <div style={{
        position: "absolute",
        bottom: isMobile ? 52 : 40,
        left: isMobile ? "50%" : 100,
        transform: isMobile ? "translateX(-50%)" : undefined,
        display: "flex", gap: 20,
        zIndex: 8,
      }}>
        {crtList.map((crt, i) => (
          <CRTMonitor key={i} scale={isMobile ? 0.6 : 0.7} href={crt.link}>
            <div style={{ width: crtW, height: crtSize }}>
              {crt.scene}
            </div>
          </CRTMonitor>
        ))}
      </div>

      {/* Taskbar */}
      <Taskbar
        isMobile={isMobile}
        windows={[
          { label: "George D. Fekaris", href: "/about" },
          { label: "LinkedIn", href: "https://www.linkedin.com/in/george-dino-fekaris/" },
          { label: "GitHub", href: "https://github.com/gdfekaris" },
          { label: "Sensors" },
          { label: "Star Chart" },
        ]}
      />
    </div>
  );
}
