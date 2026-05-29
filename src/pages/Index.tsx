import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Subjects from "@/components/landing/Subjects";
import StudyTools from "@/components/landing/StudyTools";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import SiteSEO from "@/components/SiteSEO";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteSEO
        title="Homework Hero — AI Study Buddy for Students"
        description="Snap a photo or paste a question and get step-by-step homework help, summaries, quizzes, and study notes powered by AI."
        path="/"
      />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Subjects />
        <StudyTools />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
