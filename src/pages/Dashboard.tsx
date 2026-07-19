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
import { Sparkles, LogOut, Upload, Send, Flame, Zap, Loader2, Mic, MicOff, Volume2, Square } from "lucide-react";
import { toast } from "sonner";
import SiteSEO from "@/components/SiteSEO";
import DiagramPanel from "@/components/DiagramPanel";
import CurrentAffairs from "@/components/CurrentAffairs";
import AnswerMarkdown from "@/components/AnswerMarkdown";
import { useDictation, useTTS, stripForSpeech } from "@/hooks/useSpeech";

const SUBJECTS = [
  // Primary (1–5)
  "Environmental Studies (EVS)",
  "General Knowledge",
  "Moral Science",
  // Core academics (6–12)
  "Mathematics",
  "Applied Mathematics",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Biotechnology",
  "Social Science",
  "History",
  "Geography",
  "Political Science",
  "Economics",
  "Sociology",
  "Psychology",
  "Philosophy",
  // Commerce
  "Accountancy",
  "Business Studies",
  "Entrepreneurship",
  "Legal Studies",
  // Computing & skill (CBSE codes)
  "Computer Science (083)",
  "Informatics Practices (065)",
  "Artificial Intelligence (417/843)",
  "Information Technology (402)",
  "Web Application (803)",
  "Data Science (844)",
  // Arts & life skills
  "Fine Arts",
  "Home Science",
  "Physical Education",
  "Engineering Graphics",
  // Languages
  "English",
  "Hindi",
  "Sanskrit",
  "Urdu",
  "Punjabi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Odia",
  "Assamese",
  "French",
  "German",
  "Spanish",
  "Japanese",
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

  // Voice dictation + pronunciation
  const dictation = useDictation((text) => setQuestion(text));
  const tts = useTTS();
  const [ttsLang, setTtsLang] = useState<string>("auto");
  const [ttsVoiceURI, setTtsVoiceURI] = useState<string>("auto");
  const [ttsRate, setTtsRate] = useState<number>(1);

  const autoLang = (() => {
    const s = subject.toLowerCase();
    if (s.includes("hindi")) return "hi-IN";
    if (s.includes("sanskrit")) return "sa-IN";
    if (s.includes("tamil")) return "ta-IN";
    if (s.includes("telugu")) return "te-IN";
    if (s.includes("bengali")) return "bn-IN";
    if (s.includes("marathi")) return "mr-IN";
    if (s.includes("gujarati")) return "gu-IN";
    if (s.includes("kannada")) return "kn-IN";
    if (s.includes("malayalam")) return "ml-IN";
    if (s.includes("punjabi")) return "pa-IN";
    if (s.includes("urdu")) return "ur-IN";
    if (s.includes("french")) return "fr-FR";
    if (s.includes("german")) return "de-DE";
    if (s.includes("spanish")) return "es-ES";
    if (s.includes("japanese")) return "ja-JP";
    return "en-IN";
  })();
  const effectiveLang = ttsLang === "auto" ? autoLang : ttsLang;
  const speechLang = effectiveLang; // backward-compat for dictation

  const PRESET_LANGS: { code: string; label: string }[] = [
    { code: "en-IN", label: "English (India)" },
    { code: "en-US", label: "English (US)" },
    { code: "en-GB", label: "English (UK)" },
    { code: "hi-IN", label: "Hindi" },
    { code: "sa-IN", label: "Sanskrit" },
    { code: "ta-IN", label: "Tamil" },
    { code: "te-IN", label: "Telugu" },
    { code: "bn-IN", label: "Bengali" },
    { code: "mr-IN", label: "Marathi" },
    { code: "gu-IN", label: "Gujarati" },
    { code: "kn-IN", label: "Kannada" },
    { code: "ml-IN", label: "Malayalam" },
    { code: "pa-IN", label: "Punjabi" },
    { code: "ur-IN", label: "Urdu" },
    { code: "fr-FR", label: "French" },
    { code: "de-DE", label: "German" },
    { code: "es-ES", label: "Spanish" },
    { code: "ja-JP", label: "Japanese" },
  ];
  const voiceLangs = new Set(tts.voices.map((v) => v.lang));
  const langOptions = [
    { code: "auto", label: `Auto (subject: ${autoLang})` },
    ...PRESET_LANGS.filter((l) => voiceLangs.size === 0 || voiceLangs.has(l.code)),
  ];
  const matchingVoices = tts.voices.filter(
    (v) => v.lang === effectiveLang || v.lang.startsWith(effectiveLang.split("-")[0]),
  );

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

      // XP is awarded server-side; reflect returned value if present
      if (profile && typeof data?.xp === "number") {
        setProfile({ ...profile, xp: data.xp });
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

            <div className="space-y-1 relative">
              <Label htmlFor="homework-question" className="sr-only">Your homework question</Label>
              <Textarea
                id="homework-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your homework question here, dictate with the mic, or describe what you need help with..."
                aria-label="Your homework question"
                className="min-h-32 rounded-2xl text-base pr-14"
              />
              {dictation.supported && (
                <button
                  type="button"
                  onClick={() => (dictation.listening ? dictation.stop() : dictation.start(speechLang))}
                  aria-label={dictation.listening ? "Stop dictation" : "Start voice dictation"}
                  title={dictation.listening ? "Stop dictation" : "Voice dictation"}
                  className={`absolute right-3 bottom-3 w-10 h-10 rounded-full flex items-center justify-center transition-smooth ${
                    dictation.listening
                      ? "bg-destructive text-destructive-foreground animate-pulse shadow-glow"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {dictation.listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
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
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Answer</h2>
                {tts.supported && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      value={ttsLang}
                      onValueChange={(v) => {
                        setTtsLang(v);
                        setTtsVoiceURI("auto");
                      }}
                    >
                      <SelectTrigger aria-label="Pronunciation language" className="w-44 h-9 rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {langOptions.map((l) => (
                          <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={ttsVoiceURI} onValueChange={setTtsVoiceURI}>
                      <SelectTrigger aria-label="Pronunciation voice" className="w-44 h-9 rounded-xl text-xs">
                        <SelectValue placeholder="Voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Default voice</SelectItem>
                        {matchingVoices.map((v) => (
                          <SelectItem key={v.voiceURI} value={v.voiceURI}>
                            {v.name} ({v.lang})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={String(ttsRate)} onValueChange={(v) => setTtsRate(Number(v))}>
                      <SelectTrigger aria-label="Speech rate" className="w-20 h-9 rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0.75, 0.9, 1, 1.1, 1.25, 1.5].map((r) => (
                          <SelectItem key={r} value={String(r)}>{r}x</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        tts.speaking
                          ? tts.stop()
                          : tts.speak(
                              stripForSpeech(answer),
                              effectiveLang,
                              ttsVoiceURI === "auto" ? undefined : ttsVoiceURI,
                              ttsRate,
                            )
                      }
                      className="rounded-xl gap-2"
                      aria-label={tts.speaking ? "Stop reading" : "Listen to the answer"}
                    >
                      {tts.speaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      {tts.speaking ? "Stop" : "Listen"}
                    </Button>
                  </div>
                )}
              </div>
              <AnswerMarkdown content={answer} />
            </div>
          )}

          {diagramKeywords.test(question) && (
            <DiagramPanel initialPrompt={question} />
          )}

          <CurrentAffairs />
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
