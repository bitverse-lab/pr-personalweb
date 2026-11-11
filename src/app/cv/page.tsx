import { CvPage, cvMetadata } from "../_views/cv";

export const revalidate = 300;
export const generateMetadata = () => cvMetadata("en");

export default function Cv() {
  return <CvPage locale="en" />;
}
