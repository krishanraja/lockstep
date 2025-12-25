import Hero from "@/components/Hero";
import Features from "@/components/Features";
import RSVPDemo from "@/components/RSVPDemo";
import DashboardPreview from "@/components/DashboardPreview";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Features />
      <RSVPDemo />
      <DashboardPreview />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
