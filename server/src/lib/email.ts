import { Resend } from "resend";
import { env } from "../env.js";

// Singleton Resend client. Null when RESEND_API_KEY is unset so the server
// still boots in dev without a mail provider. Callers must handle the null
// case — treat "no API key" as "don't send the mail", not as an error.
let client: Resend | null = null;

function getResend(): Resend | null {
  if (client) return client;
  if (!env.RESEND_API_KEY) return null;
  client = new Resend(env.RESEND_API_KEY);
  return client;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  // Plain text body. The brutalist design language calls for plaintext
  // emails rather than HTML — keeping the wire format simple also sidesteps
  // spam-filter heuristics that flag low-volume HTML senders.
  text: string;
}

export type SendEmailResult =
  | { sent: true; id: string }
  | { sent: false; reason: "not_configured" | "send_failed"; error?: string };

/**
 * Send one transactional email via Resend. In dev without a key this is a
 * no-op that returns `{ sent: false, reason: "not_configured" }` — callers
 * log the context (e.g. the reset link) so local testing still works.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) return { sent: false, reason: "not_configured" };
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    if (error) {
      return { sent: false, reason: "send_failed", error: error.message };
    }
    return { sent: true, id: data?.id ?? "" };
  } catch (err) {
    return {
      sent: false,
      reason: "send_failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
