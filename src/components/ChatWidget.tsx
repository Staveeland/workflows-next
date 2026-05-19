"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// Strict sanitization schema: only the inline + block elements we actually
// want to render in chat bubbles. Links are forced to http(s) only and open
// in a new tab with rel="noopener noreferrer".
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    "p",
    "br",
    "strong",
    "em",
    "ul",
    "ol",
    "li",
    "a",
    "code",
    "pre",
    "blockquote",
  ],
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ["href", /^https?:\/\//i],
      ["title"],
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https"],
  },
};

type Role = "user" | "assistant" | "petter";
type Msg = { role: Role; text: string; createdAt?: string };
type Mode = "ai" | "form" | "direct";

const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_CHAT_WEBHOOK_URL ||
  "https://workflowsas.app.n8n.cloud/webhook/workflows-chat";

const POLL_INTERVAL_MS = 4000;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WELCOME: Msg = {
  role: "assistant",
  text:
    "Hei! 😊 Jeg er Workflows sin AI-assistent. Spør meg om AI-agenter, automatisering eller hva vi har bygget for andre — eller trykk «Snakk med Petter» nedenfor for direkte samtale.",
};

function ChatMessage({ role, text }: { role: Role; text: string }) {
  return (
    <motion.div
      className={`chat-msg chat-msg--${role}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={{
          a: ({ href, children, ...props }) => (
            <a
              {...props}
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </motion.div>
  );
}

function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("wf_chat_session");
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("wf_chat_session", id);
  }
  return id;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("ai");
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);

  const sessionIdRef = useRef<string>("");
  const lastPollRef = useRef<string>(new Date(0).toISOString());
  const justOpenedRef = useRef(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Init: session id + restore identity if present
  useEffect(() => {
    sessionIdRef.current = getSessionId();
    const savedEmail = localStorage.getItem("wf_chat_email");
    const savedName = localStorage.getItem("wf_chat_name") || "";
    if (savedEmail && EMAIL_RX.test(savedEmail)) {
      setEmail(savedEmail);
      setName(savedName);
      setMode("direct");
      void loadHistory(savedEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(false);
      justOpenedRef.current = true;
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [open, mode]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const jump = justOpenedRef.current;
    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: jump ? "auto" : "smooth",
      });
    });
    justOpenedRef.current = false;
  }, [msgs, busy, mode, open]);

  const loadHistory = useCallback(async (e: string) => {
    try {
      const res = await fetch(`/api/chat/history?email=${encodeURIComponent(e)}`);
      const data = await res.json();
      if (Array.isArray(data.messages) && data.messages.length) {
        const restored: Msg[] = data.messages
          .filter((m: { role: Role }) =>
            m.role === "user" || m.role === "assistant" || m.role === "petter"
          )
          .map((m: { role: Role; text: string; created_at: string }) => ({
            role: m.role,
            text: m.text,
            createdAt: m.created_at,
          }));
        setMsgs([
          {
            role: "assistant",
            text:
              "Velkommen tilbake! 👋 Du er fortsatt koblet direkte til Petter. Skriv her, så får han det med en gang.",
          },
          ...restored,
        ]);
        const lastPetter = [...data.messages]
          .reverse()
          .find((m: { role: Role; created_at: string }) => m.role === "petter");
        if (lastPetter) lastPollRef.current = lastPetter.created_at;
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Polling for Petter's replies in direct mode
  useEffect(() => {
    if (mode !== "direct" || !email) return;
    let stopped = false;
    const tick = async () => {
      try {
        const res = await fetch(
          `/api/chat/poll?email=${encodeURIComponent(email)}&since=${encodeURIComponent(
            lastPollRef.current
          )}`
        );
        const data = await res.json();
        if (Array.isArray(data.messages) && data.messages.length) {
          const newMsgs: Msg[] = data.messages.map(
            (m: { role: Role; text: string; created_at: string }) => ({
              role: m.role,
              text: m.text,
              createdAt: m.created_at,
            })
          );
          setMsgs((prev) => [...prev, ...newMsgs]);
          lastPollRef.current = data.messages[data.messages.length - 1].created_at;
          if (!open) setUnread(true);
        }
      } catch {
        /* swallow */
      }
    };
    void tick();
    const id = window.setInterval(() => {
      if (!stopped) void tick();
    }, POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [mode, email, open]);

  async function sendAi(text: string) {
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: sessionIdRef.current }),
      });
      const data = await res.json().catch(() => ({}));
      const reply: string =
        data.reply ||
        data.output ||
        data.message ||
        "Beklager, jeg fikk ikke svar nå. Prøv igjen, eller send en e-post til petter@workflows.no.";
      setMsgs((m) => [...m, { role: "assistant", text: reply }]);
      if (!open) setUnread(true);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "Jeg fikk ikke kontakt med serveren. Prøv igjen om litt — eller send en e-post til petter@workflows.no.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function sendDirect(text: string) {
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Kunne ikke sende");
      }
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "Klarte ikke å sende meldingen akkurat nå. Prøv igjen om litt.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    if (mode === "ai") await sendAi(text);
    else if (mode === "direct") await sendDirect(text);
  }

  async function submitHandover(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    if (!cleanName) return setFormError("Hva heter du?");
    if (!EMAIL_RX.test(cleanEmail)) return setFormError("Skriv en gyldig e-post.");
    setFormBusy(true);
    try {
      const history = msgs
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", text: m.text }));
      const res = await fetch("/api/chat/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          name: cleanName,
          history,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Kunne ikke koble deg til Petter.");
      }
      localStorage.setItem("wf_chat_email", cleanEmail);
      localStorage.setItem("wf_chat_name", cleanName);
      setEmail(cleanEmail);
      setName(cleanName);
      setMode("direct");
      lastPollRef.current = new Date().toISOString();
      setMsgs((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Perfekt, ${cleanName}! 🙌 Petter er varslet og svarer her så fort han kan. Du kan skrive videre — han ser alt med en gang.`,
        },
      ]);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Noe gikk galt. Prøv igjen."
      );
    } finally {
      setFormBusy(false);
    }
  }

  function switchToAi() {
    setMode("ai");
    setMsgs([WELCOME]);
  }

  async function switchToDirect() {
    if (!email || !EMAIL_RX.test(email)) {
      setMode("form");
      return;
    }
    setMode("direct");
    setMsgs([
      {
        role: "assistant",
        text: name
          ? `Velkommen tilbake, ${name}! 👋 Skriv her, så får Petter beskjed med en gang.`
          : "Velkommen tilbake! 👋 Skriv her, så får Petter beskjed med en gang.",
      },
    ]);
    lastPollRef.current = new Date(0).toISOString();
    await loadHistory(email);
  }

  function forgetMe() {
    localStorage.removeItem("wf_chat_email");
    localStorage.removeItem("wf_chat_name");
    setEmail("");
    setName("");
    setMode("ai");
    setMsgs([WELCOME]);
    lastPollRef.current = new Date(0).toISOString();
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      <motion.button
        className="chat-launcher"
        aria-label={open ? "Lukk chat" : "Åpne chat"}
        onClick={() => setOpen((v) => !v)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.svg
              key="x"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </motion.svg>
          )}
        </AnimatePresence>
        {unread && !open && <span className="chat-launcher__dot" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="Chat med Workflows"
          >
            <header className="chat-panel__head">
              <div className="chat-panel__head-info">
                <div className="chat-panel__avatar">
                  <span
                    className={`chat-panel__pulse${
                      mode === "direct" ? " chat-panel__pulse--live" : ""
                    }`}
                  />
                  {mode === "direct" ? "P" : "W"}
                </div>
                <div>
                  <strong>
                    {mode === "direct" ? "Direkte med Petter" : "Workflows AI"}
                  </strong>
                  <span>
                    {mode === "direct"
                      ? "Du chatter direkte med oss"
                      : "Svarer vanligvis på sekunder"}
                  </span>
                </div>
              </div>
              {mode === "direct" && (
                <button
                  className="chat-panel__end"
                  onClick={switchToAi}
                  title="Bytt til AI-assistent"
                  type="button"
                >
                  ← AI-assistent
                </button>
              )}
              {mode === "ai" && email && (
                <button
                  className="chat-panel__end"
                  onClick={switchToDirect}
                  title="Tilbake til samtalen med Petter"
                  type="button"
                >
                  Til Petter →
                </button>
              )}
            </header>

            <div className="chat-panel__scroll" ref={scrollRef}>
              {msgs.map((m, i) => (
                <ChatMessage key={i} role={m.role} text={m.text} />
              ))}
              {busy && (
                <motion.div
                  className="chat-msg chat-msg--assistant chat-msg--typing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span /> <span /> <span />
                </motion.div>
              )}

              {mode === "form" && (
                <motion.form
                  className="chat-handover"
                  onSubmit={submitHandover}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="chat-handover__lead">
                    Skriv inn navn og e-post, så kobler jeg deg direkte til Petter. ✉️
                  </p>
                  <input
                    type="text"
                    placeholder="Navn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    disabled={formBusy}
                  />
                  <input
                    type="email"
                    placeholder="E-post"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={formBusy}
                  />
                  {formError && <p className="chat-handover__err">{formError}</p>}
                  <div className="chat-handover__row">
                    <button
                      type="button"
                      className="chat-handover__cancel"
                      onClick={() => {
                        setMode("ai");
                        setFormError(null);
                      }}
                      disabled={formBusy}
                    >
                      Avbryt
                    </button>
                    <button
                      type="submit"
                      className="chat-handover__submit"
                      disabled={formBusy}
                    >
                      {formBusy ? "Kobler…" : "Start direkte chat"}
                    </button>
                  </div>
                </motion.form>
              )}
            </div>

            {mode !== "form" && (
              <form
                className="chat-panel__form"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  placeholder={
                    mode === "direct"
                      ? "Skriv til Petter…"
                      : "Skriv en melding…"
                  }
                  rows={1}
                  disabled={busy}
                />
                <button
                  type="submit"
                  aria-label="Send melding"
                  disabled={busy || !input.trim()}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            )}

            {mode === "ai" && !email && (
              <button
                type="button"
                className="chat-panel__handover"
                onClick={() => setMode("form")}
              >
                <span className="chat-panel__handover-avatar">P</span>
                <span className="chat-panel__handover-text">
                  <strong>Skriv direkte til Petter</strong>
                  <span>Få svar fra et menneske</span>
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            )}
            {mode === "direct" && (
              <div className="chat-panel__status">
                <span className="chat-panel__status-dot" />
                Petter er varslet og svarer så fort han kan
              </div>
            )}
            <p className="chat-panel__foot">
              {mode === "direct" ? (
                <>
                  Lukk gjerne vinduet — samtalen fortsetter neste gang.
                  {" · "}
                  <button
                    type="button"
                    className="chat-panel__forget"
                    onClick={forgetMe}
                    title="Slett lokal info og start på nytt"
                  >
                    Glem meg
                  </button>
                </>
              ) : (
                "Drevet av AI"
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
