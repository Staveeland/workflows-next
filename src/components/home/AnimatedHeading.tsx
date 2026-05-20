"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { DEFAULT_EASE } from "./_shared";

interface Props {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export function AnimatedHeading({ text, className, as: Tag = "h2" }: Props) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-30% 0px -30% 0px" });
  return (
    <Tag ref={ref} className={className}>
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: DEFAULT_EASE }}
        style={{ display: "inline-block" }}
      >
        {text}
      </motion.span>
    </Tag>
  );
}
