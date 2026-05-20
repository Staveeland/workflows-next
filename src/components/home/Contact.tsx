"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";
import { fadeUp, stagger, SCROLL_VIEWPORT } from "./_shared";

export function Contact() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <section className="section" id="kontakt">
      <div className="wrap">
        <motion.div
          className="contact"
          initial="hidden"
          whileInView="visible"
          viewport={SCROLL_VIEWPORT}
          variants={stagger}
        >
          <motion.div className="contact__left" variants={fadeUp}>
            <span className="tag">{t.contact.tag}</span>
            <h2>{t.contact.heading}</h2>
            <p>{t.contact.body}</p>
          </motion.div>
          <motion.div className="contact__right" variants={fadeUp} custom={1}>
            <a href="mailto:petter@workflows.no" className="contact__card">
              <div className="contact__person">
                <div className="contact__avatar">PS</div>
                <div>
                  <strong>Petter Staveland</strong>
                  <span>{t.contact.role}</span>
                </div>
              </div>
              <div className="contact__email-row">
                <span className="contact__email-label">petter@workflows.no</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </div>
            </a>
            <a href="tel:+4793077915" className="contact__card contact__card--phone">
              <div className="contact__email-row">
                <span className="contact__email-label">+47 930 77 915</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
