import { useMemo } from "react";
import { Copy, GitBranch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface DiagramPanelProps {
  answer: string;
}

// Extract fenced code blocks. Treat blocks tagged text/diagram/ascii or untagged
// blocks that look like ASCII art as diagrams.
const extractDiagrams = (answer: string): { lang: string; content: string }[] => {
  if (!answer) return [];
  const re = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const diagrams: { lang: string; content: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(answer)) !== null) {
    const lang = (m[1] || "").toLowerCase();
    const content = m[2].replace(/\s+$/, "");
    if (!content.trim()) continue;
    const isDiagramLang = ["text", "diagram", "ascii", "txt", ""].includes(lang);
    const looksAsciiArt = /[-|+/\\<>*]/.test(content) && content.includes("\n");
    if (isDiagramLang && looksAsciiArt) {
      diagrams.push({ lang: lang || "diagram", content });
    }
  }
  return diagrams;
};

const DiagramPanel = ({ answer }: DiagramPanelProps) => {
  const diagrams = useMemo(() => extractDiagrams(answer), [answer]);

  if (diagrams.length === 0) return null;

  const copy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Diagram copied");
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
                Figure {i + 1}
              </span>
              <Button variant="ghost" size="sm" onClick={() => copy(d.content)} className="h-7 px-2">
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono leading-snug whitespace-pre">
              {d.content}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiagramPanel;
