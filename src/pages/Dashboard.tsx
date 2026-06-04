import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Sparkles, LogOut, Upload, Send, Flame, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SiteSEO from "@/components/SiteSEO";
import DiagramPanel from "@/components/DiagramPanel";
import AnswerMarkdown from "@/components/AnswerMarkdown";

const SUBJECTS = [
  "Math",
  "Physics",
  "Chemistry",
  "Biology",
  "Social Science",
  "Computer",
  "Computer Science (165)",
  "Artificial Intelligence (417)",
  "Information Technology (402)",
  "General Knowledge",
  "English",
  "Hindi",
  "Sanskrit",
  "Other Languages",
];
const MODES = [
  { id: "solve", label: "Solve" },
  { id: "explain", label: "Explain" },
  { id: "summary", label: "Summary" },
  { id: "quiz", label: "Quiz" },
  { id: "notes", label: "Notes" },
];

interface Session {
  id: string;
  subject: string;
  mode: string;
  question: string;
  answer: string | null;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [subject, setSubject] = useState("Math");
  const [mode, setMode] = useState("solve");
  const [question, setQuestion] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Session[]>([]);
  const [profile, setProfile] = useState<{ display_name: string; xp: number; streak: number } | null>(null);

  const diagramKeywords = /\b(diagram|flowchart|chart|draw|visual|mind.map|mindmap|picture|illustrate|sketch|graph|map\b|representation|flow|tree|hierarchy|timeline|roadmap|cycle|process\b|workflow|structure|overview|summary diagram|with diagram|show diagram|give diagram|make diagram|create diagram)\b/i;

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, xp, streak").eq("id", user.id).maybeSingle()
      .then(({ data }) => data && setProfile(data as any));
    supabase.from("homework_sessions").select("*").order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => data && setHistory(data as any));
  }, [user]);

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageBase64(result.split(",")[1]);
      toast.success("Image attached");
    };
    reader.readAsDataURL(file);
  };

  const onSolve = async () => {
    if (!question.trim() && !imageBase64) {
      toast.error("Type a question or attach an image");
      return;
    }
    setLoading(true);
    setAnswer("");
    try {
      const { data, error } = await supabase.functions.invoke("solve-homework", {
        body: { subject, mode, question, imageBase64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const a = data.answer as string;
      setAnswer(a);

      const { data: inserted } = await supabase
        .from("homework_sessions")
        .insert({ user_id: user!.id, subject, mode, question: question || "[image]", answer: a })
        .select()
        .single();
      if (inserted) setHistory((h) => [inserted as any, ...h].slice(0, 10));

      // award XP
      if (profile) {
        const newXp = profile.xp + 10;
        await supabase.from("profiles").update({ xp: newXp }).eq("id", user!.id);
        setProfile({ ...profile, xp: newXp });
      }
      setImageBase64(null);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to solve");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteSEO
        title="Student Dashboard — Homework Hero"
        description="Your Homework Hero dashboard: ask questions, get step-by-step AI help, and track your XP and streaks."
        path="/dashboard"
      />
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 font-bold">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display">Homework Hero</span>
          </a>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl gradient-sun text-accent-foreground text-sm font-bold flex items-center gap-1">
                <Flame className="w-4 h-4" /> {profile?.streak ?? 0}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold flex items-center gap-1">
                <Zap className="w-4 h-4 text-primary" /> {profile?.xp ?? 0} XP
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="w-4 h-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Homework Assistant</h1>
            <p className="text-muted-foreground">
              Hey {profile?.display_name ?? "there"} 👋 — drop a question, snap a photo, or paste your problem.
            </p>
          </div>

          <div className="bg-card rounded-[2rem] border border-border shadow-card p-6 space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="space-y-1">
                <Label htmlFor="subject-select" className="sr-only">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger id="subject-select" aria-label="Subject" className="w-48 rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Tabs value={mode} onValueChange={setMode} aria-label="Help mode">
                <TabsList className="rounded-xl">
                  {MODES.map((m) => <TabsTrigger key={m.id} value={m.id} className="rounded-lg">{m.label}</TabsTrigger>)}
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-1">
              <Label htmlFor="homework-question" className="sr-only">Your homework question</Label>
              <Textarea
                id="homework-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your homework question here, or describe what you need help with..."
                aria-label="Your homework question"
                className="min-h-32 rounded-2xl text-base"
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <label htmlFor="homework-photo" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-primary/20 hover:bg-secondary transition-smooth text-sm">
                <Upload className="w-4 h-4" />
                {imageBase64 ? "Image attached" : "Upload photo"}
                <input
                  id="homework-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-label="Upload homework photo"
                  onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                />
              </label>
              <Button variant="hero" size="lg" onClick={onSolve} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? "Thinking..." : "Get help"}
              </Button>
            </div>
          </div>

          {answer && (
            <div className="bg-card rounded-[2rem] border border-border shadow-card p-6 animate-fade-up">
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Answer</h2>
              <AnswerMarkdown content={answer} />
            </div>
          )}

          {answer && diagramKeywords.test(question) && <DiagramPanel answer={answer} />}
        </div>

        <aside className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent</h2>
          {history.length === 0 && <p className="text-sm text-muted-foreground">No history yet.</p>}
          <div className="space-y-2">
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => { setQuestion(h.question); setSubject(h.subject); setMode(h.mode); setAnswer(h.answer ?? ""); }}
                className="w-full text-left bg-card rounded-2xl border border-border p-3 hover:border-primary/40 transition-smooth"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-primary">{h.subject}</span>
                  <span className="text-xs text-muted-foreground">· {h.mode}</span>
                </div>
                <p className="text-sm line-clamp-2">{h.question}</p>
              </button>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Dashboard;
