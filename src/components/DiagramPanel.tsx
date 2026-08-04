import { useEffect, useRef, useState } from "react";
import { createParser } from "eventsource-parser";
import { flushSync } from "react-dom";
import { Loader2, Wand2, Download, X, Image as ImageIcon, Maximize2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiagramPanelProps {
  initialPrompt?: string;
  subject?: string;
}

const STYLE_OPTIONS = [
  { id: "textbook", label: "Textbook (clean lines)" },
  { id: "blackboard", label: "Blackboard / chalk" },
  { id: "labeled3d", label: "Labelled 3D illustration" },
  { id: "flow", label: "Flowchart / process" },
];

const RATIO_OPTIONS = [
  { id: "4:3", label: "4:3" },
  { id: "1:1", label: "1:1" },
  { id: "16:9", label: "16:9" },
];

export default function DiagramPanel({ initialPrompt = "", subject }: DiagramPanelProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [style, setStyle] = useState("textbook");
  const [ratio, setRatio] = useState("4:3");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<{ url: string; prompt: string }[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const generate = async () => {
    const p = prompt.trim();
    if (!p || loading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setIsFinal(false);
    setImgUrl(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-diagram`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({ prompt: p, style, ratio, subject }),
          signal: controller.signal,
        },
      );

      if (!res.ok || !res.body) {
        const msg = await res.json().catch(() => null);
        throw new Error(msg?.error ?? "Could not generate the diagram");
      }

      let sawCompleted = false;
      let streamError: string | undefined;
      let lastUrl: string | null = null;

      const parser = createParser({
        onEvent(event) {
          let payload: any;
          try { payload = JSON.parse(event.data); } catch { return; }
          if (event.event === "error" || payload?.type === "error") {
            streamError = payload?.error?.message ?? "Diagram generation failed";
            return;
          }
          if (
            event.event !== "image_generation.partial_image" &&
            event.event !== "image_generation.completed"
          ) return;
          if (!payload?.b64_json) return;
          const final = event.event === "image_generation.completed";
          const url = `data:image/png;base64,${payload.b64_json}`;
          lastUrl = url;
          flushSync(() => {
            setImgUrl(url);
            setIsFinal(final);
          });
          if (final) sawCompleted = true;
        },
      });

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          parser.feed(value);
        }
      } finally {
        reader.cancel().catch(() => {});
      }

      if (streamError) throw new Error(streamError);
      if (!sawCompleted) throw new Error("The diagram stream ended early. Please try again.");
      if (lastUrl) setHistory((h) => [{ url: lastUrl!, prompt: p }, ...h].slice(0, 4));
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message ?? "Could not generate the diagram");
      toast.error(e?.message ?? "Could not generate the diagram");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = `diagram-${Date.now()}.png`;
    a.click();
  };

  return (
    <section className="bg-card rounded-[2rem] border border-border shadow-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-bold">Diagram Generator</h2>
          <p className="text-xs text-muted-foreground">
            Describe a diagram — labelled, exam-ready visuals in seconds.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                generate();
              }
            }}
            placeholder="e.g. Labelled diagram of the human heart"
            aria-label="Diagram description"
            className="rounded-xl"
          />
          <Button onClick={generate} disabled={loading || !prompt.trim()} className="rounded-xl gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? "Drawing..." : "Generate"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <Label htmlFor="diagram-style" className="text-xs text-muted-foreground">Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger id="diagram-style" className="w-56 h-9 rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="diagram-ratio" className="text-xs text-muted-foreground">Shape</Label>
            <Select value={ratio} onValueChange={setRatio}>
              <SelectTrigger id="diagram-ratio" className="w-24 h-9 rounded-xl text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RATIO_OPTIONS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="relative rounded-2xl border border-border bg-muted/40 min-h-[280px] flex items-center justify-center overflow-hidden">
        {!imgUrl && !loading && !error && (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground text-sm">
            <ImageIcon className="w-8 h-8 opacity-40" />
            <p>Your generated diagram will appear here.</p>
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground px-6 text-center">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={generate} className="rounded-xl gap-2">
              <RefreshCw className="w-4 h-4" /> Try again
            </Button>
          </div>
        )}
        {imgUrl && (
          <button
            type="button"
            onClick={() => isFinal && setOpen(true)}
            className="block w-full"
            aria-label="Open diagram fullscreen"
          >
            <img
              src={imgUrl}
              alt={prompt || "Generated educational diagram"}
              className={`w-full h-auto object-contain rounded-2xl transition-smooth ${
                isFinal ? "hover:opacity-95" : "blur-xl scale-[1.01]"
              }`}
            />
          </button>
        )}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-[2px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Drawing your diagram…</p>
          </div>
        )}
        {imgUrl && isFinal && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-background/80 text-muted-foreground">
            <Maximize2 className="w-3 h-3" /> Click to enlarge
          </span>
        )}
      </div>

      {imgUrl && isFinal && !loading && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={generate} className="rounded-xl gap-2">
            <RefreshCw className="w-4 h-4" /> Regenerate
          </Button>
          <Button variant="outline" size="sm" onClick={download} className="rounded-xl gap-2">
            <Download className="w-4 h-4" /> Download
          </Button>
        </div>
      )}

      {history.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent diagrams</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {history.map((h, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setImgUrl(h.url); setIsFinal(true); setError(null); }}
                className="shrink-0 w-20 h-16 rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-smooth"
                aria-label={`Show diagram: ${h.prompt}`}
              >
                <img src={h.url} alt={h.prompt} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {open && imgUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-card rounded-2xl shadow-2xl max-w-6xl w-full max-h-[92vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-foreground/70 text-background flex items-center justify-center hover:bg-foreground"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-h-[92vh] overflow-auto bg-muted flex items-center justify-center">
              <img src={imgUrl} alt={prompt || "Generated educational diagram"} className="max-w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
