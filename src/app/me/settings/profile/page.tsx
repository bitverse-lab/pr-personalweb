import Link from "next/link";
import { FiDownload, FiExternalLink } from "react-icons/fi";
import BasicsForm from "@/components/me/profile/BasicsForm";
import EducationSection from "@/components/me/profile/EducationSection";
import HighlightsSection from "@/components/me/profile/HighlightsSection";
import ExperienceSection from "@/components/me/profile/ExperienceSection";
import LinksSection from "@/components/me/profile/LinksSection";
import SkillsSection from "@/components/me/profile/SkillsSection";
import WorkoutsTabs from "@/components/me/health/workouts/WorkoutsTabs";
import MePageHeader from "@/components/me/MePageHeader";
import { getMyProfile } from "@/features/profile/actions";

export default async function ProfileSettingsPage() {
  const data = await getMyProfile();

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
        <MePageHeader title="Profile & CV" description="What visitors see on your public site, and what your CV is built from." backHref="/me/settings" backLabel="Back to Settings" />
        <div className="d-flex gap-2">
          <Link href="/cv" target="_blank" className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1">
            <FiExternalLink /> View CV page
          </Link>
          <a href="/cv/download" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1">
            <FiDownload /> Download PDF
          </a>
        </div>
      </div>
      <WorkoutsTabs
        bare
        tabs={[
          { key: "basics", label: "Basics", content: <BasicsForm data={data} /> },
          { key: "highlights", label: `Highlights (${data.highlights.length})`, content: <HighlightsSection items={data.highlights} /> },
          { key: "experience", label: `Experience (${data.experiences.length})`, content: <ExperienceSection items={data.experiences} /> },
          { key: "education", label: `Education (${data.educations.length})`, content: <EducationSection items={data.educations} /> },
          { key: "skills", label: `Skills (${data.skills.length})`, content: <SkillsSection items={data.skills} /> },
          { key: "links", label: `Links (${data.links.length})`, content: <LinksSection items={data.links} /> },
        ]}
      />
    </div>
  );
}
