export default function ArticleListSkeleton() {
  return (
    <div className="container py-5 mt-5" role="status" aria-busy="true" aria-label="Loading articles">
      <span className="skeleton mx-auto mb-4" style={{ height: 32, width: "min(240px, 60%)" }} />
      <div className="row g-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="col-12 col-md-6 col-lg-4" key={i}>
            <span className="skeleton mb-3" style={{ height: 180, width: "100%" }} />
            <span className="skeleton mb-2" style={{ height: 16, width: "80%" }} />
            <span className="skeleton" style={{ height: 12, width: "55%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
