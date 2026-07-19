import { useState } from "react";
import { Loader2, Wand2, Download, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DiagramPanelProps {
  initialPrompt?: string;
}

export default function DiagramPanel({ initialPrompt = "" }: DiagramPanelProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generate = () => {
    const p = prompt.trim();
    if (!p) return;
    setLoading(true);
    const seed = Math.floor(Math.random() * 1_000_000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      p + ", clean educational diagram, labeled, high detail, white background",
    )}?width=1024&height=768&nologo=true&seed=${seed}`;
    // Set immediately — the <img> element's onLoad will clear the loading state.
    setImgUrl(url);
  };


  const download = () => {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = `diagram-${Date.now()}.png`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
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
            Describe a diagram and generate a visual with AI.
          </p>
        </div>
      </div>

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
          placeholder="e.g. Labeled diagram of the human heart"
          className="rounded-xl"
        />
        <Button
          onClick={generate}
          disabled={loading || !prompt.trim()}
          className="rounded-xl gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          {loading ? "Generating..." : "Generate"}
        </Button>
      </div>

      <div className="relative rounded-2xl border border-border bg-muted/40 min-h-[280px] flex items-center justify-center overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Creating your diagram…</p>
          </div>
        )}
        {!loading && !imgUrl && (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground text-sm">
            <ImageIcon className="w-8 h-8 opacity-40" />
            <p>Your generated diagram will appear here.</p>
          </div>
        )}
        {!loading && imgUrl && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="block w-full"
            aria-label="Open diagram fullscreen"
          >
            <img
              src={imgUrl}
              alt={prompt}
              className="w-full h-auto object-contain rounded-2xl transition-smooth hover:opacity-95"
              style={{ imageRendering: "auto" }}
            />
          </button>
        )}
      </div>

      {imgUrl && !loading && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={generate} className="rounded-xl gap-2">
            <Wand2 className="w-4 h-4" /> Regenerate
          </Button>
          <Button variant="outline" size="sm" onClick={download} className="rounded-xl gap-2">
            <Download className="w-4 h-4" /> Download
          </Button>
        </div>
      )}

      {open && imgUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[92vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-h-[92vh] overflow-auto bg-gray-50 flex items-center justify-center">
              <img src={imgUrl} alt={prompt} className="max-w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
