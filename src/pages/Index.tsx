import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProblemsSection from "@/components/ProblemsSection";
import TopicsSection from "@/components/TopicsSection";
import AboutSection from "@/components/AboutSection";
import ResultsSection from "@/components/ResultsSection";
import PricingSection from "@/components/PricingSection";
import FormSection from "@/components/FormSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <ProblemsSection />
      <TopicsSection />
      <AboutSection />
      <ResultsSection />
      <PricingSection />
      <FormSection />
      <Footer />
    </div>
  );
};

export default Index;
