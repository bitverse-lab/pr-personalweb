"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiPlus } from "react-icons/fi";
import ApplicationFormDialog from "./ApplicationFormDialog";

export default function NewApplicationButton({ companies }: { companies: string[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button type="button" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1" onClick={() => setOpen(true)}>
        <FiPlus /> New application
      </button>
      {open && (
        <ApplicationFormDialog
          companies={companies}
          onClose={() => setOpen(false)}
          onSaved={(id) => router.push(`/me/career/applications/${id}`)}
        />
      )}
    </>
  );
}
