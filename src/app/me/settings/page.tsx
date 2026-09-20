import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import MePageHeader from "@/components/me/MePageHeader";

const tiles = [
  { href: "/me/settings/profile", title: "Profile", description: "Your public name, bio, and photo." },
  { href: "/me/settings/account", title: "Account", description: "Sign-in and security settings." },
  { href: "/me/settings/data", title: "Data", description: "Export or manage your data." },
];

export default function SettingsPage() {
  return (
    <div className="container-fluid py-4 px-4">
      <MePageHeader title="Settings" />
      <div className="row row-cols-1 row-cols-md-2 g-4">
        {tiles.map((tile) => (
          <div className="col" key={tile.href}>
            <Link href={tile.href} className="text-decoration-none">
              <div className="card rounded shadow-sm h-100">
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1 text-dark">{tile.title}</h6>
                    <p className="text-muted small mb-0">{tile.description}</p>
                  </div>
                  <FiArrowRight className="text-primary" />
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
