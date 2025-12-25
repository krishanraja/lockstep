import SlideController from "@/components/SlideController";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import RSVPDemo from "@/components/RSVPDemo";
import DashboardPreview from "@/components/DashboardPreview";
import CTA from "@/components/CTA";

const Index = () => {
  return (
    <SlideController>
      <Hero />
      <Features />
      <RSVPDemo />
      <DashboardPreview />
      <CTA />
    </SlideController>
  );
};

export default Index;
