import { Brain, Camera, Calculator, BookOpen, Trophy, Users, Sparkles, LineChart } from "lucide-react";

const features = [
  { icon: Camera, title: "Snap & Solve", desc: "Upload a photo or PDF of any homework problem and get instant guidance.", gradient: "gradient-hero" },
  { icon: Brain, title: "Step-by-step AI Tutor", desc: "Explanations in plain English — hints first, answers only when you're ready.", gradient: "gradient-mint" },
  { icon: Calculator, title: "Math Superpowers", desc: "Equation solver, graph visualizer, and formula cheat sheets for every level.", gradient: "gradient-sun" },
  { icon: BookOpen, title: "Smart Study Tools", desc: "Auto-generate flashcards, quizzes, and clean summaries from your notes.", gradient: "gradient-hero" },
  { icon: Trophy, title: "Streaks & Badges", desc: "Earn XP, unlock achievements, and stay motivated every single day.", gradient: "gradient-sun" },
  { icon: Users, title: "Parent / Teacher Mode", desc: "Track progress, time spent, and weekly improvement at a glance.", gradient: "gradient-mint" },
  { icon: Sparkles, title: "Plagiarism-safe Writing", desc: "Original, rewritten responses you can confidently submit.", gradient: "gradient-hero" },
  { icon: LineChart, title: "Progress Analytics", desc: "See exactly which topics you've mastered — and what to review next.", gradient: "gradient-sun" },
];

const Features = () => (
  <section id="features" className="py-24 relative">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Everything you need</p>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">An AI study buddy that <span className="text-gradient">actually helps you learn</span></h2>
        <p className="text-lg text-muted-foreground">Built for middle schoolers, high schoolers, and college students alike.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="group bg-card rounded-3xl p-6 border border-border/60 shadow-soft hover:shadow-card hover:-translate-y-1 transition-bounce animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`w-12 h-12 rounded-2xl ${f.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-bounce`}>
              <f.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
