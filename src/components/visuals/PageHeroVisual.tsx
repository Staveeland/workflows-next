/**
 * Decorative hero visual for landing pages.
 * Pure SVG — light, no animation cost, scales fluidly.
 */
type Variant = "chatbot" | "flow" | "agent" | "ai" | "software" | "haugesund" | "faq";

export default function PageHeroVisual({ variant }: { variant: Variant }) {
  return (
    <div className="page-hero__visual" aria-hidden>
      <svg viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="phvGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e29e33" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#e29e33" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#e29e33" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="phvLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e29e33" stopOpacity="0" />
            <stop offset="50%" stopColor="#e29e33" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#e29e33" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Soft amber glow background */}
        <circle cx="160" cy="120" r="120" fill="url(#phvGlow)" />

        {variant === "chatbot" && <ChatbotVisual />}
        {variant === "flow" && <FlowVisual />}
        {variant === "agent" && <AgentVisual />}
        {variant === "ai" && <AiVisual />}
        {variant === "software" && <SoftwareVisual />}
        {variant === "haugesund" && <HaugesundVisual />}
        {variant === "faq" && <FaqVisual />}
      </svg>
    </div>
  );
}

/* ─── Variants ─── */

function ChatbotVisual() {
  return (
    <g stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <rect x="60" y="40" width="160" height="100" rx="14" fill="#fff" />
      {/* Bot bubble */}
      <rect x="78" y="60" width="90" height="20" rx="10" fill="#fdf6e7" stroke="#e29e33" />
      <circle cx="86" cy="70" r="2" fill="#e29e33" stroke="none" />
      <circle cx="94" cy="70" r="2" fill="#e29e33" stroke="none" />
      <circle cx="102" cy="70" r="2" fill="#e29e33" stroke="none" />
      {/* User bubble */}
      <rect x="120" y="92" width="80" height="20" rx="10" fill="#1a1a1a" />
      <path d="M132 102h56" stroke="#fff" strokeWidth="2" />
      {/* Input */}
      <rect x="80" y="155" width="160" height="36" rx="18" fill="#fff" stroke="#e4e0d9" />
      <circle cx="225" cy="173" r="12" fill="#e29e33" stroke="none" />
      <path d="m221 173 4 4 6-8" stroke="#fff" strokeWidth="2" />
      <path d="M95 173h100" stroke="#9a9a9a" strokeWidth="1" strokeDasharray="2 3" />
    </g>
  );
}

function FlowVisual() {
  return (
    <g stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <rect x="30" y="100" width="60" height="40" rx="8" fill="#fff" />
      <text x="60" y="125" textAnchor="middle" fill="#1a1a1a" fontSize="11" fontWeight="600" fontFamily="Inter,sans-serif">Trigger</text>

      <rect x="130" y="60" width="60" height="40" rx="8" fill="#fff" />
      <text x="160" y="85" textAnchor="middle" fill="#1a1a1a" fontSize="11" fontWeight="600" fontFamily="Inter,sans-serif">AI</text>

      <rect x="130" y="140" width="60" height="40" rx="8" fill="#fdf6e7" stroke="#e29e33" />
      <text x="160" y="165" textAnchor="middle" fill="#1a1a1a" fontSize="11" fontWeight="600" fontFamily="Inter,sans-serif">Logikk</text>

      <rect x="230" y="100" width="60" height="40" rx="8" fill="#1a1a1a" />
      <text x="260" y="125" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600" fontFamily="Inter,sans-serif">Ferdig</text>

      <path d="M90 120 q20 0 40-30" stroke="#e29e33" />
      <path d="M90 120 q20 0 40 30" stroke="#e29e33" />
      <path d="M190 80 q20 0 40 30" stroke="#e29e33" />
      <path d="M190 160 q20 0 40-30" stroke="#e29e33" />

      <circle cx="125" cy="100" r="2.5" fill="#e29e33" stroke="none" />
      <circle cx="125" cy="140" r="2.5" fill="#e29e33" stroke="none" />
      <circle cx="195" cy="100" r="2.5" fill="#e29e33" stroke="none" />
      <circle cx="195" cy="140" r="2.5" fill="#e29e33" stroke="none" />
    </g>
  );
}

function AgentVisual() {
  return (
    <g stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <circle cx="160" cy="120" r="40" fill="#fdf6e7" stroke="#e29e33" />
      <text x="160" y="118" textAnchor="middle" fill="#1a1a1a" fontSize="14" fontWeight="700" fontFamily="Inter,sans-serif">Agent</text>
      <text x="160" y="134" textAnchor="middle" fill="#9a9a9a" fontSize="9" fontWeight="500" fontFamily="Inter,sans-serif">planlegger</text>

      {/* Orbiting tools */}
      <circle cx="70" cy="80" r="18" fill="#fff" />
      <text x="70" y="84" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1a1a1a" fontFamily="Inter,sans-serif">Mail</text>

      <circle cx="250" cy="80" r="18" fill="#fff" />
      <text x="250" y="84" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1a1a1a" fontFamily="Inter,sans-serif">DB</text>

      <circle cx="60" cy="170" r="18" fill="#fff" />
      <text x="60" y="174" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1a1a1a" fontFamily="Inter,sans-serif">API</text>

      <circle cx="260" cy="180" r="18" fill="#fff" />
      <text x="260" y="184" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1a1a1a" fontFamily="Inter,sans-serif">Doc</text>

      <line x1="88" y1="80" x2="125" y2="105" stroke="#e29e33" strokeDasharray="3 3" />
      <line x1="232" y1="80" x2="195" y2="105" stroke="#e29e33" strokeDasharray="3 3" />
      <line x1="78" y1="170" x2="130" y2="140" stroke="#e29e33" strokeDasharray="3 3" />
      <line x1="242" y1="180" x2="195" y2="145" stroke="#e29e33" strokeDasharray="3 3" />
    </g>
  );
}

function AiVisual() {
  return (
    <g stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Brain-like neural shape */}
      <circle cx="100" cy="80" r="8" fill="#fdf6e7" stroke="#e29e33" />
      <circle cx="100" cy="160" r="8" fill="#fdf6e7" stroke="#e29e33" />
      <circle cx="160" cy="60" r="8" fill="#1a1a1a" />
      <circle cx="160" cy="120" r="14" fill="#e29e33" stroke="none" />
      <circle cx="160" cy="180" r="8" fill="#1a1a1a" />
      <circle cx="220" cy="80" r="8" fill="#fdf6e7" stroke="#e29e33" />
      <circle cx="220" cy="160" r="8" fill="#fdf6e7" stroke="#e29e33" />

      <line x1="108" y1="80" x2="152" y2="60" />
      <line x1="108" y1="80" x2="148" y2="116" />
      <line x1="108" y1="160" x2="148" y2="124" />
      <line x1="108" y1="160" x2="152" y2="180" />
      <line x1="168" y1="60" x2="212" y2="80" />
      <line x1="172" y1="116" x2="212" y2="80" />
      <line x1="172" y1="124" x2="212" y2="160" />
      <line x1="168" y1="180" x2="212" y2="160" />

      <text x="160" y="125" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">AI</text>
    </g>
  );
}

function SoftwareVisual() {
  return (
    <g stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Browser window */}
      <rect x="60" y="50" width="200" height="140" rx="10" fill="#fff" />
      <line x1="60" y1="72" x2="260" y2="72" />
      <circle cx="74" cy="61" r="3" fill="#ffbd2e" stroke="none" />
      <circle cx="86" cy="61" r="3" fill="#27c93f" stroke="none" />
      <circle cx="98" cy="61" r="3" fill="#ff5f56" stroke="none" />

      {/* Sidebar */}
      <rect x="60" y="72" width="50" height="118" fill="#faf8f5" />
      <rect x="68" y="88" width="34" height="6" rx="2" fill="#e4e0d9" stroke="none" />
      <rect x="68" y="102" width="34" height="6" rx="2" fill="#e4e0d9" stroke="none" />
      <rect x="68" y="116" width="34" height="6" rx="2" fill="#e29e33" stroke="none" />
      <rect x="68" y="130" width="34" height="6" rx="2" fill="#e4e0d9" stroke="none" />

      {/* Chart area */}
      <rect x="122" y="86" width="60" height="40" rx="4" fill="#fdf6e7" stroke="#e29e33" />
      <rect x="190" y="86" width="60" height="40" rx="4" fill="#1a1a1a" stroke="none" />
      <path d="M198 116l6-10 6 6 6-12 6 4 6-10 6 6 6-4 6 8" stroke="#e29e33" />

      <rect x="122" y="136" width="128" height="44" rx="4" fill="#faf8f5" />
      <line x1="130" y1="150" x2="240" y2="150" stroke="#e4e0d9" />
      <line x1="130" y1="160" x2="220" y2="160" stroke="#e4e0d9" />
      <line x1="130" y1="170" x2="200" y2="170" stroke="#e4e0d9" />
    </g>
  );
}

function HaugesundVisual() {
  return (
    <g stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Map pin centered */}
      <path d="M160 60c-22 0-40 18-40 40 0 30 40 70 40 70s40-40 40-70c0-22-18-40-40-40Z" fill="#1a1a1a" />
      <circle cx="160" cy="100" r="14" fill="#e29e33" stroke="none" />
      <text x="160" y="106" textAnchor="middle" fill="#1a1a1a" fontSize="14" fontWeight="800" fontFamily="Inter,sans-serif">W</text>

      {/* Dotted reach */}
      <circle cx="160" cy="160" rx="80" ry="20" stroke="#e29e33" strokeDasharray="3 4" fill="none" r="80" opacity="0.35" />
      <ellipse cx="160" cy="190" rx="100" ry="14" stroke="#e29e33" strokeDasharray="3 4" fill="none" opacity="0.25" />
    </g>
  );
}

function FaqVisual() {
  return (
    <g stroke="#1a1a1a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <circle cx="160" cy="120" r="60" fill="#fdf6e7" stroke="#e29e33" />
      <text x="160" y="138" textAnchor="middle" fill="#1a1a1a" fontSize="64" fontWeight="800" fontFamily="Lora,serif">?</text>
      <circle cx="80" cy="60" r="14" fill="#fff" />
      <text x="80" y="65" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1a1a1a" fontFamily="Lora,serif">?</text>
      <circle cx="240" cy="70" r="10" fill="#1a1a1a" />
      <text x="240" y="74" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="Lora,serif">?</text>
      <circle cx="70" cy="180" r="10" fill="#1a1a1a" />
      <text x="70" y="184" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="Lora,serif">?</text>
      <circle cx="250" cy="180" r="14" fill="#fff" />
      <text x="250" y="185" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1a1a1a" fontFamily="Lora,serif">?</text>
    </g>
  );
}
