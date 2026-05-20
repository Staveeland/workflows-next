"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";
import { fadeUp, stagger, SCROLL_VIEWPORT } from "./_shared";
import { AnimatedHeading } from "./AnimatedHeading";

export function Customers() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <section className="section" id="kunder">
      <div className="wrap">
        <motion.div
          className="section__head"
          initial="hidden"
          whileInView="visible"
          viewport={SCROLL_VIEWPORT}
          variants={stagger}
        >
          <motion.span className="tag" variants={fadeUp}>
            {t.clientsSection.tag}
          </motion.span>
          <AnimatedHeading text={t.clientsSection.heading} />
          <motion.p className="section__sub" variants={fadeUp} custom={3}>
            {t.clientsSection.sub}
          </motion.p>
        </motion.div>

        <div className="clients-grid">
          {t.clientsSection.clients.map((c) => (
            <Link key={c.slug} href={`/kunder/${c.slug}`} className="client-card">
              <div className="client-card__logo">
                <Image
                  src={c.logo}
                  alt={c.name}
                  width={180}
                  height={60}
                  style={{ width: "auto", height: "40px", objectFit: "contain" }}
                />
              </div>
              <h3>{c.name}</h3>
              <p>{c.desc}</p>
              <span className="client-card__link">{t.clientsSection.readMore} &rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
