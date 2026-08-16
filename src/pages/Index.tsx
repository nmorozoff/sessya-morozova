import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TopicsSection from "@/components/TopicsSection";
import AboutSection from "@/components/AboutSection";
import ResultsSection from "@/components/ResultsSection";
import PricingSection from "@/components/PricingSection";
import FaqSection from "@/components/FaqSection";
import FormSection from "@/components/FormSection";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { personSchema, professionalServiceSchema, faqPageSchema, websiteSchema } from "@/lib/schema";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta
        title="Наталья Морозова — Психолог EMDR в Москве и онлайн"
        description="Психолог и EMDR-терапевт. Работа с тревогой, паническими атаками, фобиями, ПТСР и выгоранием. Онлайн и очно в Москве. Бесплатная сессия 30 минут."
        path="/"
        jsonLd={[websiteSchema, personSchema, professionalServiceSchema, faqPageSchema]}
      />
      <Navbar />
      <Hero />
      <TopicsSection />
      <AboutSection />
      <ResultsSection />
      <PricingSection />
      <FaqSection />
      <FormSection />
      <Footer />
    </div>
  );
};

export default Index;
