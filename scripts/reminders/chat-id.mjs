// Finds your Telegram chat id. Put TELEGRAM_BOT_TOKEN in .env.local, send any message to your bot
// in Telegram, then run: node scripts/reminders/chat-id.mjs
import { existsSync } from "node:fs";
import { config } from "dotenv";

if (existsSync(".env.local")) config({ path: ".env.local", quiet: true });
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set (add it to .env.local)");
  process.exit(2);
}
const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const body = await res.json().catch(() => ({}));
if (!body.ok) {
  console.error(`Telegram: ${body.description ?? res.status}`);
  process.exit(1);
}
const chats = new Map();
for (const u of body.result) {
  const chat = (u.message ?? u.edited_message ?? u.channel_post)?.chat;
  if (chat) chats.set(chat.id, [chat.first_name, chat.last_name, chat.username && `@${chat.username}`, chat.title].filter(Boolean).join(" "));
}
if (!chats.size) console.log("No messages yet: open your bot in Telegram, press Start (or send any message), then run this again.");
for (const [id, who] of chats) console.log(`TELEGRAM_CHAT_ID=${id}   (${who})`);
