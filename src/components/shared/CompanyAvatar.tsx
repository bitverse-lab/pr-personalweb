// Template sample entries carry a logo image; real entries don't, so they get the company's initial.
export default function CompanyAvatar({ company, logo }: { company: string; logo?: string }) {
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} className="rounded-pill avatar avatar-ex-small" alt="" />;
  }
  return (
    <div
      className="rounded-pill avatar avatar-ex-small bg-soft-primary text-primary d-inline-flex align-items-center justify-content-center fw-semibold"
      aria-hidden
    >
      {company.charAt(0).toUpperCase()}
    </div>
  );
}
