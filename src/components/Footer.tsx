import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__top">
          <div className="footer__brand">
            <Image src="/logo-dark.png" alt="Workflows" width={120} height={34} style={{ width: "auto", height: "22px", opacity: 0.4 }} />
            <p>Skreddersydd software, digitale assistenter og automatiserte systemer for norske bedrifter.</p>
          </div>
          <div className="footer__col">
            <h4>Selskap</h4>
            <Link href="/#tjenester">Tjenester</Link>
            <Link href="/#prosess">Prosess</Link>
            <Link href="/#om">Om oss</Link>
            <Link href="/#kontakt">Kontakt</Link>
          </div>
          <div className="footer__col">
            <h4>Ressurser</h4>
            <Link href="/kunder">Kundecaser</Link>
            <Link href="/#faq">Ofte stilte spørsmål</Link>
          </div>
          <div className="footer__col">
            <h4>Kunder</h4>
            <Link href="/kunder/csub">CSUB</Link>
            <Link href="/kunder/saga-subsea">Saga Subsea</Link>
            <Link href="/kunder/elementlab">ElementLab</Link>
          </div>
        </div>
        <div className="footer__bottom">
          <span>&copy; {new Date().getFullYear()} Workflows AS</span>
          <span>Basert på Haugalandet, Norge</span>
        </div>
      </div>
    </footer>
  );
}
