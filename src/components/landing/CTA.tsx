import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => (
  <section className="py-24">
    <div className="container">
      <div className="relative overflow-hidden gradient-hero rounded-[2.5rem] p-12 md:p-20 text-center text-primary-foreground shadow-glow">
        <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">Ready to become a Homework Hero?</h2>
          <p className="text-lg md:text-xl opacity-90">Join 120,000+ students learning smarter every day. Free to start, no credit card required.</p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Button variant="sun" size="xl" asChild>
              <a href="/auth">Start free <ArrowRight className="w-5 h-5" /></a>
            </Button>
            <Button variant="outline" size="xl" className="bg-white/10 border-white/30 text-primary-foreground hover:bg-white/20" asChild>
              <a href="/auth">For teachers</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CTA;
