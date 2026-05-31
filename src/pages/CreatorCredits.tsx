import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Coins, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteSEO from "@/components/SiteSEO";

const CreatorCredits = () => {
  const [total, setTotal] = useState<number | null>(null);
  const [today, setToday] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_total_questions");
      setTotal(Number(data ?? 0));
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("homework_sessions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since.toISOString());
      setToday(count ?? 0);
    })();
  }, []);

  const credits = total ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteSEO
        title="Creator Credits — Homework Hero"
        description="Track credits earned every time a student asks the AI a question. Reinvest credits to improve Homework Hero."
        path="/creator"
      />
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 font-bold">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display">Homework Hero</span>
          </a>
          <Button variant="ghost" size="sm" asChild>
            <a href="/dashboard">Back to dashboard</a>
          </Button>
        </div>
      </header>

      <main className="container py-12 space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Creator Credits</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Every time a student asks the AI a question, you earn 1 credit. Use these credits to keep building and improving Homework Hero.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
              <Coins className="w-4 h-4 text-primary" /> Total credits earned
            </div>
            <div className="mt-3 text-5xl font-bold">
              {total === null ? <Loader2 className="w-8 h-8 animate-spin" /> : credits.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">1 credit per question asked, lifetime.</p>
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-primary" /> Earned today
            </div>
            <div className="mt-3 text-5xl font-bold">
              {today === null ? <Loader2 className="w-8 h-8 animate-spin" /> : today.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Questions asked since midnight.</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-card space-y-3">
          <h2 className="text-xl font-bold">How to spend credits</h2>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>Add new subjects or modes (lab help, project ideas, exam prep).</li>
            <li>Upgrade the AI model for harder questions.</li>
            <li>Improve diagrams, add voice answers, or unlock image generation.</li>
            <li>Add gamification: leaderboards, badges, daily challenges.</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default CreatorCredits;
