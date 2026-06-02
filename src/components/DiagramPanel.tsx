import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";
import svgPanZoom from "svg-pan-zoom";
import {
  Copy,
  GitBranch,
  AlertCircle,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Moon,
  Sun,
  Code2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
    } else if (["text", "diagram", "ascii", "txt"].includes(lang)) {
      const looksAscii = /[-|+/\\<>*]/.test(content) && content.includes("\n");
      if (looksAscii) out.push({ type: "ascii", content });
    }
  }
  return out;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const MermaidBlock = ({ chart, index, dark }: { chart: string; index: number; dark: boolean }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "");
  const [error, setError] = useState<string | null>(null);
  const panZoomRef = useRef<SvgPanZoom.Instance | null>(null);
  const [code, setCode] = useState(chart);
  const [editing, setEditing] = useState(false);

  useEffect(() => setCode(chart), [chart]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: dark ? "dark" : "default",
      securityLevel: "strict",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      flowchart: { curve: "basis", htmlLabels: true, useMaxWidth: false },
      mindmap: { useMaxWidth: false },
    });
  }, [dark]);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        if (panZoomRef.current) {
          panZoomRef.current.destroy();
          panZoomRef.current = null;
        }
        const { svg } = await mermaid.render(`m-${id}-${Date.now()}`, code);
        if (cancelled || !wrapRef.current) return;
        wrapRef.current.innerHTML = svg;
        const svgEl = wrapRef.current.querySelector("svg") as SVGSVGElement | null;
        if (svgEl) {
          svgEl.removeAttribute("height");
          svgEl.style.width = "100%";
          svgEl.style.height = "420px";
          svgEl.style.maxWidth = "100%";
          panZoomRef.current = svgPanZoom(svgEl, {
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true,
            minZoom: 0.3,
            maxZoom: 8,
          });
        }
        setError(null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to render diagram");
      }
    };
    render();
    return () => {
      cancelled = true;
      if (panZoomRef.current) {
        panZoomRef.current.destroy();
        panZoomRef.current = null;
      }
    };
  }, [code, id, dark]);

  const getSvgEl = () => wrapRef.current?.querySelector("svg") as SVGSVGElement | null;

  const exportSvg = () => {
    const svgEl = getSvgEl();
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const data = new XMLSerializer().serializeToString(clone);
    downloadBlob(new Blob([data], { type: "image/svg+xml" }), `diagram-${index + 1}.svg`);
  };

  const exportPng = async () => {
    const svgEl = getSvgEl();
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const bbox = svgEl.getBoundingClientRect();
    const w = Math.max(bbox.width, 800);
    const h = Math.max(bbox.height, 600);
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));
    const data = new XMLSerializer().serializeToString(clone);
    const svgUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = dark ? "#0b0b0b" : "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => blob && downloadBlob(blob, `diagram-${index + 1}.png`), "image/png");
    };
    img.onerror = () => toast.error("Couldn't export PNG");
    img.src = svgUrl;
  };

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium">Couldn't render diagram</p>
          <pre className="mt-2 text-xs whitespace-pre-wrap opacity-80">{error}</pre>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-3 font-mono text-xs min-h-32"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-1 px-3 py-2 border-b border-border bg-muted/30">
        <Button variant="ghost" size="sm" onClick={() => panZoomRef.current?.zoomIn()} className="h-7 w-7 p-0" title="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => panZoomRef.current?.zoomOut()} className="h-7 w-7 p-0" title="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => panZoomRef.current?.resetZoom()} className="h-7 w-7 p-0" title="Reset">
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button variant="ghost" size="sm" onClick={() => setEditing((e) => !e)} className="h-7 px-2" title="Edit code">
          {editing ? <Eye className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={exportSvg} className="h-7 px-2 gap-1" title="Download SVG">
          <Download className="w-3.5 h-3.5" /> SVG
        </Button>
        <Button variant="ghost" size="sm" onClick={exportPng} className="h-7 px-2 gap-1" title="Download PNG">
          <Download className="w-3.5 h-3.5" /> PNG
        </Button>
      </div>
      {editing && (
        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded-none border-0 border-b border-border font-mono text-xs min-h-40"
          spellCheck={false}
        />
      )}
      <div ref={wrapRef} className="bg-background overflow-hidden" style={{ height: 420 }} />
    </div>
  );
};

interface DiagramPanelProps {
  answer: string;
}

const DiagramPanel = ({ answer }: DiagramPanelProps) => {
  const [dark, setDark] = useState(false);
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">
            Diagrams ({diagrams.length})
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setDark((d) => !d)} className="h-8 gap-1.5">
          {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span className="text-xs">{dark ? "Light" : "Dark"}</span>
        </Button>
      </div>
      <div className="space-y-4">
        {diagrams.map((d, i) => (
          <div key={i} className="rounded-2xl border border-border bg-muted/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Figure {i + 1} · {d.type === "mermaid" ? "Mermaid" : "ASCII"}
              </span>
              <Button variant="ghost" size="sm" onClick={() => copy(d.content)} className="h-7 px-2" title="Copy source">
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
            {d.type === "mermaid" ? (
              <MermaidBlock chart={d.content} index={i} dark={dark} />
            ) : (
              <pre className="p-4 overflow-x-auto text-sm font-mono leading-snug whitespace-pre bg-background">
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
