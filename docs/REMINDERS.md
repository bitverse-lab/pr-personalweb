# Morning reminders (Telegram)

`.github/workflows/reminders.yml` sends one Telegram message every morning at about 05:55 Jakarta
time: interviews and calendar events today, tasks due today, and overdue tasks (oldest first,
the first eight). A clear day gets a one-line "nothing due".

## Setup (once)

1. In Telegram, open **@BotFather**, send `/newbot`, pick a name and a username. It replies with a
   token like `123456:ABC…`.
2. Add it to `.env.local`: `TELEGRAM_BOT_TOKEN=123456:ABC…`
3. Open your new bot in Telegram and press **Start** (or send it any message).
4. `node scripts/reminders/chat-id.mjs` prints `TELEGRAM_CHAT_ID=…`. Add that line to `.env.local`.
5. Try it: `node scripts/reminders/digest.mjs --dry-run` prints the message;
   `node scripts/reminders/digest.mjs` sends it.
6. Repository secrets (the database URL is the backup one, already set):

   ```bash
   for k in TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID; do grep "^$k=" .env.local | cut -d= -f2- | tr -d '\r\n' | gh secret set "$k"; done
   grep "^OWNER_EMAIL=" .env.local | cut -d= -f2- | tr -d '\r\n' | gh secret set REMINDER_OWNER_EMAIL
   ```

7. The workflow must be on `main`. Then **Actions → Reminders → Run workflow** once to check.

The bot only ever sends to your chat id; it never reads messages. To stop the reminders, disable
the workflow in the Actions tab.
