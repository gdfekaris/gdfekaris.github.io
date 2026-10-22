import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";

function useViewport() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const onResize = () => setVp(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return vp;
}

// Size of an element, kept current with ResizeObserver
function useElementSize(ref, fallback) {
  const [size, setSize] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize((s) =>
      s.w === el.clientWidth && s.h === el.clientHeight ? s : { w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return size;
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

// Per-pixel drawing straight into an ImageData buffer — much faster than
// thousands of 1×1 fillRects. set() blends like fillRect over opaque pixels.
function pixelBuffer(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  return {
    set(x, y, r, g, b, a = 1) {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = (y * w + x) * 4;
      d[i] = r * a + d[i] * (1 - a);
      d[i + 1] = g * a + d[i + 1] * (1 - a);
      d[i + 2] = b * a + d[i + 2] * (1 - a);
      d[i + 3] = 255;
    },
    flush() { ctx.putImageData(img, 0, 0); },
  };
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
  return <canvas ref={ref} style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated", display: "block" }} />;
}

// Moon, water and terrain shared by the static and animated landscapes
function drawMoonWaterTerrain(ctx, w, h, rng) {
  const px = pixelBuffer(ctx, w, h);
  // moon
  const mx = w * 0.5, my = h * 0.2, mr = 25;
  for (let dy = -mr; dy <= mr; dy++) {
    for (let dx = -mr; dx <= mr; dx++) {
      if (dx * dx + dy * dy <= mr * mr) {
        const shade = 200 + Math.floor(((dx + dy) / mr) * 25);
        px.set(Math.floor(mx + dx), Math.floor(my + dy), shade, shade, shade + 10);
      }
    }
  }
  // water
  for (let y = Math.floor(h * 0.45); y < Math.floor(h * 0.6); y++) {
    for (let x = 0; x < w; x++) {
      const wave = Math.sin(x / 8 + y / 3) * 10;
      const g = 120 + Math.floor(wave) + Math.floor(rng() * 20);
      const b = 160 + Math.floor(wave) + Math.floor(rng() * 20);
      px.set(x, y, 40 + Math.floor(rng() * 20), g, b);
    }
  }
  // terrain
  for (let y = Math.floor(h * 0.55); y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = (y - h * 0.55) / (h * 0.45);
      const noise = Math.sin(x / 12) * 10 + Math.cos(x / 7 + y / 5) * 8;
      if (t < 0.3 + noise / 100) {
        const g = 80 + Math.floor(rng() * 40) + Math.floor(noise);
        px.set(x, y, 40 + Math.floor(rng() * 20), Math.min(160, g), 30 + Math.floor(rng() * 20));
      } else {
        const r = 140 + Math.floor(rng() * 40) + Math.floor(noise / 2);
        px.set(x, y, Math.min(200, r), 80 + Math.floor(rng() * 30), 40 + Math.floor(rng() * 20));
      }
    }
  }
  px.flush();
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
    drawMoonWaterTerrain(ctx, w, h, rng);
  });
  return <canvas ref={ref} style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated", display: "block" }} />;
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
    const px = pixelBuffer(ctx, w, h);
    // dome
    const cx = w * 0.5, cy = h * 0.75, rx = 50, ry = 45;
    for (let dy = -ry; dy <= 0; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
          const shine = Math.max(0, 1 - ((dx + 10) * (dx + 10) + (dy + 10) * (dy + 10)) / (rx * rx));
          const b = 160 + Math.floor(shine * 80) + Math.floor(rng() * 10);
          px.set(Math.floor(cx + dx), Math.floor(cy + dy),
            140 + Math.floor(shine * 60), 150 + Math.floor(shine * 60), Math.min(255, b), 0.85);
        }
      }
    }
    // ground
    for (let y = Math.floor(h * 0.75); y < h; y++) {
      for (let x = 0; x < w; x++) {
        const g = 100 + Math.floor(rng() * 40);
        px.set(x, y, 60 + Math.floor(rng() * 30), g, 60 + Math.floor(rng() * 30));
      }
    }
    px.flush();
    // clouds
    for (let i = 0; i < 400; i++) {
      const x = Math.floor(rng() * w);
      const y = Math.floor(rng() * h * 0.4);
      const b = 220 + Math.floor(rng() * 35);
      ctx.fillStyle = `rgba(${b},${b},${b},${0.3 + rng() * 0.3})`;
      ctx.fillRect(x, y, 1 + Math.floor(rng() * 3), 1);
    }
  });
  return <canvas ref={ref} style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated", display: "block" }} />;
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
  return <canvas ref={ref} style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated", display: "block" }} />;
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
  return <canvas ref={ref} style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated", display: "block" }} />;
}

function DesertScene({ width = 200, height = 130 }) {
  const ref = usePixelCanvas(width, height, (ctx, w, h) => {
    const rng = seededRandom(88);
    for (let y = 0; y < h * 0.4; y++) {
      const t = y / (h * 0.4);
      ctx.fillStyle = `rgb(${180 + Math.floor(t * 40)},${160 + Math.floor(t * 50)},${120 + Math.floor(t * 60)})`;
      ctx.fillRect(0, y, w, 1);
    }
    const px = pixelBuffer(ctx, w, h);
    for (let y = Math.floor(h * 0.4); y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dune = Math.sin(x / 25 + y / 20) * 15;
        const r = 190 + Math.floor(dune) + Math.floor(rng() * 20);
        const g = 160 + Math.floor(dune * 0.8) + Math.floor(rng() * 15);
        const b = 100 + Math.floor(rng() * 20);
        px.set(x, y, Math.min(240, r), Math.min(210, g), b);
      }
    }
    px.flush();
  });
  return <canvas ref={ref} style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated", display: "block" }} />;
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
  return <canvas ref={ref} style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated", display: "block" }} />;
}

/* ── Animated canvas hook (for CRT monitors) ── */
const CRT_FRAME_MS = 1000 / 15;

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
    // Honor the OS "reduce motion" setting with a single still frame
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      drawFrame(0);
      return;
    }
    // ~15 fps suits the CRT look and spares phone batteries
    let animId, last = -Infinity;
    const loop = (time) => {
      if (time - last >= CRT_FRAME_MS - 2) { // slack for frame-time jitter
        last = time;
        drawFrame(time);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [width, height]);
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
  return <canvas ref={ref} style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated", display: "block" }} />;
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
  return <canvas ref={ref} style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated", display: "block" }} />;
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
    // water is drawn to bg to keep the rng sequence, then overdrawn per frame
    drawMoonWaterTerrain(bgCtx, w, h, rng);
    const waterTop = Math.floor(h * 0.45);
    const waterBottom = Math.floor(h * 0.6);
    const water = ctx.createImageData(w, waterBottom - waterTop);
    return (time) => {
      const t = time / 1000;
      ctx.drawImage(bg, 0, 0);
      // animated water shimmer
      const d = water.data;
      for (let y = waterTop; y < waterBottom; y++) {
        for (let x = 0; x < w; x++) {
          const wave = Math.sin(x / 6 + y / 3 + t * 3) * 15;
          const shimmer = Math.sin(x / 4 + t * 4) * 12 + Math.cos(y / 3 + t * 2.5) * 10;
          const g = 120 + Math.floor(wave + shimmer);
          const b = 160 + Math.floor(wave + shimmer);
          const i = ((y - waterTop) * w + x) * 4;
          d[i] = 40;
          d[i + 1] = Math.max(80, Math.min(200, g));
          d[i + 2] = Math.max(120, Math.min(220, b));
          d[i + 3] = 255;
        }
      }
      ctx.putImageData(water, 0, waterTop);
    };
  });
  return <canvas ref={ref} style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated", display: "block" }} />;
}

/* ── Links ── */
// Real <a> elements, so links work with the keyboard, screen readers,
// long-press and middle-click. Internal paths navigate in-app unless a
// modifier key asks for a new tab or window.
function linkProps(href) {
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

/* ── CRT Monitor component ── */
function CRTMonitor({ children, scale = 1, style = {}, href = null }) {
  const [hovered, setHovered] = useState(false);
  const Tag = href ? "a" : "div";
  return (
    <Tag
      {...(href ? linkProps(href) : {})}
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
    </Tag>
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
  label = null,  // accessible name for the link (the art itself has no text)
  titleFontSize = 11,
  titlePadding = "2px 4px",
  isMobile = false,
  bounds = null, // { w, h } of the area the window may be dragged within
  scale = 1,     // CSS scale applied by the parent, to convert pointer deltas
}) {
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x: initialX, y: initialY });

  // Snap back to the layout position whenever the layout changes (resize/rotate)
  useEffect(() => {
    setPos({ x: initialX, y: initialY });
  }, [initialX, initialY]);

  // Pointer events cover mouse, touch and pen in one path; capture keeps the
  // drag alive outside the title bar, and pointercancel ends interrupted drags.
  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    const bar = e.currentTarget;
    const start = { cx: e.clientX, cy: e.clientY, x: pos.x, y: pos.y };
    // Keep at least part of the title bar reachable
    const clamp = (x, y) => bounds ? {
      x: Math.min(Math.max(x, 60 - width), bounds.w - 60),
      y: Math.min(Math.max(y, 0), bounds.h - 30),
    } : { x, y };
    const onMove = (e2) => {
      setPos(clamp(start.x + (e2.clientX - start.cx) / scale, start.y + (e2.clientY - start.cy) / scale));
    };
    const onEnd = () => {
      bar.removeEventListener("pointermove", onMove);
      bar.removeEventListener("pointerup", onEnd);
      bar.removeEventListener("pointercancel", onEnd);
    };
    bar.setPointerCapture(e.pointerId);
    bar.addEventListener("pointermove", onMove);
    bar.addEventListener("pointerup", onEnd);
    bar.addEventListener("pointercancel", onEnd);
  }, [pos, bounds, scale, width]);

  if (minimized) return null;

  const Content = href ? "a" : "div";

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
            onPointerDown={onPointerDown}
            style={{
              touchAction: "none",
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
            {/* decorative — hidden from screen readers and the tab order */}
            <div aria-hidden="true" style={{ display: "flex", gap: 2 }}>
              {["_", "□", "×"].map((btn, i) => (
                <button key={i} tabIndex={-1} style={{
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
          <Content
            {...(href ? { ...linkProps(href), "aria-label": label, draggable: false } : {})}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              display: "block",
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
                position: "absolute", bottom: 4, right: 4, zIndex: 2,
                background: "rgba(0,0,0,0.55)", color: "#fff",
                padding: "2px 6px", fontSize: 9, fontWeight: "bold",
                border: "1px solid rgba(255,255,255,0.5)",
                letterSpacing: 0.5, pointerEvents: "none",
                fontFamily: '"MS Sans Serif", Arial, sans-serif',
              }}>
                ↖ TAP
              </div>
            )}
          </Content>
        </div>
      </div>
    </div>
  );
}

/* ── Taskbar ── */
const taskbarHeight = (isMobile) => (isMobile ? 44 : 32);

function TaskbarButton({ label, href, isMobile }) {
  const [hovered, setHovered] = useState(false);
  const hasLink = !!href;
  const Tag = hasLink ? "a" : "span";
  const h = isMobile ? 28 : 22;
  return (
    <Tag
      {...(hasLink ? linkProps(href) : {})}
      onMouseEnter={hasLink ? () => setHovered(true) : undefined}
      onMouseLeave={hasLink ? () => setHovered(false) : undefined}
      style={{
        display: "inline-block", height: h, lineHeight: `${h - 2}px`, textAlign: "center",
        padding: isMobile ? "0 10px" : "0 8px", fontSize: isMobile ? 13 : 10,
        border: "1px inset #888",
        background: hovered ? "#c8c8c8" : "#b8b8b8",
        color: "#000", textDecoration: "none",
        cursor: hasLink ? "pointer" : "default",
        // Long labels give up space first so short ones stay readable
        maxWidth: isMobile ? 180 : 120, minWidth: 0, flexShrink: label.length > 12 ? 1 : 0, overflow: "hidden",
        textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "inherit",
      }}
    >
      {label}
    </Tag>
  );
}

function Taskbar({ windows, isMobile, showTray = true }) {
  const items = isMobile ? windows.filter(w => w.href) : windows;
  return (
    <nav aria-label="Taskbar" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      // Extend under the iPhone home indicator, keeping buttons above it
      height: `calc(${taskbarHeight(isMobile)}px + env(safe-area-inset-bottom, 0px))`,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      paddingLeft: "max(4px, env(safe-area-inset-left, 0px))",
      paddingRight: "max(4px, env(safe-area-inset-right, 0px))",
      background: WIN_COLORS.bg,
      borderTop: `2px solid ${WIN_COLORS.borderLight}`,
      display: "flex", alignItems: "center", gap: 2,
      fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: isMobile ? 13 : 11,
      boxShadow: "0 -1px 0 #808080",
    }}>
      {/* Start button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        style={{
        height: isMobile ? 30 : 24, padding: "0 8px", fontWeight: "bold", fontSize: isMobile ? 13 : 11,
        border: "2px outset #ddd", background: "#c0c0c0", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit", flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" style={{ display: "block" }}>
          <polygon points="8,1 15,8 8,15 1,8" fill="#000080" />
          <polygon points="8,3 13,8 8,13 3,8" fill="#4040C0" />
          <polygon points="8,5 11,8 8,11 5,8" fill="#8080E0" />
          <polygon points="8,6.5 9.5,8 8,9.5 6.5,8" fill="#C0C0FF" />
        </svg>
        Home
      </button>
      <div style={{ flexShrink: 0, width: 1, height: isMobile ? 28 : 20, borderLeft: "1px solid #808080", borderRight: "1px solid #fff", margin: "0 2px" }} />
      {/* Window buttons */}
      {items.map((w) => (
        <TaskbarButton key={w.label} label={w.label} href={w.href} isMobile={isMobile} />
      ))}
      <div style={{ flex: 1 }} />
      {/* System tray */}
      {showTray && <div style={{
        border: "1px inset #888", padding: "2px 8px", fontSize: isMobile ? 13 : 11,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: isMobile ? 12 : 10 }}>🔊</span>
        <span style={{ fontSize: isMobile ? 18 : 16, lineHeight: isMobile ? "13px" : "11px" }}>∞</span>
      </div>}
    </nav>
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

/* ── Layout ── */
// "desktop": free-form windows, scaled down to fit when the screen is small.
// "portrait": the linked windows stacked to fill an upright phone or tablet.
// "landscape": short screens (phones on their side) — only linked windows fit.
function getMode({ w, h }) {
  if (h < 480 && w > h) return "landscape";
  if (w < 768 || (h > w && w < 1100)) return "portrait";
  return "desktop";
}

// The desktop layout is designed for this area and scaled to fit smaller ones
const DESIGN = { w: 940, h: 600 };
// Space the mobile CRT row takes, including the gaps around it
const CRT_ROW_H = 114;

const WINDOWS = [
  { title: "George D. Fekaris - [cosmos.bmp]", href: "/about", label: "About George D. Fekaris",
    rect: { x: 60, y: 10, w: 680, h: 420 }, scene: <SpaceScene width={680} height={370} /> },
  { title: "LinkedIn - [planet_surface.dat]", href: "https://www.linkedin.com/in/george-dino-fekaris/",
    label: "George D. Fekaris on LinkedIn (opens in a new tab)",
    rect: { x: 200, y: 100, w: 420, h: 320 }, scene: <LandscapeScene width={420} height={270} /> },
  { title: "GitHub - [bio_dome.bmp]", href: "https://github.com/gdfekaris",
    label: "George D. Fekaris on GitHub (opens in a new tab)",
    rect: { x: 20, y: 220, w: 220, h: 200 }, scene: <DomeScene width={220} height={150} /> },
  // Unlinked windows (desktop only) — add an href to link them later
  { title: "Sensor Array Data",
    rect: { x: 600, y: 200, w: 240, h: 200 }, scene: <DataScreen width={240} height={150} /> },
  { title: "Star Chart v2.4",
    rect: { x: 500, y: 380, w: 260, h: 200 }, scene: <StarMap width={260} height={150} /> },
  { title: "Desert Recon - Sector 7",
    rect: { x: 30, y: 430, w: 230, h: 170 }, scene: <DesertScene width={230} height={120} /> },
  { title: "Outpost Statistics",
    rect: { x: 720, y: 420, w: 210, h: 180 }, scene: <PieChart width={210} height={130} /> },
];

// Rects for the three linked windows on compact screens, filling a W×H area
function compactRects(mode, W, H) {
  const r = Math.round;
  if (mode === "landscape") {
    const w = r(W * 0.38);
    return [
      { x: 8, y: 8, w, h: H - 16 },
      { x: r(W * 0.31), y: 20, w, h: H - 28 },
      { x: W - w - 8, y: 32, w, h: H - 40 },
    ];
  }
  // Portrait: wide window on top, two overlapping windows below it
  const w1 = r(W * 0.67);
  return [
    { x: 8, y: 8, w: W - 16, h: r(H * 0.46) },
    { x: W - w1 - 10, y: r(H * 0.39), w: w1, h: r(H * 0.39) },
    { x: 10, y: r(H * 0.61), w: r(W * 0.59), h: r(H * 0.39) - 8 },
  ];
}

// Read by screen readers and search engines, not shown
const VISUALLY_HIDDEN = {
  position: "absolute", width: 1, height: 1, overflow: "hidden",
  clip: "rect(0 0 0 0)", clipPath: "inset(50%)", whiteSpace: "nowrap",
};

/* ── Main App ── */
export default function RetroDesktop() {
  const time = useClock();
  const viewport = useViewport();
  const mode = getMode(viewport);
  const isMobile = mode !== "desktop";

  // Desktop area above the taskbar and inside any safe-area insets
  const areaRef = useRef(null);
  const area = useElementSize(areaRef, { w: viewport.w, h: viewport.h - taskbarHeight(isMobile) });

  const scale = isMobile ? 1 : Math.min(1, area.w / DESIGN.w, area.h / DESIGN.h);
  const showCrts = !isMobile || (mode === "portrait" && area.h >= 560);
  const windows = isMobile ? WINDOWS.filter((w) => w.href) : WINDOWS;
  const rects = isMobile
    ? compactRects(mode, area.w, area.h - (showCrts ? CRT_ROW_H : 0))
    : windows.map((w) => w.rect);
  const bounds = { w: area.w / scale, h: area.h / scale };

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
      <h1 style={VISUALLY_HIDDEN}>George D. Fekaris</h1>

      <div ref={areaRef} style={{
        position: "absolute", overflow: "hidden",
        top: "env(safe-area-inset-top, 0px)",
        left: "env(safe-area-inset-left, 0px)",
        right: "env(safe-area-inset-right, 0px)",
        bottom: `calc(${taskbarHeight(isMobile)}px + env(safe-area-inset-bottom, 0px))`,
      }}>
        <div style={{
          position: "absolute", left: 0, top: 0,
          width: isMobile ? "100%" : DESIGN.w, height: isMobile ? "100%" : DESIGN.h,
          transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: "0 0",
        }}>
          {/* Desktop Icons */}
          {!isMobile && (
            <>
              <DesktopIcon label="My Computer" icon="🖥" x={16} y={12} />
              <DesktopIcon label="Network" icon="🌐" x={16} y={90} />
              <DesktopIcon label="Recycle Bin" icon="🗑" x={16} y={168} />
              <DesktopIcon label="Galaxy DB" icon="🌌" x={16} y={246} />
              <DesktopIcon label="Comm Link" icon="📡" x={16} y={324} />
            </>
          )}

          {windows.map((win, i) => (
            <Win31Window
              key={win.title}
              title={win.title}
              x={rects[i].x} y={rects[i].y}
              width={rects[i].w} height={rects[i].h}
              zIndex={i + 1}
              href={win.href}
              label={win.label}
              isMobile={isMobile}
              bounds={bounds}
              scale={scale}
              {...(isMobile ? mobileTitle : {})}
            >
              {win.scene}
            </Win31Window>
          ))}
        </div>

        {/* CRT Monitors row at bottom */}
        {showCrts && (
          <div style={{
            position: "absolute", bottom: 8 * scale, zIndex: 8,
            display: "flex", gap: 20,
            ...(isMobile
              ? { left: "50%", transform: "translateX(-50%)" }
              : { left: 100 * scale, transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: "0 100%" }),
          }}>
            {crtList.map((crt, i) => (
              <CRTMonitor key={i} scale={isMobile ? 0.6 : 0.7} href={crt.link}>
                <div style={{ width: crtW, height: crtSize }}>
                  {crt.scene}
                </div>
              </CRTMonitor>
            ))}
          </div>
        )}
      </div>

      {/* Taskbar */}
      <Taskbar
        isMobile={isMobile}
        showTray={area.w >= 480}
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
