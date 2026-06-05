import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";
import svgPanZoom from "svg-pan-zoom";
import { Copy, GitBranch, AlertCircle, Download, ZoomIn, ZoomOut, Maximize2, Moon, Sun, Maximize, Code2, Wand2, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

let mermaidTheme: "default" | "dark" = "default";
const initMermaid = (theme: "default" | "dark") => {
  mermaidTheme = theme;
  mermaid.initialize({
    startOnLoad: false,
    theme,
    securityLevel: "strict",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    flowchart: { curve: "basis", htmlLabels: true, padding: 16 },
    themeVariables: {
      primaryColor: theme === "dark" ? "#1e293b" : "#eff6ff",
      primaryTextColor: theme === "dark" ? "#f1f5f9" : "#0f172a",
      primaryBorderColor: theme === "dark" ? "#475569" : "#3b82f6",
      lineColor: theme === "dark" ? "#94a3b8" : "#64748b",
    },
  });
};
initMermaid("default");

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
    if (lang === "mermaid") out.push({ type: "mermaid", content });
    else if (["text", "diagram", "ascii", "txt", ""].includes(lang)) {
      const looksAscii = /[-|+/\\<>*]/.test(content) && content.includes("\n");
      if (looksAscii) out.push({ type: "ascii", content });
    }
  }
  return out;
};

const downloadBlob = (data: string, filename: string, mime: string) => {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const svgToPng = async (svg: string, filename: string) => {
  const img = new Image();
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = url;
  });
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = (img.width || 1200) * scale;
  canvas.height = (img.height || 800) * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = mermaidTheme === "dark" ? "#0f172a" : "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  canvas.toBlob((b) => {
    if (!b) return;
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u; a.download = filename; a.click();
    URL.revokeObjectURL(u);
  }, "image/png");
};

interface MermaidBlockProps {
  chart: string;
  theme: "default" | "dark";
  onReady?: (svg: string) => void;
  interactive?: boolean;
}

const MermaidBlock = ({ chart, theme, onReady, interactive }: MermaidBlockProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const panRef = useRef<any>(null);
  const id = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);
  const [svgText, setSvgText] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        initMermaid(theme);
        const { svg } = await mermaid.render(`m-${id}-${theme}`, chart);
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
        setSvgText(svg);
        onReady?.(svg);
        setError(null);
        if (interactive) {
          const svgEl = ref.current.querySelector("svg") as SVGSVGElement | null;
          if (svgEl) {
            svgEl.removeAttribute("height");
            svgEl.style.width = "100%";
            svgEl.style.height = "100%";
            if (panRef.current) { try { panRef.current.destroy(); } catch {} }
            panRef.current = svgPanZoom(svgEl, {
              zoomEnabled: true, controlIconsEnabled: false, fit: true, center: true,
              minZoom: 0.3, maxZoom: 10,
            });
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to render diagram");
      }
    };
    render();
    return () => {
      cancelled = true;
      if (panRef.current) { try { panRef.current.destroy(); } catch {} panRef.current = null; }
    };
  }, [chart, id, theme, interactive]);

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

  return (
    <div
      ref={ref}
      data-svg={svgText ? "1" : "0"}
      className={interactive
        ? "w-full h-full flex items-center justify-center"
        : "p-4 flex justify-center overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"}
    />
  );
};

interface DiagramViewerProps {
  diagram: Diagram;
  index: number;
}

const DiagramViewer = ({ diagram, index }: DiagramViewerProps) => {
  const [theme, setTheme] = useState<"default" | "dark">("default");
  const [open, setOpen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [svg, setSvg] = useState<string>("");
  const fsKey = `${theme}-${open}`; // remount on theme/open change
  const containerId = `dwrap-${index}`;

  const copy = async (content: string) => {
    try { await navigator.clipboard.writeText(content); toast.success("Copied"); }
    catch { toast.error("Couldn't copy"); }
  };

  const zoomBy = (factor: number) => {
    const el = document.querySelector(`#${containerId} svg`) as any;
    if (!el) return;
    // svg-pan-zoom instance not exposed; trigger via wheel emulation skipped
    // Use built-in controls via event dispatch is complex; rely on wheel/buttons below
  };

  if (diagram.type === "ascii") {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Figure {index + 1} · ASCII
          </span>
          <Button variant="ghost" size="sm" onClick={() => copy(diagram.content)} className="h-7 px-2">
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm font-mono leading-snug whitespace-pre">
          {diagram.content}
        </pre>
      </div>
    );
  }

  const exportSvg = () => svg && downloadBlob(svg, `diagram-${index + 1}.svg`, "image/svg+xml");
  const exportPng = () => svg && svgToPng(svg, `diagram-${index + 1}.png`);

  return (
    <>
      <div className="rounded-2xl border border-border bg-muted/40 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border flex-wrap gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Figure {index + 1} · Mermaid
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setTheme(t => t === "dark" ? "default" : "dark")} title="Toggle theme">
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setShowCode(s => !s)} title="View source">
              <Code2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={exportSvg} title="Export SVG">
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={exportPng} title="Export PNG">
              PNG
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copy(diagram.content)} title="Copy source">
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setOpen(true)} title="Fullscreen">
              <Maximize className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className={theme === "dark" ? "bg-slate-900" : "bg-white"}>
          <div id={containerId} className="h-[420px] w-full">
            <MermaidBlock chart={diagram.content} theme={theme} onReady={setSvg} interactive />
          </div>
        </div>
        {showCode && (
          <pre className="p-4 text-xs font-mono overflow-x-auto border-t border-border bg-muted/30">
            {diagram.content}
          </pre>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-4 py-2 border-b">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <GitBranch className="w-4 h-4" /> Figure {index + 1} — Interactive
            </DialogTitle>
          </DialogHeader>
          <div className={`flex-1 ${theme === "dark" ? "bg-slate-900" : "bg-white"}`}>
            <MermaidBlock key={fsKey} chart={diagram.content} theme={theme} onReady={setSvg} interactive />
          </div>
          <div className="px-4 py-2 border-t flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setTheme(t => t === "dark" ? "default" : "dark")}>
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 mr-1" /> : <Moon className="w-3.5 h-3.5 mr-1" />} Theme
            </Button>
            <Button variant="outline" size="sm" onClick={exportSvg}><Download className="w-3.5 h-3.5 mr-1" /> SVG</Button>
            <Button variant="outline" size="sm" onClick={exportPng}><Download className="w-3.5 h-3.5 mr-1" /> PNG</Button>
            <Button variant="outline" size="sm" onClick={() => copy(diagram.content)}><Copy className="w-3.5 h-3.5 mr-1" /> Copy source</Button>
            <span className="text-xs text-muted-foreground ml-auto">Scroll to zoom · Drag to pan</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface DiagramPanelProps { answer: string; }

const DiagramPanel = ({ answer }: DiagramPanelProps) => {
  const diagrams = extractDiagrams(answer);
  if (diagrams.length === 0) return null;
  return (
    <div className="bg-card rounded-[2rem] border border-border shadow-card p-6 animate-fade-up">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">
          Diagrams ({diagrams.length})
        </h2>
      </div>
      <div className="space-y-4">
        {diagrams.map((d, i) => <DiagramViewer key={i} diagram={d} index={i} />)}
      </div>
    </div>
  );
};

export default DiagramPanel;
