import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Subjects from "@/components/landing/Subjects";
import StudyTools from "@/components/landing/StudyTools";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
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
