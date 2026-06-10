"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useVelocity,
} from "framer-motion";
import { noise2, rand } from "./noise";

/* ════════════════════════════════════════════════════════════════════
   Tråden — the thread engine (contract §3, brief §4).
   ThreadProvider (--vk-pulse), useThread(), <ThreadSegment>, <HeroCanvas>.
   Resting state is ALWAYS the fully-composed state (poster law).
   ════════════════════════════════════════════════════════════════════ */

// Canvas cannot read CSS custom properties — mirrors of the .vk tokens.
const GLOD = "#FFB454";
const GLOD_HALO = "#E29E33";
const BENK = "#211B15";
const HAIRLINE = "#3A3027";
const STOV = "#C9BBA8";

const TAU = Math.PI * 2;
// The fixed rotation token set (−2°, −1°, +1.5°, +2.5°), in radians.
const ROT_SET = [-0.0349, -0.01745, 0.02618, 0.04363];

const fa = (n: number) => new Float32Array(n);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

// Hydration probe: false on the server/hydration pass, true after mount.
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

/* ════════════════════════════════════════════
   ThreadProvider — lerped scroll velocity (factor 0.08) → --vk-pulse (1..4)
   on the .vk root. Writes are rAF-batched, rounded to 2 decimals, and the
   loop self-terminates once the pulse settles. Skipped under reduced motion.
   ════════════════════════════════════════════ */

export function ThreadProvider({ children }: { children: React.ReactNode }) {
  const marker = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() === true;
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const s = useRef({
    pulse: 1,
    target: 1,
    raf: 0,
    written: -1,
    root: null as HTMLElement | null,
    tick: () => {},
  });

  useMotionValueEvent(velocity, "change", (v) => {
    if (reduced) return;
    const st = s.current;
    st.target = 1 + Math.min(Math.abs(v), 3000) / 1000; // |v| 0..3000 px/s → 1..4
    if (!st.raf && st.root) st.raf = requestAnimationFrame(st.tick);
  });

  useEffect(() => {
    const st = s.current;
    st.root = (marker.current?.closest(".vk") as HTMLElement | null) ?? document.documentElement;
    st.root.style.setProperty("--vk-pulse", "1"); // resting value, even under reduced motion
    st.tick = () => {
      st.raf = 0;
      st.pulse += (st.target - st.pulse) * 0.08;
      if (Math.abs(st.target - st.pulse) < 0.005) st.pulse = st.target;
      const rounded = Math.round(st.pulse * 100) / 100;
      if (rounded !== st.written && st.root) {
        st.root.style.setProperty("--vk-pulse", String(rounded));
        st.written = rounded;
      }
      if (st.pulse !== st.target) st.raf = requestAnimationFrame(st.tick);
    };
    return () => {
      if (st.raf) cancelAnimationFrame(st.raf);
      st.raf = 0;
    };
  }, []);

  return (
    <>
      <div ref={marker} style={{ display: "contents" }} />
      {children}
    </>
  );
}

export function useThread(): { reduced: boolean } {
  const reduced = useReducedMotion();
  return { reduced: reduced === true };
}

/* ════════════════════════════════════════════
   ThreadSegment — self-contained scroll-drawn SVG path.
   SSR renders the path fully drawn (no dash attrs = poster law); the
   pathLength motion style attaches only after mount, so there is no
   hydration mismatch and the no-JS/reduced state is the drawn line.
   ════════════════════════════════════════════ */

type ScrollOffset = NonNullable<Parameters<typeof useScroll>[0]>["offset"];

const SEGMENT_OFFSET: ScrollOffset = ["start 0.9", "end 0.45"];

export interface ThreadSegmentProps {
  d: string;
  viewBox: string;
  className?: string;
  /** Custom draw window — defaults to the shared ["start 0.9", "end 0.45"]. */
  offset?: ScrollOffset;
  /** "none" lets a segment stretch to its box (hero hand-off). */
  preserveAspectRatio?: string;
}

export function ThreadSegment({
  d,
  viewBox,
  className,
  offset,
  preserveAspectRatio = "xMidYMin meet",
}: ThreadSegmentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() === true;
  const mounted = useMounted();

  const { scrollYProgress } = useScroll({ target: ref, offset: offset ?? SEGMENT_OFFSET });
  const pathLength = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const drawn = mounted && !reduced;

  return (
    <div
      ref={ref}
      className={className}
      aria-hidden="true"
      style={{ position: "absolute", pointerEvents: "none", zIndex: 0 }}
    >
      <svg
        viewBox={viewBox}
        preserveAspectRatio={preserveAspectRatio}
        aria-hidden="true"
        focusable="false"
        width="100%"
        height="100%"
        style={{ display: "block", overflow: "visible" }}
      >
        <motion.path
          d={d}
          fill="none"
          stroke="var(--glod-halo)"
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.35}
          vectorEffect="non-scaling-stroke"
          style={drawn ? { pathLength, filter: "blur(4px)" } : { filter: "blur(4px)" }}
        />
        <motion.path
          d={d}
          fill="none"
          stroke="var(--glod)"
          strokeWidth={3}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={drawn ? { pathLength } : undefined}
        />
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════
   HeroCanvas — Phase A/B/C (brief §4). Paper-scrap sprites drift on value
   noise, steer along precomputed beziers onto the 38% S-curve, and are
   absorbed as the 3px amber line draws itself. One canvas, zero per-frame
   allocations, DPR ≤1.5, watchdog, offscreen pause. Reduced motion draws
   exactly one static composed frame.
   ════════════════════════════════════════════ */

export interface HeroCanvasProps {
  words: readonly string[];
  label: string;
  /** Copy block the scraps steer around (legibility exclusion zone). */
  avoid?: React.RefObject<HTMLElement | null>;
}

interface Sprite {
  c: HTMLCanvasElement;
  w: number;
  h: number;
}

export function HeroCanvas({ words, label, avoid }: HeroCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion() === true;
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || words.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const count = mobile ? 60 : 140;
    const uniq = Array.from(new Set(words));
    let disposed = false;

    // Particle state — preallocated typed arrays, zero per-frame allocations:
    // position, velocity, rotation (+speed/settled), seed, scale, activation,
    // S-curve slot (x/y/arc-t) and the captured quadratic bezier (start/ctrl).
    const X = fa(count), Y = fa(count), VX = fa(count), VY = fa(count);
    const ROT = fa(count), RSPD = fa(count), FROT = fa(count), SEED = fa(count);
    const SC = fa(count), ACT = fa(count), SLX = fa(count), SLY = fa(count), SLT = fa(count);
    const B0X = fa(count), B0Y = fa(count), BCX = fa(count), BCY = fa(count);
    const WORD = new Uint16Array(count);
    const CAP = new Uint8Array(count);

    // Each UNIQUE word pre-rendered once as a paper-scrap sprite (2x sampled).
    let sprites: Sprite[] = [];
    const buildSprites = () => {
      const fam =
        getComputedStyle(container).getPropertyValue("--font-spline").trim() ||
        "ui-monospace, SFMono-Regular, monospace";
      sprites = uniq.map((word) => {
        const c = document.createElement("canvas");
        const m = c.getContext("2d");
        if (!m) return { c, w: 1, h: 1 };
        m.font = `500 11px ${fam}`;
        const w = Math.ceil(m.measureText(word).width) + 16;
        const h = 26;
        c.width = w * 2; c.height = h * 2;
        m.scale(2, 2); // resizing reset the context — rebuild state
        m.font = `500 11px ${fam}`;
        const f = 7; // folded-corner size
        m.beginPath();
        m.moveTo(0.5, 0.5); m.lineTo(w - f - 0.5, 0.5); m.lineTo(w - 0.5, f + 0.5);
        m.lineTo(w - 0.5, h - 0.5); m.lineTo(0.5, h - 0.5); m.closePath();
        m.fillStyle = BENK; m.fill();
        m.strokeStyle = HAIRLINE; m.lineWidth = 1; m.stroke();
        m.beginPath(); // corner-fold flap, one tone up
        m.moveTo(w - f - 0.5, 0.5); m.lineTo(w - f - 0.5, f + 0.5); m.lineTo(w - 0.5, f + 0.5);
        m.closePath(); m.fillStyle = "#2B2319"; m.fill(); m.stroke();
        m.fillStyle = STOV; m.textBaseline = "middle"; m.fillText(word, 8, h / 2 + 0.5);
        return { c, w, h };
      });
    };

    // Geometry: gentle S-curve polyline anchored at the 38% spine.
    const CN = 72;
    const PX = fa(CN), PY = fa(CN), PL = fa(CN); // polyline + cumulative length
    let linePath: Path2D | null = null;
    let totalLen = 0, W = 0, H = 0, viewH = 1, rectLeft = 0, pageTop = 0;
    // Exclusion ellipse around the copy block (container space, at p = 0).
    // The block is sticky, so per frame its centre rides p * scrollRange.
    let exX = 0, exY = 0, exHW = 0, exHH = 0, scrollRange = 0;
    let inited = false;

    const spawn = () => {
      for (let i = 0; i < count; i++) {
        X[i] = W * (0.06 + 0.88 * rand(i, 1)); Y[i] = H * (0.04 + 0.5 * rand(i, 2));
        VX[i] = (rand(i, 20) - 0.5) * 30; VY[i] = (rand(i, 21) - 0.5) * 24;
        ROT[i] = (rand(i, 3) - 0.5) * 0.5; SEED[i] = Math.floor(rand(i, 0) * 1e4);
        SC[i] = 0.8 + 0.4 * rand(i, 4); RSPD[i] = (rand(i, 6) - 0.5) * 0.6;
        FROT[i] = ROT_SET[Math.floor(rand(i, 5) * 4) % 4];
        ACT[i] = 0.45 + i * 0.0018; // staggered activation
        WORD[i] = i % uniq.length;
        if (exHW > 0) {
          // never spawn on the copy block — lift the scrap above the zone
          const nx = (X[i] - exX) / exHW, ny = (Y[i] - exY) / exHH;
          if (nx * nx + ny * ny < 1) {
            Y[i] = Math.max(H * 0.03, exY - exHH - 24 - rand(i, 23) * 90);
          }
        }
      }
    };

    const computeGeometry = () => {
      const r = container.getBoundingClientRect();
      W = r.width; H = r.height; viewH = window.innerHeight || 1;
      rectLeft = r.left; pageTop = r.top + window.scrollY;
      scrollRange = Math.max(0, H - viewH);
      const av = avoid?.current ?? null;
      if (av) {
        // back the sticky offset out so exX/exY are the p=0 base position
        const ar = av.getBoundingClientRect();
        const stickyOff = Math.min(Math.max(window.scrollY - pageTop, 0), scrollRange);
        exX = ar.left - r.left + ar.width / 2;
        exY = ar.top - r.top - stickyOff + ar.height / 2;
        exHW = ar.width / 2 + 56;
        exHH = ar.height / 2 + 44;
      }
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      // 38% of the 1280px container when wider, 38% of the canvas otherwise —
      // keeps the hand-off aligned with the section ThreadSegment spine.
      const x38 = W <= 1280 ? W * 0.38 : (W - 1280) / 2 + 1280 * 0.38;
      const amp = Math.min(W * 0.07, 110);
      linePath = new Path2D();
      let len = 0;
      for (let i = 0; i < CN; i++) {
        const t = i / (CN - 1);
        const x = x38 + amp * Math.sin(t * TAU) * Math.sin(t * Math.PI);
        const y = H * (0.3 + 0.7 * t);
        if (i === 0) linePath.moveTo(x, y);
        else {
          len += Math.hypot(x - PX[i - 1], y - PY[i - 1]);
          linePath.lineTo(x, y);
        }
        PX[i] = x; PY[i] = y; PL[i] = len;
      }
      totalLen = Math.max(1, len);
      ctx.setLineDash([totalLen, totalLen]); // resize-only allocation
      for (let i = 0; i < count; i++) {
        const t = clamp01(0.03 + 0.94 * (i / Math.max(1, count - 1)) + (rand(i, 7) - 0.5) * 0.04);
        SLT[i] = t;
        const target = t * totalLen;
        let j = 1;
        while (j < CN - 1 && PL[j] < target) j++;
        const st = (target - PL[j - 1]) / Math.max(1e-6, PL[j] - PL[j - 1]);
        SLX[i] = PX[j - 1] + (PX[j] - PX[j - 1]) * st + (rand(i, 11) - 0.5) * 18;
        SLY[i] = PY[j - 1] + (PY[j] - PY[j - 1]) * st + (rand(i, 13) - 0.5) * 14;
      }
      CAP.fill(0); // recapture beziers against fresh geometry
      if (!inited) { spawn(); inited = true; }
    };

    // Pointer repulsion — fine pointers only, passive listener on the SECTION.
    let ptX = -1e4, ptY = -1e4, ptTX = -1e4, ptTY = -1e4;
    const section = (container.closest("section") as HTMLElement | null) ?? container;
    const onMove = (e: PointerEvent) => {
      ptTX = e.clientX - rectLeft; ptTY = e.clientY + window.scrollY - pageTop;
    };
    const onLeave = () => { ptTX = ptTY = -1e4; };

    // Frame loop state.
    let raf = 0, prevTime = 0, prevP = -1, ftI = 0, ftN = 0;
    let running = false, inView = false, faded = false;
    let pulse = 1; // own velocity lerp — no per-frame style reads
    let live = count;
    const frameTimes = fa(30);

    const drawLine = (lp: number, blur: number) => {
      if (!linePath) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.lineDashOffset = totalLen * (1 - lp);
      ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = GLOD; ctx.shadowColor = GLOD_HALO; ctx.shadowBlur = blur;
      ctx.stroke(linePath);
      ctx.shadowBlur = 0;
    };

    const draw = (p: number, tt: number, dt: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const far = Math.abs(ptTX - ptX) > 400 || Math.abs(ptTY - ptY) > 400;
      ptX = far ? ptTX : ptX + (ptTX - ptX) * 0.18;
      ptY = far ? ptTY : ptY + (ptTY - ptY) * 0.18;
      const driftAmp = 1 - smooth(0.3, 0.45, p); // noise eases out toward the gather
      const damp = Math.exp(-2.6 * dt);
      const lp = easeOutCubic(clamp01((p - 0.8) / 0.2)); // Phase C line progress
      const globalFade = 1 - smooth(0.93, 0.995, p);
      const exYNow = exY + p * scrollRange; // copy block rides the sticky stage

      for (let i = 0; i < live; i++) {
        const a = ACT[i];
        if (p < a) {
          CAP[i] = 0;
          // Phase A — free drift on the seeded noise field
          const ang = noise2(X[i] * 0.0045 + tt * 0.1, Y[i] * 0.0045, SEED[i]) * Math.PI * 1.6;
          const drive = (26 * driftAmp + 4) * 2.2 * dt;
          VX[i] += Math.cos(ang) * drive; VY[i] += Math.sin(ang) * drive;
          const dx = X[i] - ptX, dy = Y[i] - ptY;
          const d2 = dx * dx + dy * dy;
          if (d2 < 6400 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / 80) * (1 - d / 80) * 500 * dt; // 80px eased push
            VX[i] += (dx / d) * f; VY[i] += (dy / d) * f;
          }
          if (exHW > 0) {
            // copy-zone exclusion: eased elliptical push out of the text block
            const nx = (X[i] - exX) / exHW, ny = (Y[i] - exYNow) / exHH;
            const de = Math.sqrt(nx * nx + ny * ny);
            if (de < 1) {
              const ux = de < 0.01 ? 0 : nx / de; // dead centre: lift straight up
              const uy = de < 0.01 ? -1 : ny / de;
              const f = (1 - de) * 620 * dt;
              VX[i] += ux * f; VY[i] += uy * f;
            }
          }
          VX[i] *= damp; VY[i] *= damp;
          X[i] += VX[i] * dt; Y[i] += VY[i] * dt;
          ROT[i] += RSPD[i] * dt * driftAmp;
          if (p < 0.45) {
            // soft wrap keeps the drift inside the first viewport
            if (X[i] < -60) X[i] += W + 120;
            else if (X[i] > W + 60) X[i] -= W + 120;
            if (Y[i] < -40) Y[i] += H * 0.62 + 80;
            else if (Y[i] > H * 0.62 + 40) Y[i] -= H * 0.62 + 80;
          }
        } else {
          // Phase B — steer along a quadratic bezier captured at activation
          if (!CAP[i]) {
            B0X[i] = X[i]; B0Y[i] = Y[i]; CAP[i] = 1;
            BCX[i] = (X[i] + SLX[i]) / 2 + (rand(i, 17) - 0.5) * 180;
            BCY[i] = (Y[i] + SLY[i]) / 2 + (rand(i, 19) - 0.5) * 90;
          }
          const q = easeOutCubic(clamp01((p - a) / Math.max(0.05, 0.8 - a)));
          const u = 1 - q;
          X[i] = u * u * B0X[i] + 2 * u * q * BCX[i] + q * q * SLX[i];
          Y[i] = u * u * B0Y[i] + 2 * u * q * BCY[i] + q * q * SLY[i];
          if (q > 0.01) ROT[i] += (FROT[i] - ROT[i]) * Math.min(1, dt * 6);
          VX[i] = 0; VY[i] = 0;
        }
        // Phase C — the advancing line tip absorbs each scrap at its slot
        let alpha = 0.96 * globalFade;
        if (lp > 0) alpha *= 1 - clamp01((lp - SLT[i]) / 0.12);
        if (alpha <= 0.01) continue;
        const sp = sprites[WORD[i]];
        if (!sp) continue;
        const cos = Math.cos(ROT[i]) * SC[i], sin = Math.sin(ROT[i]) * SC[i];
        ctx.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, dpr * X[i], dpr * Y[i]);
        ctx.globalAlpha = alpha;
        ctx.drawImage(sp.c, -sp.w / 2, -sp.h / 2, sp.w, sp.h);
      }

      if (lp > 0) drawLine(lp, 10 + pulse * 2); // subtle scroll-velocity glow
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!running) return;
      if (!inited) {
        raf = requestAnimationFrame(frame); // ResizeObserver has not fired yet
        return;
      }
      const first = prevTime === 0;
      const dt = first ? 1 / 60 : Math.min(0.05, (now - prevTime) / 1000);
      if (!first) {
        // watchdog: every fresh 30-frame window still averaging >20ms halves
        // the live particles again, down to the 16-sprite floor
        frameTimes[ftI] = now - prevTime;
        ftI = (ftI + 1) % 30;
        if (ftN < 30) ftN++;
        if (ftN === 30) {
          ftN = 0;
          let sum = 0;
          for (let k = 0; k < 30; k++) sum += frameTimes[k];
          if (sum / 30 > 20 && live > 16) live = Math.max(16, live >> 1);
        }
      }
      prevTime = now;
      const p = scrollYProgress.get();
      if (!first && prevP >= 0 && dt > 0) {
        const v = (Math.abs(p - prevP) / dt) * Math.max(1, H - viewH);
        pulse += (1 + Math.min(v, 3000) / 1000 - pulse) * 0.08;
      }
      prevP = p;
      // hand-off: ease the canvas out as the SVG segments take over
      if (p >= 0.98 && !faded) { container.style.opacity = "0"; faded = true; }
      else if (p < 0.98 && faded) { container.style.opacity = "1"; faded = false; }
      draw(p, now / 1000, dt);
      raf = requestAnimationFrame(frame);
    };

    const updateRunning = () => {
      const want = inView && !document.hidden;
      if (want && !running) {
        running = true; prevTime = 0;
        if (!raf) raf = requestAnimationFrame(frame);
      } else if (!want) running = false; // frame() drops out; last frame stays painted
    };

    // Reduced motion: ONE static composed frame — line drawn, scraps resting.
    const drawStatic = () => {
      if (!inited || !linePath) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawLine(1, 12);
      const n = Math.min(8, count);
      for (let k = 0; k < n; k++) {
        const i = Math.min(count - 1, Math.floor((k + 0.5) * (count / n)));
        const sp = sprites[WORD[i]];
        if (!sp) continue;
        const cos = Math.cos(FROT[i]) * SC[i], sin = Math.sin(FROT[i]) * SC[i];
        const x = SLX[i] + (k % 2 ? 34 : -34); // resting beside the line
        ctx.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, dpr * x, dpr * SLY[i]);
        ctx.globalAlpha = 0.95;
        ctx.drawImage(sp.c, -sp.w / 2, -sp.h / 2, sp.w, sp.h);
      }
      ctx.globalAlpha = 1;
    };

    buildSprites();
    document.fonts?.ready.then(() => {
      if (disposed) return;
      buildSprites(); // re-render crisp once Spline Sans Mono is live
      if (reduced) drawStatic();
    });

    const ro = new ResizeObserver(() => {
      computeGeometry();
      if (reduced) drawStatic();
    });
    ro.observe(container);

    let io: IntersectionObserver | null = null;
    const onVis = () => updateRunning();
    if (!reduced) {
      io = new IntersectionObserver(
        (entries) => {
          inView = entries[0]?.isIntersecting ?? false;
          updateRunning();
        },
        { rootMargin: "120px" },
      );
      io.observe(container);
      document.addEventListener("visibilitychange", onVis);
      if (fine) {
        section.addEventListener("pointermove", onMove, { passive: true });
        section.addEventListener("pointerleave", onLeave, { passive: true });
      }
    }

    return () => {
      disposed = true;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, [words, reduced, scrollYProgress, avoid]);

  // aria-hidden sits on the <canvas> only, so the sr-only description from
  // content.a11y.threadLabel stays exposed to assistive tech.
  return (
    <div
      ref={containerRef}
      className="vk-herocanvas"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        opacity: 1,
        transition: "opacity 480ms var(--ease-work, ease)",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      <span className="vk-sr">{label}</span>
    </div>
  );
}
