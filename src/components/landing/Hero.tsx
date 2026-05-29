import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Star } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
      {/* decorative blobs */}
      <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />

      <div className="container relative grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-7 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-primary/10 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI tutor that actually teaches</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05]">
            Homework, <br />
            <span className="text-gradient">made heroic.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
            Snap a photo, type a question, or upload a PDF. Get step-by-step solutions, hints,
            and quizzes built for middle school through college — without the shortcuts.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button variant="hero" size="xl">
              Start learning free <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="xl">
              <Play className="w-4 h-4" /> Watch demo
            </Button>
          </div>

          <div className="flex items-center gap-6 pt-4">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-background gradient-hero" style={{opacity: 0.5 + i*0.12}} />
              ))}
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-1 text-accent">
                {[...Array(5)].map((_,i)=>(<Star key={i} className="w-4 h-4 fill-current"/>))}
              </div>
              <p className="text-muted-foreground">Loved by 120k+ students</p>
            </div>
          </div>
        </div>

        <div className="relative animate-float">
          <div className="absolute inset-0 gradient-hero rounded-[2.5rem] blur-2xl opacity-40" />
          <img
            src={heroImg}
            alt="Smiling student with AI assistant"
            width={1536}
            height={1152}
            className="relative rounded-[2.5rem] shadow-card border border-border/50"
          />
          {/* floating cards */}
          <div className="absolute -left-4 top-12 bg-card rounded-2xl shadow-card p-3 flex items-center gap-2 animate-float-slow border border-border/50">
            <div className="w-10 h-10 rounded-xl gradient-mint flex items-center justify-center text-white font-bold">✓</div>
            <div className="text-sm">
              <p className="font-semibold">Solved in 3 steps</p>
              <p className="text-muted-foreground text-xs">Algebra · 2 min ago</p>
            </div>
          </div>
          <div className="absolute -right-4 bottom-16 bg-card rounded-2xl shadow-card p-3 flex items-center gap-2 animate-float border border-border/50" style={{animationDelay: '1s'}}>
            <div className="w-10 h-10 rounded-xl gradient-sun flex items-center justify-center text-accent-foreground font-bold">🔥</div>
            <div className="text-sm">
              <p className="font-semibold">12-day streak</p>
              <p className="text-muted-foreground text-xs">+50 XP today</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
