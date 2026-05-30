import { useMemo } from "react";

// Sanitize SVG: keep only safe tags/attrs, strip scripts/handlers.
const SAFE_TAGS = new Set([
  "svg", "g", "path", "line", "polyline", "polygon", "rect", "circle",
  "ellipse", "text", "tspan", "defs", "marker", "use", "title", "desc",
]);

function sanitizeSvg(raw: string): string | null {
  if (!/^<svg[\s>]/i.test(raw.trim())) return null;
  try {
    const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
    const svg = doc.documentElement;
    if (svg.nodeName.toLowerCase() !== "svg") return null;

    const walk = (el: Element) => {
      const children = Array.from(el.children);
      for (const c of children) {
        if (!SAFE_TAGS.has(c.tagName.toLowerCase())) {
          el.removeChild(c);
          continue;
        }
        for (const attr of Array.from(c.attributes)) {
          if (/^on/i.test(attr.name) || /javascript:/i.test(attr.value)) {
            c.removeAttribute(attr.name);
          }
        }
        walk(c);
      }
    };
    walk(svg);

    svg.setAttribute("width", "100%");
    if (!svg.getAttribute("viewBox")) {
      const w = svg.getAttribute("width") ?? "400";
      const h = svg.getAttribute("height") ?? "300";
      svg.setAttribute("viewBox", `0 0 ${parseInt(w) || 400} ${parseInt(h) || 300}`);
    }
    svg.removeAttribute("height");
    return svg.outerHTML;
  } catch {
    return null;
  }
}

interface Block {
  type: "text" | "svg" | "code";
  content: string;
  lang?: string;
}

function parse(md: string): Block[] {
  const blocks: Block[] = [];
  const re = /```(\w+)?\n([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    if (m.index > last) blocks.push({ type: "text", content: md.slice(last, m.index) });
    const lang = (m[1] || "").toLowerCase();
    const body = m[2];
    if (lang === "svg" || /^<svg[\s>]/i.test(body.trim())) {
      blocks.push({ type: "svg", content: body });
    } else {
      blocks.push({ type: "code", content: body, lang });
    }
    last = m.index + m[0].length;
  }
  if (last < md.length) blocks.push({ type: "text", content: md.slice(last) });
  return blocks;
}

const AnswerRenderer = ({ markdown }: { markdown: string }) => {
  const blocks = useMemo(() => parse(markdown), [markdown]);
  return (
    <div className="space-y-4 text-foreground">
      {blocks.map((b, i) => {
        if (b.type === "svg") {
          const safe = sanitizeSvg(b.content);
          if (!safe) {
            return (
              <pre key={i} className="bg-muted rounded-xl p-3 text-xs overflow-auto">{b.content}</pre>
            );
          }
          return (
            <figure
              key={i}
              className="bg-secondary/40 border border-border rounded-2xl p-4 text-foreground overflow-auto"
              dangerouslySetInnerHTML={{ __html: safe }}
            />
          );
        }
        if (b.type === "code") {
          return (
            <pre key={i} className="bg-muted rounded-xl p-3 text-sm overflow-auto"><code>{b.content}</code></pre>
          );
        }
        return (
          <div key={i} className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
            {b.content}
          </div>
        );
      })}
    </div>
  );
};

export default AnswerRenderer;
