// Optional email notification for new contact messages, through Resend's HTTP API (no SDK needed).
// Without RESEND_API_KEY nothing is sent: messages still arrive in the /me inbox.
import { reportError } from "@/lib/report-error";

export interface ContactEmail {
  name: string;
  email: string;
  subject: string | null;
  message: string;
}

export const isEmailConfigured = () => !!process.env.RESEND_API_KEY && !!(process.env.CONTACT_TO || process.env.OWNER_EMAIL);

const LINE_BREAKS = new RegExp(`[${[10, 13, 0x2028, 0x2029].map((c) => String.fromCharCode(c)).join("")}]+`, "g");

const oneLine = (s: string) => s.replace(LINE_BREAKS, " ").trim();

/** Never throws: a failed email must not lose or block the message, which is already saved. */
export async function sendContactNotification(msg: ContactEmail): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || "Personal OS <onboarding@resend.dev>",
        to: [process.env.CONTACT_TO || process.env.OWNER_EMAIL],
        reply_to: msg.email,
        subject: oneLine(`New message from ${msg.name}${msg.subject ? `: ${msg.subject}` : ""}`).slice(0, 200),
        text: `From: ${oneLine(msg.name)} <${msg.email}>\n${msg.subject ? `Subject: ${oneLine(msg.subject)}\n` : ""}\n${msg.message}\n\n— Sent from your website's contact form. You can also read and reply in your /me inbox.`,
      }),
    });
    if (!res.ok) console.error(`[email] Resend responded with status ${res.status}`);
    return res.ok;
  } catch (e) {
    reportError("contact-email", e);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
