type SendArgs = {
  text: string;
  replyToMessageId?: number;
};

/**
 * Send a plain-text message to Petter on Telegram.
 *
 * We deliberately do NOT use Markdown / MarkdownV2 parse modes — the
 * home-rolled escape was incomplete and the cost of getting it wrong
 * (broken messages, or worse, injected formatting from user-controlled
 * fields) outweighed the benefit of a few bold words.
 */
export async function sendTelegramToPetter({
  text,
  replyToMessageId,
}: SendArgs): Promise<{ messageId: number | null; ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_PETTER_CHAT_ID;
  if (!token || !chatId) {
    return { messageId: null, ok: false, error: "Missing Telegram env" };
  }
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  };
  if (replyToMessageId) body.reply_to_message_id = replyToMessageId;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) {
      return { messageId: null, ok: false, error: data.description || "Telegram error" };
    }
    return { messageId: data.result?.message_id ?? null, ok: true };
  } catch (e) {
    return {
      messageId: null,
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
