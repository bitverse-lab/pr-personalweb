"use client";

import { useState, useTransition } from "react";
import { FiCornerUpLeft, FiInbox, FiMail, FiTrash2 } from "react-icons/fi";
import { deleteMessage, restoreMessage, setMessageRead, type InboxMessage } from "@/features/contact/actions";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function InboxList({ messages }: { messages: InboxMessage[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [target, setTarget] = useState<InboxMessage | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

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
      <ul className="list-unstyled mb-0">
        {messages.map((m) => {
          const unread = !m.readAt;
          const isOpen = openId === m.id;
          return (
            <li key={m.id} className="border-top">
              <button type="button" className="btn w-100 text-start px-0 py-3 d-flex align-items-start gap-3 border-0" aria-expanded={isOpen} onClick={() => open(m)}>
                <span className="mt-1 rounded-circle flex-shrink-0" style={{ width: 10, height: 10, background: unread ? "#2a52c3" : "transparent", border: unread ? "none" : "1px solid #ced4da" }} aria-hidden />
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
      {target && <ConfirmDialog title="Delete message?" message={`The message from ${target.name} will be deleted. You can undo right after.`} isPending={isPending} onConfirm={confirmDelete} onCancel={() => setTarget(null)} />}
    </>
  );
}
