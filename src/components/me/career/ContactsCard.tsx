"use client";

import { useState, useTransition } from "react";
import { FiLinkedin, FiMail, FiPhone, FiTrash2, FiUserPlus } from "react-icons/fi";
import { addContact, deleteContact } from "@/features/career/actions";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { useToast } from "@/components/shared/ToastProvider";

export interface ContactDto {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
}

function ContactDialog({ applicationId, onClose }: { applicationId: string; onClose: () => void }) {
  const panelRef = useDialogA11y<HTMLDivElement>(onClose);
  const toast = useToast();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addContact({ applicationId, name, role, email, phone, linkedin });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Contact added");
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
        aria-labelledby="contact-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h6 id="contact-dialog-title" className="mb-3">
          Add contact
        </h6>
        <form onSubmit={submit}>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <div className="mb-3">
            <label className="form-label" htmlFor="ct-name">Name</label>
            <input id="ct-name" name="name" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="ct-role">Role</label>
            <input id="ct-role" name="role" className="form-control" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="ct-email">Email</label>
              <input id="ct-email" name="email" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="ct-phone">Phone</label>
              <input id="ct-phone" name="phone" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="ct-linkedin">LinkedIn</label>
            <input id="ct-linkedin" name="linkedin" className="form-control" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={onClose} disabled={isPending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isPending || !name.trim()}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContactsCard({ applicationId, contacts }: { applicationId: string; contacts: ContactDto[] }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const toast = useToast();

  const remove = (contact: ContactDto) => {
    startTransition(async () => {
      const result = await deleteContact(contact.id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Contact removed");
    });
  };

  return (
    <div className="card rounded shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h6 className="mb-0">Contacts</h6>
          <button type="button" className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1" onClick={() => setOpen(true)}>
            <FiUserPlus /> Add
          </button>
        </div>
        {contacts.length === 0 ? (
          <p className="text-muted small mb-0">Recruiters and interviewers you talk to will show up here.</p>
        ) : (
          <ul className="list-unstyled mb-0">
            {contacts.map((contact) => (
              <li key={contact.id} className="d-flex align-items-start justify-content-between py-2 border-bottom">
                <div>
                  <div className="fw-semibold">{contact.name}</div>
                  {contact.role && <div className="text-muted small">{contact.role}</div>}
                  <div className="d-flex flex-wrap gap-3 small mt-1">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="d-inline-flex align-items-center gap-1">
                        <FiMail aria-hidden /> {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <span className="d-inline-flex align-items-center gap-1">
                        <FiPhone aria-hidden /> {contact.phone}
                      </span>
                    )}
                    {contact.linkedin && (
                      <span className="d-inline-flex align-items-center gap-1">
                        <FiLinkedin aria-hidden /> {contact.linkedin}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger border-0"
                  onClick={() => remove(contact)}
                  aria-label={`Remove ${contact.name}`}
                >
                  <FiTrash2 />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {open && <ContactDialog applicationId={applicationId} onClose={() => setOpen(false)} />}
    </div>
  );
}
