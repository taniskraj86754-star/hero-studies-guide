import { Button } from "@/components/ui/button";
import { Flame, Zap, Award } from "lucide-react";

const StudyTools = () => (
  <section id="tools" className="py-24">
    <div className="container grid lg:grid-cols-2 gap-16 items-center">
      {/* Mock dashboard */}
      <div className="relative order-2 lg:order-1">
        <div className="absolute -inset-6 gradient-hero rounded-[3rem] blur-3xl opacity-20" />
        <div className="relative bg-card rounded-[2rem] border border-border shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back,</p>
              <h3 className="text-2xl font-bold">Alex 👋</h3>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1.5 rounded-xl gradient-sun text-accent-foreground text-sm font-bold flex items-center gap-1">
                <Flame className="w-4 h-4" /> 12
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold flex items-center gap-1">
                <Zap className="w-4 h-4 text-primary" /> 2,340 XP
              </div>
            </div>
          </div>

          <div className="gradient-hero rounded-2xl p-5 text-primary-foreground">
            <p className="text-sm opacity-90 mb-1">Today's quest</p>
            <p className="font-bold text-lg mb-3">Finish 3 chemistry flashcards</p>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-white rounded-full" />
            </div>
            <p className="text-xs mt-2 opacity-90">2 of 3 complete</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Flashcards", count: "48", icon: "🎴" },
              { label: "Quizzes done", count: "23", icon: "✅" },
              { label: "Notes", count: "16", icon: "📝" },
              { label: "Badges", count: "7", icon: "🏆" },
            ].map(s => (
              <div key={s.label} className="bg-secondary rounded-2xl p-4">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6 order-1 lg:order-2">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider">Study, leveled up</p>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          Turn studying into a <span className="text-gradient">daily habit you love.</span>
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Earn XP for every problem solved, build streaks for showing up, and unlock badges as you master new topics.
          Parents and teachers get a real-time view of progress without the homework battles.
        </p>
        <div className="space-y-3">
          {[
            { icon: Award, text: "Achievement badges for mastered topics" },
            { icon: Flame, text: "Daily streaks to keep momentum going" },
            { icon: Zap, text: "XP rewards that actually motivate" },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">{item.text}</span>
            </div>
          ))}
        </div>
        <Button variant="hero" size="lg">Try the dashboard</Button>
      </div>
    </div>
  </section>
);

export default StudyTools;
