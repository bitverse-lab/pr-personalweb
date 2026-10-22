export type SkeletonVariant = "cards" | "list" | "detail" | "board";

function Line({ w, h = 12, className = "mb-2" }: { w: string | number; h?: number; className?: string }) {
  return <span className={`skeleton ${className}`} style={{ height: h, width: w }} />;
}

function Cards({ count }: { count: number }) {
  return (
    <div className="row g-3">
      {Array.from({ length: count }, (_, i) => (
        <div className="col-12 col-md-6 col-xl-4" key={i}>
          <div className="card rounded shadow-sm h-100">
            <div className="card-body">
              <Line w="45%" h={16} className="mb-3" />
              <Line w="100%" />
              <Line w="90%" />
              <Line w="70%" className="" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function List({ count }: { count: number }) {
  return (
    <div className="card rounded shadow-sm">
      <div className="card-body">
        {Array.from({ length: count }, (_, i) => (
          <div className="d-flex align-items-center gap-3 py-3 border-bottom" key={i}>
            <span className="skeleton rounded-circle flex-shrink-0" style={{ width: 36, height: 36 }} />
            <div className="flex-grow-1">
              <Line w={`${70 - i * 4}%`} h={14} />
              <Line w="40%" h={10} className="" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail() {
  return (
    <div className="row g-3">
      <div className="col-12 col-lg-8">
        <div className="card rounded shadow-sm">
          <div className="card-body">
            <Line w="60%" h={20} className="mb-3" />
            {Array.from({ length: 6 }, (_, i) => (
              <Line key={i} w={i % 3 === 2 ? "65%" : "100%"} />
            ))}
          </div>
        </div>
      </div>
      <div className="col-12 col-lg-4">
        <div className="card rounded shadow-sm">
          <div className="card-body">
            <Line w="50%" h={14} className="mb-3" />
            <Line w="100%" h={32} className="mb-2" />
            <Line w="100%" h={32} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Board() {
  return (
    <div className="row g-3">
      {Array.from({ length: 4 }, (_, col) => (
        <div className="col-12 col-md-6 col-xl-3" key={col}>
          <Line w="40%" h={12} />
          <div className="rounded p-2" style={{ background: "var(--app-surface)" }}>
            {Array.from({ length: 3 - (col % 2) }, (_, i) => (
              <div className="card rounded shadow-sm mb-2" key={i}>
                <div className="card-body p-3">
                  <Line w="85%" h={13} />
                  <Line w="45%" h={10} className="" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Placeholder shown while a workspace page loads. It mirrors the shape of the page that is
 * coming, so the layout does not jump when the real content arrives — a spinner in the middle
 * of an empty card tells the reader nothing about what to expect.
 */
export default function PageSkeleton({ variant = "cards", cards = 3 }: { variant?: SkeletonVariant; cards?: number }) {
  return (
    <div className="container-fluid py-4 px-4" role="status" aria-busy="true" aria-label="Loading">
      <Line w="min(260px, 60%)" h={28} />
      <Line w="min(420px, 80%)" h={14} className="mb-4" />
      {variant === "cards" && <Cards count={cards} />}
      {variant === "list" && <List count={cards} />}
      {variant === "detail" && <Detail />}
      {variant === "board" && <Board />}
      <span className="visually-hidden">Loading…</span>
    </div>
  );
}
