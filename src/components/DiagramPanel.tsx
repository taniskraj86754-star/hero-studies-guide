import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";
import { Copy, GitBranch, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "strict",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
});

interface Diagram {
  type: "mermaid" | "ascii";
  content: string;
}

const extractDiagrams = (answer: string): Diagram[] => {
  if (!answer) return [];
  const re = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const out: Diagram[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(answer)) !== null) {
    const lang = (m[1] || "").toLowerCase();
    const content = m[2].replace(/\s+$/, "");
    if (!content.trim()) continue;
    if (lang === "mermaid") {
      out.push({ type: "mermaid", content });
    } else if (["text", "diagram", "ascii", "txt", ""].includes(lang)) {
      const looksAscii = /[-|+/\\<>*]/.test(content) && content.includes("\n");
      if (looksAscii) out.push({ type: "ascii", content });
    }
  }
  return out;
};

const MermaidBlock = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        const { svg } = await mermaid.render(`m-${id}`, chart);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to render diagram");
      }
    };
    render();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Couldn't render diagram</p>
          <pre className="mt-2 text-xs whitespace-pre-wrap opacity-80">{chart}</pre>
        </div>
      </div>
    );
  }

  return <div ref={ref} className="p-4 flex justify-center overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto" />;
};

interface DiagramPanelProps {
  answer: string;
}

const DiagramPanel = ({ answer }: DiagramPanelProps) => {
  const diagrams = extractDiagrams(answer);
  if (diagrams.length === 0) return null;

  const copy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className="bg-card rounded-[2rem] border border-border shadow-card p-6 animate-fade-up">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">
          Diagrams ({diagrams.length})
        </h2>
      </div>
      <div className="space-y-4">
        {diagrams.map((d, i) => (
          <div key={i} className="rounded-2xl border border-border bg-muted/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Figure {i + 1} · {d.type === "mermaid" ? "Flow / Graph" : "ASCII"}
              </span>
              <Button variant="ghost" size="sm" onClick={() => copy(d.content)} className="h-7 px-2">
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            {d.type === "mermaid" ? (
              <MermaidBlock chart={d.content} />
            ) : (
              <pre className="p-4 overflow-x-auto text-sm font-mono leading-snug whitespace-pre">
                {d.content}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiagramPanel;
