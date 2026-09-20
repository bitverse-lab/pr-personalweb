import { signIn } from "@/server/auth";
import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
      <section className="section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-5 col-md-7">
              <div className="card rounded shadow p-4 text-center">
                <div className="card-body">
                  <h1 className="h4 mb-3">Sign in</h1>
                  <p className="text-muted mb-4">This area is private and restricted to the site owner.</p>

                  {searchParams.error && (
                    <p className="text-danger mb-4">
                      That Google account isn&apos;t authorized to access this area.
                    </p>
                  )}

                  <form
                    action={async () => {
                      "use server";
                      await signIn("google", { redirectTo: "/me" });
                    }}
                  >
                    <button type="submit" className="btn btn-primary w-100">
                      Sign in with Google
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
      <SmallFooter />
    </>
  );
}
