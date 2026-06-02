import React, { useEffect, useRef, useState } from "react";

/**
 * DiagramPanel
 * Place this file at: src/components/DiagramPanel.jsx
 *
 * Props:
 *  - width, height: numbers (optional). If omitted it will size to the container.
 *  - nodes: [{ x, y, label }] optional
 *  - edges: [{ x1,y1,x2,y2 }] optional
 *  - mermaidCode: string optional — if present the component will render Mermaid output
 *  - background: CSS color for exported image (default "#fff")
 *  - filename: default export filename (default "diagram.png")
 *
 * Features:
 *  - responsive rendering
 *  - export PNG (open new tab or download)
 *  - export SVG download
 *  - high-DPI (devicePixelRatio) export
 *
 * Notes:
 *  - If you use mermaidCode, install mermaid: `npm install mermaid` or `yarn add mermaid`.
 *  - If you rely on a webfont, ensure fonts are loaded before exporting (otherwise PNG may show fallback fonts).
 */

export default function DiagramPanel({
  width: propWidth,
  height: propHeight,
  nodes = [],
  edges = [],
  mermaidCode = "",
  background = "#ffffff",
  filename = "diagram.png",
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [size, setSize] = useState({ w: propWidth || 800, h: propHeight || 600 });
  const [mermaidLoaded, setMermaidLoaded] = useState(false);

  // Responsive sizing when explicit width/height not provided
  useEffect(() => {
    if (propWidth && propHeight) {
      setSize({ w: propWidth, h: propHeight });
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({
        w: Math.max(200, Math.round(rect.width)),
        h: Math.max(150, Math.round(rect.height || 400)),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [propWidth, propHeight]);

  // Render mermaid if mermaidCode is provided
  useEffect(() => {
    let cancelled = false;
    if (!mermaidCode) return;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false });
        // mermaid.render returns { svg, bindFunctions }
        const id = "mermaid-diagram-" + Date.now();
        const renderResult = await mermaid.render(id, mermaidCode);
        if (cancelled) return;
        if (containerRef.current) {
          containerRef.current.innerHTML = renderResult.svg;
          const svgEl = containerRef.current.querySelector("svg");
          if (svgEl) {
            svgRef.current = svgEl;
            // Ensure width/height attributes for rasterization
            if (!svgEl.getAttribute("width")) svgEl.setAttribute("width", size.w);
            if (!svgEl.getAttribute("height")) svgEl.setAttribute("height", size.h);
          }
        }
        setMermaidLoaded(true);
      } catch (err) {
        console.error("Mermaid render failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mermaidCode]);

  // Helper: serialize SVG to blob URL (with background rect and width/height)
  const serializeSvgToBlobUrl = (svgElement, exportWidth, exportHeight, bgColor) => {
    const clone = svgElement.cloneNode(true);
    const xmlns = "http://www.w3.org/2000/svg";

    // Add background rect so exported PNG is not transparent
    const bg = document.createElementNS(xmlns, "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", bgColor || "#fff");
    clone.insertBefore(bg, clone.firstChild);

    // Ensure explicit width/height attributes
    clone.setAttribute("width", String(exportWidth));
    clone.setAttribute("height", String(exportHeight));

    const svgString = '<?xml version="1.0" standalone="no"?>\n' + new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    return URL.createObjectURL(blob);
  };

  // Export raster PNG (open in new tab or download)
  const exportPng = async ({ outFilename = filename, openInNewTab = true, scale = 1 } = {}) => {
    const svgEl = svgRef.current || containerRef.current?.querySelector("svg");
    if (!svgEl) {
      console.warn("No SVG found to export.");
      return;
    }

    const exportW = Math.max(1, Math.round(size.w));
    const exportH = Math.max(1, Math.round(size.h));

    const url = serializeSvgToBlobUrl(svgEl, exportW, exportH, background);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const dpr = window.devicePixelRatio || 1;
        const finalScale = dpr * Math.max(1, scale);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(exportW * finalScale);
        canvas.height = Math.round(exportH * finalScale);
        canvas.style.width = exportW + "px";
        canvas.style.height = exportH + "px";
        const ctx = canvas.getContext("2d");
        ctx.scale(finalScale, finalScale);
        ctx.fillStyle = background || "#fff";
        ctx.fillRect(0, 0, exportW, exportH);
        ctx.drawImage(img, 0, 0, exportW, exportH);

        const pngData = canvas.toDataURL("image/png");
        if (openInNewTab) {
          window.open(pngData, "_blank");
        } else {
          const a = document.createElement("a");
          a.download = outFilename;
          a.href = pngData;
          a.click();
        }
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = (e) => {
      console.error("Failed to rasterize SVG:", e);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Download serialized SVG file
  const downloadSvg = () => {
    const svgEl = svgRef.current || containerRef.current?.querySelector("svg");
    if (!svgEl) return;
    const exportW = Math.max(1, Math.round(size.w));
    const exportH = Math.max(1, Math.round(size.h));
    const url = serializeSvgToBlobUrl(svgEl, exportW, exportH, background);
    const a = document.createElement("a");
    a.href = url;
    a.download = (filename || "diagram.png").replace(/\.png$/, ".svg");
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  // Simple custom SVG renderer for nodes/edges (when not using mermaid)
  const renderCustomSvg = () => (
    <svg
      ref={svgRef}
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Diagram"
      style={{ display: "block", background }}
    >
      {/* edges */}
      {edges.map((e, i) => (
        <line
          key={i}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke="#9aa7b5"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}

      {/* nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <rect
            x={n.x - 60}
            y={n.y - 22}
            width={120}
            height={44}
            rx={8}
            fill="#f7fbff"
            stroke="#2b6cb0"
            strokeWidth={1.5}
          />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="14"
            fill="#0b2747"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          minHeight: 200,
          border: "1px solid #e6eef8",
          borderRadius: 6,
          padding: 8,
          boxSizing: "border-box",
        }}
      >
        {!mermaidCode && renderCustomSvg()}
        {/* If mermaidCode is provided, mermaid will insert the SVG into containerRef */}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => exportPng({ openInNewTab: true })}>Open image in new tab</button>
        <button onClick={() => exportPng({ openInNewTab: false })}>Download PNG</button>
        <button onClick={downloadSvg}>Download SVG</button>
      </div>
    </div>
  );
}