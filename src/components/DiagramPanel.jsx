import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * DiagramPanel - ChatGPT-style Markdown & Diagram Renderer
 * 
 * Features:
 * - Renders markdown with code blocks
 * - Auto-detects and renders Mermaid diagrams
 * - Export PNG and SVG
 * - Math support (LaTeX)
 * - Clean, modern ChatGPT-like styling
 * - Fixed height with scrolling
 */

const DiagramPanel = ({ content = "", maxHeight = "600px" }) => {
  const containerRef = useRef(null);
  const [diagramContent, setDiagramContent] = useState(content);
  const [mermaidDiagrams, setMermaidDiagrams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize mermaid
  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose"
    });
  }, []);

  // Update content when prop changes
  useEffect(() => {
    setDiagramContent(content);
  }, [content]);

  // Render mermaid diagrams when content changes
  useEffect(() => {
    if (!diagramContent) return;

    setIsLoading(true);
    const renderDiagrams = async () => {
      const codeBlockRegex = /```mermaid\n([\s\S]*?)```/g;
      const matches = [...diagramContent.matchAll(codeBlockRegex)];
      
      const diagrams = [];
      for (const match of matches) {
        try {
          const id = `mermaid-${Date.now()}-${Math.random()}`;
          const svg = await mermaid.render(id, match[1]);
          diagrams.push({
            id,
            code: match[1],
            svg: svg.svg || svg,
          });
        } catch (err) {
          console.error("Mermaid render error:", err);
        }
      }
      setMermaidDiagrams(diagrams);
      setIsLoading(false);
    };

    renderDiagrams();
  }, [diagramContent]);

  // Custom markdown component for code blocks
  const CustomCodeBlock = ({ inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";

    if (inline) {
      return (
        <code className="bg-gray-200 rounded px-2 py-1 text-sm font-mono">
          {children}
        </code>
      );
    }

    // Check if it's a mermaid diagram
    if (language === "mermaid") {
      const diagram = mermaidDiagrams.find(
        (d) => d.code === String(children).trim()
      );
      
      if (diagram) {
        return (
          <div className="my-4 p-4 bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto max-h-96">
            <div
              dangerouslySetInnerHTML={{ __html: diagram.svg }}
              className="flex justify-center"
            />
          </div>
        );
      }
    }

    // Regular code block
    return (
      <div className="my-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto p-4 max-h-64">
        <pre className="font-mono text-sm leading-relaxed">
          <code>{children}</code>
        </pre>
      </div>
    );
  };

  // Export as PNG
  const exportPng = async () => {
    if (!containerRef.current) return;

    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        allowTaint: true,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `diagram-${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error("Export PNG error:", err);
      alert("Failed to export PNG");
    }
  };

  // Export as SVG
  const exportSvg = () => {
    if (mermaidDiagrams.length === 0) {
      alert("No diagrams to export");
      return;
    }

    const svgContent = mermaidDiagrams
      .map((d, i) => `<!-- Diagram ${i + 1} -->\n${d.svg}`)
      .join("\n\n");

    const link = document.createElement("a");
    link.href =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(svgContent);
    link.download = `diagram-${Date.now()}.svg`;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-300 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">Diagram Viewer</h3>
      </div>

      {/* Content Area - Fixed Height with Scroll */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 bg-white"
        style={{ maxHeight: maxHeight }}
      >
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Rendering diagrams...</span>
            </div>
          </div>
        )}

        {!isLoading && diagramContent && (
          <div className="prose prose-sm prose-headings:text-gray-900 max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code: CustomCodeBlock,
                p: ({ children }) => (
                  <p className="text-gray-700 leading-relaxed mb-3 text-sm">
                    {children}
                  </p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-gray-900 mb-3 mt-4">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold text-gray-800 mb-2 mt-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-bold text-gray-700 mb-2 mt-2">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1 text-sm">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside text-gray-700 mb-3 space-y-1 text-sm">
                    {children}
                  </ol>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-3 italic text-gray-600 my-3 text-sm">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {diagramContent}
            </ReactMarkdown>
          </div>
        )}

        {!diagramContent && !isLoading && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            No content to display
          </div>
        )}
      </div>

      {/* Export Buttons */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex gap-2 justify-end">
        <button
          onClick={exportSvg}
          disabled={mermaidDiagrams.length === 0}
          className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Export SVG
        </button>
        <button
          onClick={exportPng}
          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
        >
          Export PNG
        </button>
      </div>
    </div>
  );
};

export default DiagramPanel;