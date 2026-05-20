"use client";

import Image from "next/image";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";

// Static section — animations removed (Sprint 2.2 budget reduction).
// Trust logos appear immediately on scroll without extra motion noise.
export function LogoStrip() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <section className="logo-strip">
      <div className="wrap">
        <p className="logo-strip__label">{t.logoStrip.label}</p>
        <div className="logo-strip__row">
          <div className="logo-strip__item">
            <Image src="/kunder-csub.svg" alt="CSUB" width={120} height={40} style={{ width: "auto", height: "32px" }} />
          </div>
          <div className="logo-strip__item">
            <Image src="/kunder-saga.png" alt="Saga Subsea" width={120} height={40} style={{ width: "auto", height: "32px" }} />
          </div>
          <div className="logo-strip__item">
            <Image src="/kunder-elementlab.png" alt="ElementLab" width={120} height={40} style={{ width: "auto", height: "32px" }} />
          </div>
          <div className="logo-strip__item">
            <Image src="/kunder-port.webp" alt="Port 5561" width={120} height={40} style={{ width: "auto", height: "32px" }} />
          </div>
          <div className="logo-strip__item">
            <Image src="/kunder-nyholmen.png" alt="Nyholmen" width={120} height={40} style={{ width: "auto", height: "56px" }} />
          </div>
          <div className="logo-strip__item">
            <Image src="/kunder-festiviteten.png" alt="Festiviteten Haugesund" width={120} height={40} style={{ width: "auto", height: "40px" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
