"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/me/health", label: "Overview", exact: true },
  { href: "/me/health/weight", label: "Weight" },
  { href: "/me/health/nutrition", label: "Nutrition" },
  { href: "/me/health/workouts", label: "Workouts" },
  { href: "/me/health/body", label: "Body" },
  { href: "/me/health/goals", label: "Goals" },
];

export default function HealthTabs() {
  const pathname = usePathname();
  return (
    <nav className="nav nav-pills flex-nowrap overflow-auto mb-4 pb-1" aria-label="Health sections">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`nav-link text-nowrap ${active ? "active" : "text-dark"}`}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
