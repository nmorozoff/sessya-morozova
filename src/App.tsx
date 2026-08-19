import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import YandexRotorReady from "@/components/YandexRotorReady";
import Index from "./pages/Index";

const Privacy = lazy(() => import("./pages/Privacy"));
const AdvertisingConsent = lazy(() => import("./pages/AdvertisingConsent"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Offer = lazy(() => import("./pages/Offer"));
const NotFound = lazy(() => import("./pages/NotFound"));
const EmdrTherapy = lazy(() => import("./pages/services/EmdrTherapy"));
const PanicAttacks = lazy(() => import("./pages/services/PanicAttacks"));
const Phobias = lazy(() => import("./pages/services/Phobias"));
const Anxiety = lazy(() => import("./pages/services/Anxiety"));
const Grief = lazy(() => import("./pages/services/Grief"));
const Divorce = lazy(() => import("./pages/services/Divorce"));
const SexualAbuse = lazy(() => import("./pages/services/SexualAbuse"));
const EmotionalAbuse = lazy(() => import("./pages/services/EmotionalAbuse"));
const EatingDisorders = lazy(() => import("./pages/services/EatingDisorders"));
const Psychosomatics = lazy(() => import("./pages/services/Psychosomatics"));
const BusinessPsychology = lazy(() => import("./pages/services/BusinessPsychology"));
const Ptsd = lazy(() => import("./pages/services/Ptsd"));
const Ocd = lazy(() => import("./pages/services/Ocd"));
const Burnout = lazy(() => import("./pages/services/Burnout"));
const Dissociation = lazy(() => import("./pages/services/Dissociation"));
const ComplexPtsd = lazy(() => import("./pages/services/ComplexPtsd"));
const ParentsRelationship = lazy(() => import("./pages/services/ParentsRelationship"));
const EmigrationStress = lazy(() => import("./pages/services/EmigrationStress"));
const PsychologicalTrauma = lazy(() => import("./pages/services/PsychologicalTrauma"));
const BlogIndex = lazy(() => import("./pages/blog/BlogIndex"));
const BlogPost = lazy(() => import("./pages/blog/BlogPost"));

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-muted-foreground text-sm">Загрузка...</div>
  </div>
);

const App = () => (
  <>
    <Toaster />
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <YandexRotorReady />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/emdr-therapy" element={<EmdrTherapy />} />
          <Route path="/panic-attacks" element={<PanicAttacks />} />
          <Route path="/phobias" element={<Phobias />} />
          <Route path="/anxiety" element={<Anxiety />} />
          <Route path="/grief" element={<Grief />} />
          <Route path="/divorce" element={<Divorce />} />
          <Route path="/sexual-abuse" element={<SexualAbuse />} />
          <Route path="/emotional-abuse" element={<EmotionalAbuse />} />
          <Route path="/eating-disorders" element={<EatingDisorders />} />
          <Route path="/psychosomatics" element={<Psychosomatics />} />
          <Route path="/business-psychology" element={<BusinessPsychology />} />
          <Route path="/ptsd" element={<Ptsd />} />
          <Route path="/ocd" element={<Ocd />} />
          <Route path="/burnout" element={<Burnout />} />
          <Route path="/dissociation" element={<Dissociation />} />
          <Route path="/complex-ptsd" element={<ComplexPtsd />} />
          <Route path="/parents-relationship" element={<ParentsRelationship />} />
          <Route path="/emigration-stress" element={<EmigrationStress />} />
          <Route path="/psychological-trauma" element={<PsychologicalTrauma />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/page/:pageNum" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/advertising-consent" element={<AdvertisingConsent />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/offer" element={<Offer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </>
);

export default App;
