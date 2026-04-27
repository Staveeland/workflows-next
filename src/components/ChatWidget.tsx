"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Msg = { role: "user" | "assistant"; text: string };

function ChatMessage({ role, text }: Msg) {
  const html = useMemo(() => renderMessage(text), [text]);
  return (
    <motion.div
      className={`chat-msg chat-msg--${role}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderInline(s: string) {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\*)([^\*\n]+?)\*(?!\*)/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

function renderMessage(text: string) {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let listBuffer: string[] = [];
  const flushList = () => {
    if (listBuffer.length) {
      blocks.push(`<ul>${listBuffer.map((li) => `<li>${renderInline(li)}</li>`).join("")}</ul>`);
      listBuffer = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const m = line.match(/^\s*[-•]\s+(.*)$/);
    if (m) listBuffer.push(m[1]);
    else {
      flushList();
      if (line === "") blocks.push("<br />");
      else blocks.push(`<p>${renderInline(line)}</p>`);
    }
  }
  flushList();
  return blocks.join("");
}

const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_CHAT_WEBHOOK_URL ||
  "https://workflowsas.app.n8n.cloud/webhook/workflows-chat";

const WELCOME: Msg = {
  role: "assistant",
  text:
    "Hei! Jeg er Workflows sin AI-assistent. Spør meg om AI-agenter, automatisering eller hva vi har bygget for andre — eller be om å bli kontaktet av Petter, så ordner jeg det.",
};

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
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(false);
  const sessionIdRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(false);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: sessionIdRef.current,
        }),
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

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating launcher */}
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

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="AI-chat med Workflows"
          >
            <header className="chat-panel__head">
              <div className="chat-panel__head-info">
                <div className="chat-panel__avatar">
                  <span className="chat-panel__pulse" />W
                </div>
                <div>
                  <strong>Workflows AI</strong>
                  <span>Svarer vanligvis på sekunder</span>
                </div>
              </div>
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
            </div>

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
                placeholder="Skriv en melding…"
                rows={1}
                disabled={busy}
              />
              <button
                type="submit"
                aria-label="Send melding"
                disabled={busy || !input.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
            <p className="chat-panel__foot">Drevet av AI</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
