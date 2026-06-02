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
 */

const DiagramPanel = ({ content = "", onExport = null }) => {
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
          <div className="my-4 p-4 bg-gray-50 rounded-lg border border-gray-200 overflow-auto">
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
      <div className="my-4 bg-gray-900 text-gray-100 rounded-lg overflow-auto p-4">
        <pre className="font-mono text-sm leading-relaxed">
          <code>{children}</code>
        </pre>
      </div>
    );
  };

  // Export as PNG
  const exportPng = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "diagram.png";
    link.click();
  };

  // Export as SVG
  const exportSvg = () => {
    if (mermaidDiagrams.length === 0) return;

    const svgContent = mermaidDiagrams
      .map((d) => d.svg)
      .join("\n");

    const link = document.createElement("a");
    link.href =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(svgContent);
    link.download = "diagram.svg";
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Content Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6 bg-gradient-to-b from-gray-50 to-white"
      >
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Rendering diagrams...
            </div>
          </div>
        )}

        {!isLoading && diagramContent && (
          <div className="max-w-4xl mx-auto prose prose-sm">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code: CustomCodeBlock,
                p: ({ children }) => (
                  <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-6">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold text-gray-800 mb-3 mt-5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-bold text-gray-700 mb-2 mt-4">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2">
                    {children}
                  </ol>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4">
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

        {!diagramContent && (
          <div className="flex items-center justify-center h-32 text-gray-400">
            No content to display
          </div>
        )}
      </div>

      {/* Export Buttons */}
      <div className="border-t border-gray-200 bg-white p-4 flex gap-2 justify-end">
        <button
          onClick={exportSvg}
          disabled={mermaidDiagrams.length === 0}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
        >
          Export SVG
        </button>
        <button
          onClick={exportPng}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Export PNG
        </button>
      </div>
    </div>
  );
};

export default DiagramPanel;