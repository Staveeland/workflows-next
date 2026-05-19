/**
 * Service Icons — inline SVGs used across landing pages and home.
 * No external dependency; sized via CSS (font-size) using currentColor.
 */

type IconProps = { className?: string; size?: number; strokeWidth?: number };

const base = (size = 28, strokeWidth = 1.6): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
});

/* ─── Level icons ─── */
export function IconChatbot({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M6 7h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H14l-6 5v-5H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="15" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="20" cy="15" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconFlow({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <rect x="3" y="6" width="8" height="6" rx="1.5" />
      <rect x="21" y="6" width="8" height="6" rx="1.5" />
      <rect x="3" y="20" width="8" height="6" rx="1.5" />
      <rect x="21" y="20" width="8" height="6" rx="1.5" />
      <path d="M11 9h6m0 0v14m0-14h4M11 23h6" />
      <path d="M17 9l1.5 1.5L17 12M17 21l1.5-1.5L17 18" />
    </svg>
  );
}

export function IconAgent({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="16" cy="11" r="5" />
      <path d="M16 6V3M8 14l-3 1M24 14l3 1M11 22h10l-1 7H12l-1-7Z" />
      <circle cx="14" cy="11" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="18" cy="11" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ─── Feature icons ─── */
export function IconBolt({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M18 3 6 18h8l-2 11 12-15h-8l2-11Z" />
    </svg>
  );
}

export function IconSpark({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M16 4v6M16 22v6M4 16h6M22 16h6M8 8l4 4M20 20l4 4M8 24l4-4M20 12l4-4" />
    </svg>
  );
}

export function IconBlocks({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <rect x="4" y="4" width="10" height="10" rx="1.5" />
      <rect x="18" y="4" width="10" height="10" rx="1.5" />
      <rect x="4" y="18" width="10" height="10" rx="1.5" />
      <rect x="18" y="18" width="10" height="10" rx="1.5" />
    </svg>
  );
}

/* ─── Process icons ─── */
export function IconTalk({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 8h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4l-5 4v-4H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
      <path d="M14 14h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2l-3 3v-3" opacity=".5" />
    </svg>
  );
}

export function IconBuild({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="m22 4 6 6-3 3-6-6 3-3Z" />
      <path d="m18 8-12 12-2 8 8-2 12-12" />
    </svg>
  );
}

export function IconCheck({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="16" cy="16" r="12" />
      <path d="m10 16 4 4 8-8" />
    </svg>
  );
}

/* ─── Result icons ─── */
export function IconClock({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="16" cy="16" r="12" />
      <path d="M16 9v7l5 3" />
    </svg>
  );
}

export function IconShield({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M16 3 5 7v9c0 7 5 11 11 13 6-2 11-6 11-13V7l-11-4Z" />
      <path d="m11 16 4 4 7-8" />
    </svg>
  );
}

export function IconHeart({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M16 27s-11-6-11-14a6 6 0 0 1 11-3 6 6 0 0 1 11 3c0 8-11 14-11 14Z" />
    </svg>
  );
}

export function IconTrend({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 24 12 16l5 5 11-13" />
      <path d="M21 8h7v7" />
    </svg>
  );
}

/* ─── Generic icons ─── */
export function IconArrow({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M6 16h20m0 0-7-7m7 7-7 7" />
    </svg>
  );
}

export function IconDatabase({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <ellipse cx="16" cy="7" rx="11" ry="3" />
      <path d="M5 7v9c0 1.7 5 3 11 3s11-1.3 11-3V7M5 16v9c0 1.7 5 3 11 3s11-1.3 11-3v-9" />
    </svg>
  );
}

export function IconPlug({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M11 4v8M21 4v8M8 12h16v3a8 8 0 0 1-8 8 8 8 0 0 1-8-8v-3ZM16 23v5" />
    </svg>
  );
}

export function IconBrain({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M12 5a4 4 0 0 0-4 4v1a4 4 0 0 0-2 7 4 4 0 0 0 3 6 4 4 0 0 0 7 0V5h-4ZM20 5a4 4 0 0 1 4 4v1a4 4 0 0 1 2 7 4 4 0 0 1-3 6 4 4 0 0 1-7 0V5h4Z" />
    </svg>
  );
}

export function IconLock({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <rect x="6" y="14" width="20" height="14" rx="2" />
      <path d="M10 14V9a6 6 0 0 1 12 0v5" />
    </svg>
  );
}

export function IconEye({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M2 16s5-9 14-9 14 9 14 9-5 9-14 9S2 16 2 16Z" />
      <circle cx="16" cy="16" r="4" />
    </svg>
  );
}

export function IconMail({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <rect x="3" y="6" width="26" height="20" rx="2" />
      <path d="m3 8 13 10L29 8" />
    </svg>
  );
}

export function IconPhone({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M27 22v3a3 3 0 0 1-3.3 3A22 22 0 0 1 4 8.3 3 3 0 0 1 7 5h3a2 2 0 0 1 2 1.7 13 13 0 0 0 .7 3 2 2 0 0 1-.5 2.1L11 13a16 16 0 0 0 8 8l1.3-1.3a2 2 0 0 1 2-.5 13 13 0 0 0 3 .7A2 2 0 0 1 27 22Z" />
    </svg>
  );
}

export function IconDoc({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M8 3h11l7 7v19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M19 3v7h7M11 17h10M11 22h10M11 12h4" />
    </svg>
  );
}

export function IconSearch({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <circle cx="14" cy="14" r="9" />
      <path d="m21 21 7 7" />
    </svg>
  );
}

export function IconChart({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="M4 28V4M4 28h24" />
      <rect x="9" y="18" width="4" height="10" />
      <rect x="16" y="11" width="4" height="17" />
      <rect x="23" y="6" width="4" height="22" />
    </svg>
  );
}

export function IconHandshake({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <path d="m4 16 6-6 4 3 6-6 8 8-6 6-3-3-6 6-9-8Z" />
    </svg>
  );
}

export function IconCalendar({ className, size, strokeWidth }: IconProps) {
  return (
    <svg {...base(size, strokeWidth)} className={className}>
      <rect x="4" y="6" width="24" height="22" rx="2" />
      <path d="M4 12h24M10 3v6M22 3v6" />
    </svg>
  );
}
