import { AboutPage, aboutMetadata } from "../../_views/about";

export const revalidate = 300;
export const generateMetadata = () => aboutMetadata("id");

export default function Tentang() {
  return <AboutPage locale="id" />;
}
