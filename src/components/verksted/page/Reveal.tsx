"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion, type MotionProps } from "framer-motion";

// Hydration probe: false on the server/hydration pass, true after mount.
const noopSubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Scroll-reveal wrapper implementing the verksted poster law: SSR / no-JS /
 * reduced motion render the composed state; the hidden initial state exists
 * only after mount with motion allowed (keyed remount applies it).
 */
export function Reveal({
  children,
  as = "div",
  className,
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode;
  as?: "div" | "section" | "li" | "p" | "span" | "h2" | "h3";
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduced = useReducedMotion() === true;
  const mounted = useMounted();
  const anim = mounted && !reduced;

  const props: MotionProps = anim
    ? {
        initial: { opacity: 0, y },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.25 },
        transition: { duration: 0.6, ease: EASE, delay },
      }
    : { initial: false };

  const Tag = motion[as];
  return (
    <Tag key={`reveal-${anim}`} className={className} {...props}>
      {children}
    </Tag>
  );
}
