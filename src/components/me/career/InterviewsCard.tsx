"use client";

import { useState, useTransition } from "react";
import { FiCalendar, FiCheck, FiPlus, FiX } from "react-icons/fi";
import {
  cancelInterview,
  completeInterview,
  createInterview,
  updateInterview,
} from "@/features/career/actions";
import { INTERVIEW_KIND_LABEL } from "@/features/career/status";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { useToast } from "@/components/shared/ToastProvider";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import type { InterviewKind, InterviewStatus } from "@/db/schema/career";
import type { ContactDto } from "./ContactsCard";

export interface InterviewDto {
  id: string;
  kind: InterviewKind;
  startAt: Date;
  endAt: Date;
  locationOrLink: string | null;
  notes: string | null;
  contactId: string | null;
  status: InterviewStatus;
  calendarEventId: string | null;
}

function toLocalInput(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function InterviewDialog({
  applicationId,
  interview,
  contacts,
  onClose,
}: {
  applicationId: string;
  interview?: InterviewDto;
  contacts: ContactDto[];
  onClose: () => void;
}) {
  const panelRef = useDialogA11y<HTMLDivElement>(onClose);
  const toast = useToast();
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() + 1);
  defaultStart.setHours(10, 0, 0, 0);
  const [kind, setKind] = useState<InterviewKind>(interview?.kind ?? "other");
  const [start, setStart] = useState(toLocalInput(interview?.startAt ?? defaultStart));
  const [end, setEnd] = useState(toLocalInput(interview?.endAt ?? new Date(defaultStart.getTime() + 3600000)));
  const [locationOrLink, setLocationOrLink] = useState(interview?.locationOrLink ?? "");
  const [notes, setNotes] = useState(interview?.notes ?? "");
  const [contactId, setContactId] = useState(interview?.contactId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const shared = {
        kind,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        locationOrLink,
        notes,
        contactId: contactId || null,
      };
      const result = interview
        ? await updateInterview({ id: interview.id, ...shared })
        : await createInterview({ applicationId, ...shared });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(interview ? "Interview rescheduled" : "Interview scheduled and added to your calendar");
      onClose();
    });
  };

  return (
    <div role="presentation" className="me-dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className="me-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="interview-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h6 id="interview-dialog-title" className="mb-3">
          {interview ? "Edit interview" : "Schedule interview"}
        </h6>
        <form onSubmit={submit}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <div className="mb-3">
            <label className="form-label" htmlFor="iv-kind">Type</label>
            <select id="iv-kind" name="kind" className="form-select" value={kind} onChange={(e) => setKind(e.target.value as InterviewKind)}>
              {(Object.keys(INTERVIEW_KIND_LABEL) as InterviewKind[]).map((value) => (
                <option key={value} value={value}>
                  {INTERVIEW_KIND_LABEL[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <div className="col-6 mb-3">
              <label className="form-label" htmlFor="iv-start">Start</label>
              <input id="iv-start" name="start" type="datetime-local" className="form-control" value={start} onChange={(e) => setStart(e.target.value)} required />
            </div>
            <div className="col-6 mb-3">
              <label className="form-label" htmlFor="iv-end">End</label>
              <input id="iv-end" name="end" type="datetime-local" className="form-control" value={end} onChange={(e) => setEnd(e.target.value)} required />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="iv-locationOrLink">Location or meeting link</label>
            <input id="iv-locationOrLink" name="locationOrLink" className="form-control" value={locationOrLink} onChange={(e) => setLocationOrLink(e.target.value)} />
          </div>
          {contacts.length > 0 && (
            <div className="mb-3">
              <label className="form-label" htmlFor="iv-contactId">Interviewer</label>
              <select id="iv-contactId" name="contactId" className="form-select" value={contactId} onChange={(e) => setContactId(e.target.value)}>
                <option value="">Not set</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="mb-3">
            <label className="form-label" htmlFor="iv-notes">Notes</label>
            <textarea id="iv-notes" name="notes" className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_BADGE: Record<InterviewStatus, string> = {
  scheduled: "badge bg-soft-primary text-primary",
  completed: "badge bg-soft-success text-success",
  cancelled: "badge bg-soft-secondary text-secondary",
};

export default function InterviewsCard({
  applicationId,
  interviews,
  contacts,
}: {
  applicationId: string;
  interviews: InterviewDto[];
  contacts: ContactDto[];
}) {
  const [dialog, setDialog] = useState<{ interview?: InterviewDto } | null>(null);
  const [cancelling, setCancelling] = useState<InterviewDto | null>(null);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const complete = (interview: InterviewDto) => {
    startTransition(async () => {
      const result = await completeInterview(interview.id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Interview marked as completed");
    });
  };

  const cancel = (interview: InterviewDto) => {
    startTransition(async () => {
      const result = await cancelInterview(interview.id);
      setCancelling(null);
      if (!result.ok) toast.error(result.error);
      else toast.success("Interview cancelled and removed from your calendar");
    });
  };

  return (
    <div className="card rounded shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h6 className="mb-0">Interviews</h6>
          <button type="button" className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1" onClick={() => setDialog({})}>
            <FiPlus /> Schedule
          </button>
        </div>
        {interviews.length === 0 ? (
          <p className="text-muted small mb-0">Scheduled interviews also appear in your calendar.</p>
        ) : (
          <ul className="list-unstyled mb-0">
            {interviews.map((interview) => (
              <li key={interview.id} className="py-2 border-bottom">
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-semibold">{INTERVIEW_KIND_LABEL[interview.kind]} interview</span>
                      <span className={STATUS_BADGE[interview.status]}>{interview.status}</span>
                    </div>
                    <div className="text-muted small d-flex flex-wrap gap-2">
                      <span className="d-inline-flex align-items-center gap-1">
                        <FiCalendar aria-hidden />
                        {interview.startAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                      {interview.locationOrLink && <span>{interview.locationOrLink}</span>}
                      {interview.status === "scheduled" && !interview.calendarEventId && <span>Not on calendar</span>}
                    </div>
                  </div>
                  {interview.status === "scheduled" && (
                    <div className="d-flex gap-1">
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setDialog({ interview })}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-success" onClick={() => complete(interview)} disabled={isPending} aria-label="Mark completed">
                        <FiCheck />
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setCancelling(interview)} aria-label="Cancel interview">
                        <FiX />
                      </button>
                    </div>
                  )}
                </div>
                {interview.notes && <p className="small mb-0 mt-1">{interview.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {dialog && (
        <InterviewDialog
          applicationId={applicationId}
          interview={dialog.interview}
          contacts={contacts}
          onClose={() => setDialog(null)}
        />
      )}
      {cancelling && (
        <ConfirmDialog
          title="Cancel interview?"
          message="It will be removed from your calendar and noted on the timeline."
          confirmLabel="Cancel interview"
          isPending={isPending}
          onConfirm={() => cancel(cancelling)}
          onCancel={() => setCancelling(null)}
        />
      )}
    </div>
  );
}
