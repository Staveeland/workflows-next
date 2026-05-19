"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";

export default function Footer() {
  const { lang } = useLang();
  const t = translations[lang].footer;

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__top">
          <div className="footer__brand">
            <Image src="/logo-dark.png" alt="Workflows" width={120} height={34} style={{ width: "auto", height: "22px", opacity: 0.4 }} />
            <p>{t.brand}</p>
          </div>
          <div className="footer__col">
            <h4>{t.company}</h4>
            <Link href="/#tjenester">{t.links.services}</Link>
            <Link href="/#prosess">{t.links.process}</Link>
            <Link href="/#om">{t.links.about}</Link>
            <Link href="/#kontakt">{t.links.contact}</Link>
          </div>
          <div className="footer__col">
            <h4>{t.services}</h4>
            <Link href="/ai-haugesund">{t.links.aiHaugesund}</Link>
            <Link href="/ai-agenter">{t.links.aiAgents}</Link>
            <Link href="/chatboter">{t.links.chatbots}</Link>
            <Link href="/automatiserte-flyter">{t.links.automatedFlows}</Link>
          </div>
          <div className="footer__col">
            <h4>{t.resources}</h4>
            <Link href="/kunder">{t.links.cases}</Link>
            <Link href="/#faq">{t.links.faq}</Link>
            <Link href="/mystyler">{t.links.mystyler}</Link>
          </div>
          <div className="footer__col">
            <h4>{t.clients}</h4>
            <Link href="/kunder/csub">CSUB</Link>
            <Link href="/kunder/festiviteten">Festiviteten</Link>
            <Link href="/kunder/elementlab">ElementLab</Link>
          </div>
        </div>
        <div className="footer__bottom">
          <span>&copy; {new Date().getFullYear()} Workflows AS</span>
          <span>{t.based}</span>
        </div>
      </div>
    </footer>
  );
}
