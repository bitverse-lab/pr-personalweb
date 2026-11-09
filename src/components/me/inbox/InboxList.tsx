"use client";

import { useMemo, useState, useTransition } from "react";
import { FiCornerUpLeft, FiInbox, FiMail, FiSearch, FiTrash2 } from "react-icons/fi";
import { deleteMessage, restoreMessage, setMessageRead, type InboxMessage } from "@/features/contact/actions";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import PaginationControls from "@/components/shared/PaginationControls";
import { useToast } from "@/components/shared/ToastProvider";
import { paginate } from "@/lib/pagination";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
const PAGE_SIZE = 25;

export default function InboxList({ messages }: { messages: InboxMessage[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [target, setTarget] = useState<InboxMessage | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  // Filtering here rather than on the server: the inbox is one person's messages, already loaded,
  // and typing should narrow the list without a round trip.
  const needle = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      !needle
        ? messages
        : messages.filter((m) => [m.name, m.email, m.subject, m.message].some((field) => field?.toLowerCase().includes(needle))),
    [messages, needle]
  );
  const pageData = useMemo(() => paginate(shown, page, PAGE_SIZE), [shown, page]);

  const toggleRead = (m: InboxMessage, read: boolean) =>
    startTransition(async () => {
      const r = await setMessageRead({ id: m.id, read });
      if (!r.ok) toast.error(r.error);
    });

  const open = (m: InboxMessage) => {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.readAt && openId !== m.id) toggleRead(m, true); // opening a message marks it as read
  };

  const confirmDelete = () => {
    if (!target) return;
    const m = target;
    startTransition(async () => {
      const r = await deleteMessage(m.id);
      setTarget(null);
      if (!r.ok) return toast.error(r.error);
      const snap = r.data;
      toast.success("Message deleted", {
        action: { label: "Undo", onClick: () => void restoreMessage({ name: snap.name, email: snap.email, subject: snap.subject, message: snap.message, createdAt: snap.createdAt, readAt: snap.readAt }).then((x) => (x.ok ? toast.success("Message restored") : toast.error(x.error))) },
      });
    });
  };

  if (messages.length === 0) {
    return <EmptyState icon={FiInbox} title="No messages yet" description="Messages sent through your public contact form will show up here." />;
  }

  return (
    <>
      <div className="position-relative mb-2" style={{ maxWidth: 360 }}>
        <FiSearch className="position-absolute top-50 translate-middle-y ms-3 text-muted" aria-hidden />
        <input
          type="search"
          className="form-control form-control-sm ps-5"
          placeholder="Search name, email or message"
          aria-label="Search messages"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      </div>
      {needle && (
        <p className="text-muted small mb-0" role="status">
          {shown.length} of {messages.length} {messages.length === 1 ? "message" : "messages"} match “{query.trim()}”
        </p>
      )}

      {shown.length === 0 ? (
        <EmptyState
          icon={FiSearch}
          title="No messages match your search"
          description="Try a shorter search, or a different word from the sender's name or message."
          actionLabel="Clear search"
          onAction={() => setQuery("")}
        />
      ) : (
      <ul className="list-unstyled mb-0">
        {pageData.items.map((m) => {
          const unread = !m.readAt;
          const isOpen = openId === m.id;
          return (
            <li key={m.id} className="border-top">
              <button type="button" className="btn w-100 text-start px-0 py-3 d-flex align-items-start gap-3 border-0" aria-expanded={isOpen} onClick={() => open(m)}>
                <span className="mt-1 rounded-circle flex-shrink-0" style={{ width: 10, height: 10, background: unread ? "var(--app-primary)" : "transparent", border: unread ? "none" : "1px solid var(--bs-border-color)" }} aria-hidden />
                <span className="flex-grow-1 min-w-0">
                  <span className="d-flex flex-wrap gap-2 align-items-baseline">
                    <strong className={unread ? "" : "fw-normal"}>{m.name}</strong>
                    {unread && <span className="badge bg-primary">New</span>}
                    <span className="text-muted small">{fmt(m.createdAt)}</span>
                  </span>
                  <span className={`d-block ${isOpen ? "" : "text-truncate"} ${unread ? "fw-semibold" : ""}`}>{m.subject || "(no subject)"}</span>
                  {!isOpen && <span className="d-block text-muted small text-truncate">{m.message}</span>}
                </span>
              </button>
              {isOpen && (
                <div className="pb-3 ps-4 ms-2">
                  <p className="mb-2 small text-muted">
                    <FiMail className="me-1" aria-hidden />
                    <a href={`mailto:${m.email}`}>{m.email}</a>
                  </p>
                  <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{m.message}</p>
                  <div className="d-flex flex-wrap gap-2">
                    <a className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "your message"}`)}`}>
                      <FiCornerUpLeft aria-hidden /> Reply
                    </a>
                    <button type="button" className="btn btn-sm btn-outline-secondary" disabled={isPending} onClick={() => toggleRead(m, !!unread)}>
                      Mark as {unread ? "read" : "unread"}
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1" onClick={() => setTarget(m)}>
                      <FiTrash2 aria-hidden /> Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      )}
      <PaginationControls
        page={pageData.page}
        pageCount={pageData.pageCount}
        start={pageData.start}
        end={pageData.end}
        total={pageData.total}
        itemLabel={pageData.total === 1 ? "message" : "messages"}
        onPageChange={setPage}
      />
      {target && <ConfirmDialog title="Delete message?" message={`The message from ${target.name} will be deleted. You can undo right after.`} isPending={isPending} onConfirm={confirmDelete} onCancel={() => setTarget(null)} />}
    </>
  );
}
