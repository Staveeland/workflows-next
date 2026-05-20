// Shared animation constants for home sections.
// Sprint 2.2: animation-budsjett — reduced whileInView from 25+ to ~8-10
// anchor elements (section heads + major CTAs).

export const DEFAULT_EASE = [0.16, 1, 0.3, 1] as const;

export const SCROLL_VIEWPORT = { once: true, margin: "-20% 0px -20% 0px" } as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: DEFAULT_EASE },
  }),
};

export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
