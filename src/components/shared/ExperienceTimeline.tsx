import CompanyAvatar from "@/components/shared/CompanyAvatar";
import type { ExperienceEntry } from "@/lib/data/profile";

function EventBody({ entry }: { entry: ExperienceEntry }) {
  return (
    <>
      <h3 className="h6 title mb-1 text-capitalize">{entry.role}</h3>
      {entry.description && (
        <p className="timeline-subtitle mt-3 mb-0 text-muted" style={{ whiteSpace: "pre-line" }}>
          {entry.description}
        </p>
      )}
      {entry.achievements && entry.achievements.length > 0 && (
        <ul className="text-muted small mt-2 mb-0 ps-3">
          {entry.achievements.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
    </>
  );
}

// The template's alternating two-sided timeline, driven by real experience entries.
export default function ExperienceTimeline({ entries }: { entries: ExperienceEntry[] }) {
  return (
    <div className="timeline-page position-relative">
      {entries.map((entry, index) => {
        const isEven = index % 2 === 1;
        const duration = (
          <>
            <CompanyAvatar company={entry.company} />
            <h4 className="h5 my-2">{entry.company}</h4>
            <small className="text-muted mb-0">{entry.period}</small>
          </>
        );
        return (
          <div className={`timeline-item ${index > 0 ? "mt-5 pt-4" : ""}`} key={`${entry.company}-${entry.period}-${index}`}>
            <div className="row">
              <div className={`col-lg-6 col-md-6 col-sm-6 mt-4 mt-sm-0 ${isEven ? "order-sm-1 order-2" : ""}`}>
                {isEven ? (
                  <div className="event event-description-left float-left text-end">
                    <EventBody entry={entry} />
                  </div>
                ) : (
                  <div className="duration date-label-left position-relative text-md-end">{duration}</div>
                )}
              </div>
              <div className={`col-lg-6 col-md-6 col-sm-6 ${isEven ? "order-sm-2 order-1" : "mt-4 mt-sm-0"}`}>
                {isEven ? (
                  <div className="duration duration-right position-relative">{duration}</div>
                ) : (
                  <div className="event event-description-right float-left text-start">
                    <EventBody entry={entry} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
