import MePageHeader from "@/components/me/MePageHeader";
import HealthTabs from "@/components/me/health/HealthTabs";

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-fluid py-4 px-4">
      <MePageHeader title="Health" description="Weight, nutrition and training — everything about your body in one place." />
      <HealthTabs />
      {children}
    </div>
  );
}
