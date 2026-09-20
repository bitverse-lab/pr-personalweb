import MePageHeader from "@/components/me/MePageHeader";
import TestimonialManager from "@/components/me/testimonials/TestimonialManager";
import { getMyTestimonials } from "@/features/testimonials/actions";

export default async function TestimonialsPage() {
  const items = await getMyTestimonials();
  return (
    <div className="container-fluid py-4 px-4">
      <MePageHeader title="Testimonials" description="Kind words from people you have worked with. Published ones appear on your public home page." />
      <TestimonialManager items={items} />
    </div>
  );
}
