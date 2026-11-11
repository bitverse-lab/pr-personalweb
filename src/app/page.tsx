import { HomePage } from "./_views/home";
import { languages } from "@/lib/i18n/locale";

export const revalidate = 300;
export const metadata = { alternates: { canonical: "/", languages: languages("/") } };

export default function Home() {
  return <HomePage locale="en" />;
}
