import type { Metadata } from "next";

import PersonalNavbar from "@/components/layout/PersonalNavbar";
import SmallFooter from "@/components/layout/SmallFooter";
import JdMatcher from "@/components/match/JdMatcher";

export const metadata: Metadata = {
  title: "Match a job description",
  description: "Paste a job description and see, requirement by requirement, the projects and work that answer it.",
};

export default function MatchPage() {
  return (
    <>
      <PersonalNavbar />
      <main id="main-content" tabIndex={-1}>
        <section className="page-head">
          <div className="container">
            <p className="path-label mb-3">~/match</p>
            <h1 className="page-head-title">Hiring? Check the fit in a minute</h1>
            <p className="page-head-lede">
              Paste the job description. Each requirement is matched with the project, result or article on this site that answers it, and the ones without evidence are shown too.
            </p>
          </div>
        </section>
        <section className="section pt-5">
          <div className="container">
            <JdMatcher />
          </div>
        </section>
      </main>
      <SmallFooter />
    </>
  );
}
