import Link from "next/link";
import InboxList from "@/components/me/inbox/InboxList";
import MePageHeader from "@/components/me/MePageHeader";
import { getInbox } from "@/features/contact/actions";
import { isEmailConfigured } from "@/server/email/send";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const unreadOnly = filter === "unread";
  const [messages, all] = await Promise.all([getInbox(unreadOnly), unreadOnly ? getInbox(false) : Promise.resolve(null)]);
  const unread = (all ?? messages).filter((m) => !m.readAt).length;

  return (
    <div className="container-fluid py-4 px-4">
      <MePageHeader title="Inbox" description="Messages from your public contact form. Only you can read them." />

      {!isEmailConfigured() && (
        <div className="alert alert-info small">
          Email notifications are off, so check here for new messages. To also get an email for each one, add <code>RESEND_API_KEY</code> (and optionally <code>CONTACT_TO</code>) to <code>.env.local</code> — see the README.
        </div>
      )}

      <div className="card rounded shadow-sm">
        <div className="card-body">
          <div className="btn-group btn-group-sm mb-3" role="group" aria-label="Filter messages">
            <Link href="/me/inbox" className={`btn ${!unreadOnly ? "btn-primary" : "btn-outline-primary"}`} aria-current={!unreadOnly ? "true" : undefined}>All</Link>
            <Link href="/me/inbox?filter=unread" className={`btn ${unreadOnly ? "btn-primary" : "btn-outline-primary"}`} aria-current={unreadOnly ? "true" : undefined}>
              Unread <span className="ms-1 opacity-75">{unread}</span>
            </Link>
          </div>
          <InboxList messages={messages} />
        </div>
      </div>
    </div>
  );
}
