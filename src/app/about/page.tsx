import { AboutPage, aboutMetadata } from "../_views/about";

export const revalidate = 300;
export const generateMetadata = () => aboutMetadata("en");

export default function About() {
  return <AboutPage locale="en" />;
}
