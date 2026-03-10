"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/* ═══════════════════════════════════════════════════════
   CREATURE — A monkey-like soul living on your website
   All coordinates are SCREEN-SPACE (viewport).
   ═══════════════════════════════════════════════════════ */

interface Platform {
  x: number; y: number; w: number; h: number;
  el: Element;
  text: string;
}

type Mood = "idle" | "bored" | "curious" | "surprised" | "happy" | "dragged" | "hanging";

const W = 36;
const H = 44;
const GRAVITY = 0.55;
const FRICTION = 0.86;
const JUMP_VY = -12;
const MAX_VY = 16;
const BLINK_MIN = 2200;
const BLINK_MAX = 5500;
const BORED_AFTER = 10000;
const COMMENT_CD = 30000;

const SELECTORS = [
  ".nav", "header",
  ".card", ".step", ".result", ".val",
  ".stats", ".stats__item",
  ".contact__right", ".contact__left",
  ".cta", ".problem-row",
  ".hero__actions", ".footer",
  "section",
];

const COMMENTS: Record<string, string[]> = {
  tjenester: ["Oi, kule tjenester!", "Software? Ja takk!", "Favoritt-seksjonen min."],
  prosess: ["Tre steg? Lett!", "Steg for steg!"],
  kontakt: ["Si hei da!", "Petter er hyggelig!"],
  om: ["Bra team!", "Haugesund represent!"],
  resultater: ["40%?! Wow!", "Imponerende!"],
  default: ["Hei! Klikk meg!", "Fin side, hva?", "Scroll litt til!", "*gjesper*", "La-di-da..."],
};

const CLICK_MSGS = [
  "Hei! Hva lurer du pa?",
  "Trenger du hjelp?",
  "Jeg kan vise deg rundt!",
  "Spennende at du er her!",
];

export default function Creature() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    x: number; y: number; vx: number; vy: number;
    onGround: boolean; groundPlat: Platform | null;
    groundEl: Element | null; groundOffX: number;
    mood: Mood; moodT: number; facing: number;
    squashX: number; squashY: number; shake: number;
    eyeX: number; eyeY: number;
    blinkT: number; blinking: boolean; blinkDur: number;
    idleT: number; lastComment: number;
    platforms: Platform[];
    jumpCD: number;
    isDrag: boolean; dragOX: number; dragOY: number;
    throwVx: number; throwVy: number; prevMX: number; prevMY: number;
    mx: number; my: number;
    speechText: string; speechT: number;
    lastTime: number; raf: number;
    lastScan: number;
    tailAngle: number;
    hangingFrom: Platform | null; hangX: number; hangEl: Element | null;
  }>({
    x: 300, y: 200, vx: 0, vy: 0,
    onGround: false, groundPlat: null,
    groundEl: null, groundOffX: 0,
    mood: "idle", moodT: 0, facing: 1,
    squashX: 1, squashY: 1, shake: 0,
    eyeX: 300, eyeY: 200,
    blinkT: 3000, blinking: false, blinkDur: 0,
    idleT: 0, lastComment: 0,
    platforms: [],
    jumpCD: 0,
    isDrag: false, dragOX: 0, dragOY: 0,
    throwVx: 0, throwVy: 0, prevMX: 0, prevMY: 0,
    mx: 0, my: 0,
    speechText: "", speechT: 0,
    lastTime: 0, raf: 0,
    lastScan: 0,
    tailAngle: 0,
    hangingFrom: null, hangX: 0, hangEl: null,
  });

  const [bubble, setBubble] = useState<{ text: string; x: number; y: number } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // ─── Scan visible platforms (screen-space) ───
  const scanPlatforms = useCallback((): Platform[] => {
    const out: Platform[] = [];
    const seen = new Set<Element>();
    for (const sel of SELECTORS) {
      document.querySelectorAll(sel).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        const r = el.getBoundingClientRect();
        if (r.width > 50 && r.height > 10 && r.bottom > -300 && r.top < window.innerHeight + 300) {
          out.push({ x: r.left, y: r.top, w: r.width, h: r.height, el, text: (el.textContent || "").slice(0, 120).toLowerCase() });
        }
      });
    }
    return out;
  }, []);

  const getComment = useCallback((p: Platform | null): string => {
    if (p?.text) {
      for (const [k, v] of Object.entries(COMMENTS)) {
        if (k !== "default" && p.text.includes(k)) return v[Math.floor(Math.random() * v.length)];
      }
    }
    const d = COMMENTS.default;
    return d[Math.floor(Math.random() * d.length)];
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    const s = stateRef.current;

    // DPR-aware sizing
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cvs.width = window.innerWidth * dpr;
      cvs.height = window.innerHeight * dpr;
      cvs.style.width = window.innerWidth + "px";
      cvs.style.height = window.innerHeight + "px";
    };
    resize();

    s.x = window.innerWidth * 0.5;
    s.y = window.innerHeight * 0.3;

    // ─── Events ───
    const onResize = () => resize();
    const onMouse = (e: MouseEvent) => {
      s.mx = e.clientX; s.my = e.clientY;
      if (s.isDrag) {
        s.throwVx = (e.clientX - s.prevMX) * 0.6;
        s.throwVy = (e.clientY - s.prevMY) * 0.6;
        s.prevMX = e.clientX; s.prevMY = e.clientY;
        s.x = e.clientX - s.dragOX;
        s.y = e.clientY - s.dragOY;
      }
    };

    const hitTest = (cx: number, cy: number) =>
      cx >= s.x - W / 2 - 12 && cx <= s.x + W / 2 + 12 &&
      cy >= s.y - H - 12 && cy <= s.y + 12;

    const onDown = (e: MouseEvent) => {
      if (hitTest(e.clientX, e.clientY)) {
        e.preventDefault();
        s.isDrag = true;
        s.dragOX = e.clientX - s.x;
        s.dragOY = e.clientY - s.y;
        s.prevMX = e.clientX; s.prevMY = e.clientY;
        s.onGround = false;
        s.groundEl = null; s.groundPlat = null;
        s.hangingFrom = null; s.hangEl = null;
        s.mood = "dragged";
        s.vx = 0; s.vy = 0;
      }
    };

    const onUp = () => {
      if (s.isDrag) {
        s.isDrag = false;
        s.vx = s.throwVx * 2.5;
        s.vy = s.throwVy * 2.5;
        const force = Math.abs(s.throwVx) + Math.abs(s.throwVy);
        s.mood = force > 6 ? "surprised" : "idle";
        s.moodT = force > 6 ? 1500 : 0;
      }
    };

    const onClick = (e: MouseEvent) => {
      if (hitTest(e.clientX, e.clientY) && !s.isDrag) {
        const msg = CLICK_MSGS[Math.floor(Math.random() * CLICK_MSGS.length)];
        s.speechText = msg;
        s.speechT = 3000;
        s.mood = "happy"; s.moodT = 2000; s.idleT = 0;
        setBubble({ text: msg, x: s.x, y: s.y - H - 12 });
        setTimeout(() => setBubble(null), 3000);
        setChatOpen(true);
        setTimeout(() => chatInputRef.current?.focus(), 150);
      }
    };

    const onScroll = () => {
      // Mark platforms stale — will rescan next frame
      s.lastScan = 0;
    };

    // Touch
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      s.mx = t.clientX; s.my = t.clientY;
      if (hitTest(t.clientX, t.clientY)) {
        e.preventDefault();
        s.isDrag = true;
        s.dragOX = t.clientX - s.x;
        s.dragOY = t.clientY - s.y;
        s.prevMX = t.clientX; s.prevMY = t.clientY;
        s.onGround = false; s.groundEl = null; s.groundPlat = null;
        s.hangingFrom = null; s.hangEl = null;
        s.mood = "dragged"; s.vx = 0; s.vy = 0;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      s.mx = t.clientX; s.my = t.clientY;
      if (s.isDrag) {
        e.preventDefault();
        s.throwVx = (t.clientX - s.prevMX) * 0.6;
        s.throwVy = (t.clientY - s.prevMY) * 0.6;
        s.prevMX = t.clientX; s.prevMY = t.clientY;
        s.x = t.clientX - s.dragOX;
        s.y = t.clientY - s.dragOY;
      }
    };
    const onTouchEnd = () => onUp();

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("click", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    s.platforms = scanPlatforms();

    // ─── TICK ───
    function tick(time: number) {
      const dt = s.lastTime ? Math.min((time - s.lastTime) / 16.667, 3) : 1;
      s.lastTime = time;
      const now = time;
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      // Rescan platforms periodically (every ~800ms or when scroll invalidated)
      if (now - s.lastScan > 800) {
        s.platforms = scanPlatforms();
        s.lastScan = now;
      }

      // ══ STUCK ON GROUND ELEMENT — follow it every frame ══
      if (s.onGround && s.groundEl) {
        const r = s.groundEl.getBoundingClientRect();
        // Element moved (scroll, resize, animation) — follow it
        s.y = r.top;
        s.x = r.left + s.groundOffX;
        // Clamp x to platform width
        if (s.x < r.left + W / 2) s.x = r.left + W / 2;
        if (s.x > r.right - W / 2) s.x = r.right - W / 2;

        // Platform scrolled off screen? Let go.
        if (r.top > vh + 60 || r.bottom < -60) {
          s.onGround = false;
          s.groundEl = null;
          s.groundPlat = null;
          s.vy = 0;
        }
      }

      // ══ DRAGGING ══
      if (s.isDrag) {
        s.onGround = false; s.groundEl = null; s.groundPlat = null;
        s.hangingFrom = null; s.hangEl = null;
        s.squashX = 0.88; s.squashY = 1.12;
        s.tailAngle += 0.15 * dt;
        updateEyes(dt); updateBlink(dt);
        render();
        s.raf = requestAnimationFrame(tick);
        return;
      }

      // ══ HANGING ══
      if (s.hangEl) {
        const r = s.hangEl.getBoundingClientRect();
        // Follow element
        const targetX = r.left + s.hangX;
        const targetY = r.top + r.height + 4;
        s.x += (targetX - s.x) * 0.15;
        s.y += (targetY - s.y) * 0.15;
        s.vx = 0; s.vy = 0;
        s.tailAngle = Math.sin(now * 0.003) * 0.6;

        // Element off screen or random let-go
        if (r.bottom < -40 || r.top > vh + 40 || Math.random() < 0.002 * dt) {
          s.hangEl = null; s.hangingFrom = null;
          s.vy = 2; s.vx = (Math.random() - 0.5) * 6;
          s.mood = "idle";
        }

        s.squashX += (1 - s.squashX) * 0.1;
        s.squashY += (1 - s.squashY) * 0.1;
        s.idleT += dt * 16.667;
        updateEyes(dt); updateBlink(dt); updateMood(dt, now);
        render();
        s.raf = requestAnimationFrame(tick);
        return;
      }

      // ══ FREE PHYSICS ══
      if (!s.onGround) {
        s.vy += GRAVITY * dt;
        if (s.vy > MAX_VY) s.vy = MAX_VY;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= Math.pow(0.997, dt);
      } else {
        // On ground — apply friction to vx
        s.vx *= Math.pow(FRICTION, dt);
        if (Math.abs(s.vx) < 0.08) s.vx = 0;
        s.x += s.vx * dt;
      }

      // ══ PLATFORM COLLISION (only when airborne) ══
      if (!s.onGround) {
        for (const p of s.platforms) {
          // Fresh rect each collision check
          const r = p.el.getBoundingClientRect();
          const pTop = r.top;
          const pLeft = r.left;
          const pRight = r.right;
          const pBottom = r.bottom;
          const bot = s.y;
          const left = s.x - W / 2;
          const right = s.x + W / 2;

          // Land on top of element
          if (
            s.vy >= 0 &&
            bot >= pTop - 5 && bot <= pTop + 20 &&
            right > pLeft + 4 && left < pRight - 4
          ) {
            s.y = pTop;
            if (s.vy > 2.5) {
              const imp = Math.min(s.vy / MAX_VY, 1);
              s.squashY = 1 + imp * 0.4;
              s.squashX = 1 - imp * 0.2;
              s.shake = imp * 4;
              if (s.vy > 9) { s.mood = "surprised"; s.moodT = 700; }
            }
            s.vy = 0;
            s.onGround = true;
            s.groundEl = p.el;
            s.groundPlat = p;
            s.groundOffX = s.x - r.left; // remember offset on platform
            break;
          }

          // Grab bottom edge (hang)
          if (
            s.vy > 1 &&
            bot >= pBottom - 10 && bot <= pBottom + 18 &&
            s.x > pLeft + 10 && s.x < pRight - 10 &&
            Math.random() < 0.06
          ) {
            s.hangEl = p.el;
            s.hangingFrom = p;
            s.hangX = s.x - r.left; // offset from element left
            s.vy = 0; s.vx = 0;
            s.mood = "hanging"; s.moodT = 0;
            s.squashY = 1.2; s.squashX = 0.85;
            break;
          }
        }
      }

      // ══ OFF-SCREEN RECOVERY ══
      if (s.y > vh + 60) {
        // Find a visible platform to land on
        const visible = s.platforms.filter(p => {
          const r = p.el.getBoundingClientRect();
          return r.top > 50 && r.top < vh - 100;
        });
        if (visible.length) {
          const t = visible[Math.floor(Math.random() * visible.length)];
          const r = t.el.getBoundingClientRect();
          s.x = r.left + r.width / 2;
          s.y = r.top - 30;
          s.vy = 1;
          s.vx = 0;
        } else {
          s.y = -30;
          s.x = vw * 0.5;
          s.vy = 2;
        }
        s.onGround = false; s.groundEl = null; s.groundPlat = null;
      }
      if (s.y < -80) {
        s.y = -20; s.vy = 2;
      }
      if (s.x < W / 2) { s.x = W / 2; s.vx = Math.abs(s.vx) * 0.4; }
      if (s.x > vw - W / 2) { s.x = vw - W / 2; s.vx = -Math.abs(s.vx) * 0.4; }

      // Squash recovery
      s.squashX += (1 - s.squashX) * 0.12 * dt;
      s.squashY += (1 - s.squashY) * 0.12 * dt;
      s.shake *= Math.pow(0.82, dt);

      // ══ AI BEHAVIOR ══
      s.jumpCD -= dt * 16.667;
      s.idleT += dt * 16.667;

      // Tail physics
      const targetTail = s.onGround ? Math.sin(now * 0.002) * 0.3 : s.vy * 0.05;
      s.tailAngle += (targetTail - s.tailAngle) * 0.08 * dt;

      updateEyes(dt); updateBlink(dt); updateMood(dt, now);

      // Random jumping
      if (s.onGround && s.jumpCD <= 0 && Math.random() < 0.004 * dt) {
        const targets = s.platforms.filter(p => {
          const r = p.el.getBoundingClientRect();
          return r.top > -20 && r.top < vh + 20 &&
            p.el !== s.groundEl &&
            Math.abs(r.top - s.y) < 350;
        });
        if (targets.length) {
          const t = targets[Math.floor(Math.random() * targets.length)];
          const r = t.el.getBoundingClientRect();
          const dx = (r.left + r.width / 2) - s.x;
          s.vx = Math.max(-10, Math.min(10, dx * 0.05));
          s.vy = JUMP_VY + (r.top < s.y ? -2 : 1);
          s.onGround = false;
          s.groundEl = null;
          s.groundPlat = null;
          s.jumpCD = 1800 + Math.random() * 3000;
          s.squashY = 0.7; s.squashX = 1.3;
          s.idleT = 0;
        }
      }

      // Context comments
      if (now - s.lastComment > COMMENT_CD && s.onGround && Math.random() < 0.008 * dt) {
        const c = getComment(s.groundPlat);
        s.speechText = c; s.speechT = 3500; s.lastComment = now;
        setBubble({ text: c, x: s.x, y: s.y - H - 12 });
        setTimeout(() => setBubble(null), 3500);
      }

      if (s.speechT > 0) s.speechT -= dt * 16.667;

      render();
      s.raf = requestAnimationFrame(tick);
    }

    function updateEyes(dt: number) {
      s.eyeX += (s.mx - s.eyeX) * 0.05 * dt;
      s.eyeY += (s.my - s.eyeY) * 0.05 * dt;
      if (Math.abs(s.mx - s.x) > 40) s.facing = s.mx > s.x ? 1 : -1;
      if (Math.abs(s.vx) > 1) s.facing = s.vx > 0 ? 1 : -1;
    }

    function updateBlink(dt: number) {
      const ms = dt * 16.667;
      if (s.blinking) {
        s.blinkDur -= ms;
        if (s.blinkDur <= 0) s.blinking = false;
      } else {
        s.blinkT -= ms;
        if (s.blinkT <= 0) {
          s.blinking = true;
          s.blinkDur = 100 + Math.random() * 80;
          s.blinkT = BLINK_MIN + Math.random() * (BLINK_MAX - BLINK_MIN);
        }
      }
    }

    function updateMood(dt: number, now: number) {
      const ms = dt * 16.667;
      if (s.moodT > 0) {
        s.moodT -= ms;
        if (s.moodT <= 0 && s.mood !== "idle" && s.mood !== "hanging") s.mood = "idle";
      }
      if (s.idleT > BORED_AFTER && s.mood === "idle" && s.onGround) {
        s.mood = "bored"; s.moodT = 5000; s.idleT = 0;
      }
    }

    // ─── RENDER ───
    function render() {
      if (!cvs) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cvs.width, cvs.height);

      const sx = s.x;
      const sy = s.y;
      if (sx < -80 || sx > window.innerWidth + 80 || sy < -100 || sy > window.innerHeight + 80) return;

      ctx.save();
      ctx.translate(sx, sy);

      // Landing shake
      if (s.shake > 0.05) ctx.translate(Math.sin(performance.now() * 0.15) * s.shake, 0);

      const isHanging = s.hangEl !== null;

      // If hanging — flip upside down
      if (isHanging) {
        ctx.scale(s.facing, -1);
        ctx.translate(0, H);
      } else {
        ctx.scale(s.facing, 1);
      }

      // Squash/stretch pivot at feet
      ctx.translate(0, 0);
      ctx.scale(s.squashX, s.squashY);

      const body = "#3B3F2B";
      const belly = "#c2d84a";

      // ── Tail ──
      ctx.save();
      ctx.translate(0, -H * 0.3);
      ctx.rotate(s.tailAngle + (s.facing > 0 ? 0.3 : -0.3) * s.facing);
      ctx.strokeStyle = body;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-W / 2 * s.facing * -1, 0);
      const tailLen = 22;
      const tailCurl = Math.sin(performance.now() * 0.004) * 8;
      ctx.quadraticCurveTo(
        -W / 2 * s.facing * -1 - 14 * s.facing * -1, tailLen * 0.4,
        -W / 2 * s.facing * -1 - 10 * s.facing * -1 + tailCurl, tailLen
      );
      ctx.stroke();
      ctx.restore();

      // ── Body ──
      ctx.beginPath();
      const r = 12;
      const bx = -W / 2, by = -H, bw = W, bh = H;
      ctx.moveTo(bx + r, by);
      ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
      ctx.arcTo(bx + bw, by + bh, bx, by + bh, 6);
      ctx.arcTo(bx, by + bh, bx, by, 6);
      ctx.arcTo(bx, by, bx + bw, by, r);
      ctx.closePath();
      ctx.fillStyle = body;
      ctx.fill();

      // Belly spot
      ctx.beginPath();
      ctx.ellipse(0, -H * 0.32, W * 0.28, H * 0.22, 0, 0, Math.PI * 2);
      ctx.fillStyle = belly;
      ctx.globalAlpha = 0.18;
      ctx.fill();
      ctx.globalAlpha = 1;

      // ── Ears ──
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(-W / 2 + 2, -H + 2, 6, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(W / 2 - 2, -H + 2, 6, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Inner ear
      ctx.fillStyle = "#5a5e48";
      ctx.beginPath();
      ctx.ellipse(-W / 2 + 3, -H + 3, 3, 2.5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(W / 2 - 3, -H + 3, 3, 2.5, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // ── Eyes ──
      const eyeY = -H * 0.68;
      const lx = -7, rx = 7;
      const er = 5.5;

      const dx = s.eyeX - s.x;
      const dy = s.eyeY - (s.y - H * 0.68);
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const pOff = 2.2;
      const px = (dx / d) * pOff * s.facing;
      const py = (dy / d) * pOff;

      if (s.blinking) {
        ctx.strokeStyle = "#e8e6df";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(lx - 4, eyeY); ctx.lineTo(lx + 4, eyeY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rx - 4, eyeY); ctx.lineTo(rx + 4, eyeY); ctx.stroke();
      } else {
        // Whites
        ctx.fillStyle = "#f0ede6";
        [lx, rx].forEach(ex => {
          ctx.beginPath();
          ctx.ellipse(ex, eyeY, er, er + 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        });
        // Pupils
        const pr = s.mood === "surprised" ? 2.2 : 2.8;
        ctx.fillStyle = "#1a1c14";
        [lx, rx].forEach(ex => {
          ctx.beginPath();
          ctx.ellipse(ex + px, eyeY + py, pr, pr, 0, 0, Math.PI * 2);
          ctx.fill();
        });
        // Shine
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        [lx, rx].forEach(ex => {
          ctx.beginPath();
          ctx.ellipse(ex + px - 0.8, eyeY + py - 1.2, 1, 1, 0, 0, Math.PI * 2);
          ctx.fill();
        });

        if (s.mood === "happy") {
          ctx.fillStyle = body;
          [lx, rx].forEach(ex => {
            ctx.beginPath();
            ctx.ellipse(ex, eyeY - er + 1.5, er + 0.5, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }

      // ── Mouth ──
      const my = -H * 0.35;
      ctx.lineCap = "round";
      ctx.lineWidth = 1.5;

      if (s.mood === "happy") {
        ctx.strokeStyle = "#c2d84a";
        ctx.beginPath();
        ctx.moveTo(-4, my);
        ctx.quadraticCurveTo(0, my + 4.5, 4, my);
        ctx.stroke();
      } else if (s.mood === "surprised") {
        ctx.fillStyle = "#2a2d1f";
        ctx.beginPath();
        ctx.ellipse(0, my + 1.5, 2.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.mood === "bored") {
        // Flat / yawn
        ctx.strokeStyle = "#c2d84a";
        ctx.beginPath();
        const yawnOpen = Math.sin(performance.now() * 0.003) * 1.5;
        ctx.moveTo(-3.5, my + yawnOpen);
        ctx.lineTo(3.5, my + yawnOpen);
        ctx.stroke();
      } else {
        // Neutral
        ctx.strokeStyle = "#c2d84a";
        ctx.beginPath();
        ctx.moveTo(-3, my);
        ctx.quadraticCurveTo(0, my + 2.5, 3, my);
        ctx.stroke();
      }

      // ── Arms ──
      ctx.strokeStyle = body;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      const ay = -H * 0.42;

      if (s.isDrag || s.mood === "dragged") {
        ctx.beginPath(); ctx.moveTo(-W / 2, ay); ctx.lineTo(-W / 2 - 10, ay - 14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W / 2, ay); ctx.lineTo(W / 2 + 10, ay - 14); ctx.stroke();
      } else if (isHanging) {
        // Arms reaching up (but we're flipped, so they draw down visually = up in world)
        ctx.beginPath(); ctx.moveTo(-W / 2, ay); ctx.lineTo(-W / 2 - 4, ay - 16); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W / 2, ay); ctx.lineTo(W / 2 + 4, ay - 16); ctx.stroke();
      } else if (s.mood === "surprised") {
        ctx.beginPath(); ctx.moveTo(-W / 2, ay); ctx.lineTo(-W / 2 - 12, ay - 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W / 2, ay); ctx.lineTo(W / 2 + 12, ay - 6); ctx.stroke();
      } else if (s.mood === "bored") {
        ctx.beginPath(); ctx.moveTo(-W / 2, ay); ctx.lineTo(-W / 2 - 4, ay + 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W / 2, ay); ctx.lineTo(W / 2 + 4, ay + 12); ctx.stroke();
      } else {
        const aw = s.onGround ? 0 : Math.sin(performance.now() * 0.006) * 4;
        ctx.beginPath(); ctx.moveTo(-W / 2, ay); ctx.lineTo(-W / 2 - 7, ay + 9 + aw); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W / 2, ay); ctx.lineTo(W / 2 + 7, ay + 9 - aw); ctx.stroke();
      }

      // ── Legs ──
      ctx.lineWidth = 2.8;
      const ly = -2;
      const ls = s.onGround ? 6 : 4;

      if (s.mood === "bored" && s.onGround) {
        ctx.beginPath(); ctx.moveTo(-ls, ly); ctx.lineTo(-ls - 5, ly + 9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ls, ly); ctx.lineTo(ls + 5, ly + 9); ctx.stroke();
      } else if (isHanging) {
        // Dangling legs
        const dangle = Math.sin(performance.now() * 0.004) * 3;
        ctx.beginPath(); ctx.moveTo(-5, ly); ctx.lineTo(-5 + dangle, ly + 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(5, ly); ctx.lineTo(5 - dangle, ly + 10); ctx.stroke();
      } else if (!s.onGround) {
        const w = Math.sin(performance.now() * 0.008) * 4;
        ctx.beginPath(); ctx.moveTo(-ls, ly); ctx.lineTo(-ls + w, ly + 9); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ls, ly); ctx.lineTo(ls - w, ly + 9); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(-ls, ly); ctx.lineTo(-ls, ly + 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ls, ly); ctx.lineTo(ls, ly + 8); ctx.stroke();
      }

      ctx.restore();
    }

    s.raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(s.raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [scanPlatforms, getComment]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed", top: 0, left: 0,
          pointerEvents: "none", zIndex: 9999,
        }}
      />
      {bubble && (
        <div style={{
          position: "fixed",
          left: Math.max(10, Math.min(bubble.x - 70, window.innerWidth - 160)),
          top: Math.max(10, bubble.y - 48),
          background: "#f6f4ef", color: "#3a3d32",
          padding: "8px 14px", borderRadius: 12,
          fontSize: 13, fontWeight: 500,
          boxShadow: "0 4px 20px rgba(47,50,39,0.12)",
          border: "1px solid #dddbd4",
          zIndex: 10000, pointerEvents: "none",
          maxWidth: 180, lineHeight: 1.4,
          animation: "cIn .25s cubic-bezier(.16,1,.3,1)",
        }}>
          {bubble.text}
          <div style={{
            position: "absolute", bottom: -5, left: "50%", marginLeft: -5,
            width: 10, height: 10, background: "#f6f4ef",
            border: "1px solid #dddbd4", borderTop: "none", borderLeft: "none",
            transform: "rotate(45deg)",
          }} />
        </div>
      )}
      {chatOpen && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: "#f6f4ef", borderRadius: 16,
          boxShadow: "0 8px 40px rgba(47,50,39,0.18)",
          border: "1px solid #dddbd4",
          zIndex: 10001, width: 300, overflow: "hidden",
          animation: "cIn .25s cubic-bezier(.16,1,.3,1)",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 16px", borderBottom: "1px solid #e8e6e0", background: "#eceae4",
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#3a3d32" }}>Chat med Workflows</span>
            <button onClick={() => setChatOpen(false)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 18, color: "#7a7d6f", lineHeight: 1, padding: "0 4px",
            }}>x</button>
          </div>
          <div style={{ padding: "14px 16px" }}>
            <p style={{ fontSize: 13, color: "#7a7d6f", margin: "0 0 12px", lineHeight: 1.5 }}>
              Her kommer snart en AI-assistent som kan svare pa sporsmal om Workflows!
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input ref={chatInputRef} type="text" placeholder="Skriv en melding..."
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 10,
                  border: "1px solid #dddbd4", fontSize: 13,
                  outline: "none", background: "#fff",
                }}
                onKeyDown={e => { if (e.key === "Escape") setChatOpen(false); }}
              />
              <button style={{
                padding: "10px 16px", borderRadius: 10,
                background: "#3B3F2B", color: "#e8e6df",
                border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>Send</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes cIn{from{opacity:0;transform:scale(.9) translateY(6px)}to{opacity:1;transform:none}}`}</style>
    </>
  );
}
