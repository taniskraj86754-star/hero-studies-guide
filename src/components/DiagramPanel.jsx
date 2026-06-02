import React, { useEffect, useRef, useState } from "react";

/**
 * DiagramPanel - Simplified ChatGPT-style Diagram Renderer
 * 
 * Features:
 * - Renders Mermaid diagrams from markdown code blocks
 * - No external dependencies needed (uses CDN)
 * - Fixed height with scrolling
 * - Export PNG and SVG
 * - ChatGPT-like UI
 */

const DiagramPanel = ({ content = "", maxHeight = "600px" }) => {
  const containerRef = useRef(null);
  const diagramsRef = useRef(null);
  const [diagramContent, setDiagramContent] = useState(content);
  const [isLoading, setIsLoading] = useState(false);
  const [diagrams, setDiagrams] = useState([]);

  // Load Mermaid from CDN
  useEffect(() => {
    if (!window.mermaid) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
      script.async = true;
      script.onload = () => {
        window.mermaid.initialize({ startOnLoad: false, theme: "default" });
      };
      document.body.appendChild(script);
    }
  }, []);

  // Update content when prop changes
  useEffect(() => {
    setDiagramContent(content);
  }, [content]);

  // Render diagrams when content changes
  useEffect(() => {
    if (!diagramContent || !window.mermaid) return;

    setIsLoading(true);
    renderDiagrams();
  }, [diagramContent]);

  const renderDiagrams = async () => {
    try {
      const codeBlockRegex = /```mermaid\n([\s\S]*?)```/g;
      const matches = [...diagramContent.matchAll(codeBlockRegex)];

      const renderedDiagrams = [];
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const code = match[1].trim();
        try {
          const id = `mermaid-${Date.now()}-${i}`;
          const { svg } = await window.mermaid.render(id, code);
          renderedDiagrams.push({
            id,
            code,
            svg,
          });
        } catch (err) {
          console.error("Mermaid render error:", err);
        }
      }
      setDiagrams(renderedDiagrams);
      setIsLoading(false);
    } catch (err) {
      console.error("Error rendering diagrams:", err);
      setIsLoading(false);
    }
  };

  // Parse markdown and render with diagrams
  const renderContent = () => {
    const parts = [];
    const lines = diagramContent.split("\n");
    let currentText = [];
    let diagramIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("```mermaid")) {
        // Render accumulated text
        if (currentText.length > 0) {
          parts.push(
            <div key={`text-${parts.length}`} className="text-content">
              {renderMarkdownText(currentText.join("\n"))}
            </div>
          );
          currentText = [];
        }

        // Find end of mermaid block
        let endIdx = i + 1;
        while (endIdx < lines.length && !lines[endIdx].startsWith("```")) {
          endIdx++;
        }
        i = endIdx;

        // Render diagram
        if (diagrams[diagramIndex]) {
          const diagram = diagrams[diagramIndex];
          parts.push(
            <div
              key={`diagram-${diagramIndex}`}
              className="diagram-block"
              dangerouslySetInnerHTML={{ __html: diagram.svg }}
            />
          );
          diagramIndex++;
        }
      } else {
        currentText.push(line);
      }
    }

    // Render remaining text
    if (currentText.length > 0) {
      parts.push(
        <div key={`text-${parts.length}`} className="text-content">
          {renderMarkdownText(currentText.join("\n"))}
        </div>
      );
    }

    return parts;
  };

  // Simple markdown parser
  const renderMarkdownText = (text) => {
    const elements = [];
    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        elements.push(<br key={`br-${i}`} />);
        continue;
      }

      // Headings
      if (line.startsWith("# ")) {
        elements.push(
          <h1 key={`h1-${i}`} className="markdown-h1">
            {line.replace(/^# /, "")}
          </h1>
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <h2 key={`h2-${i}`} className="markdown-h2">
            {line.replace(/^## /, "")}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <h3 key={`h3-${i}`} className="markdown-h3">
            {line.replace(/^### /, "")}
          </h3>
        );
      }
      // Lists
      else if (line.startsWith("- ")) {
        elements.push(
          <div key={`li-${i}`} className="markdown-li">
            • {line.replace(/^- /, "")}
          </div>
        );
      }
      // Bold and italic
      else {
        elements.push(
          <p key={`p-${i}`} className="markdown-p">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
    }

    return elements;
  };

  // Render inline markdown (bold, italic, links)
  const renderInlineMarkdown = (text) => {
    const parts = [];
    let lastIndex = 0;

    // Bold
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Export as PNG
  const exportPng = async () => {
    if (!diagramsRef.current) return;

    try {
      const canvas = await html2canvas(diagramsRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `diagram-${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error("PNG export error:", err);
      alert("Failed to export PNG. Try using Export SVG instead.");
    }
  };

  // Export as SVG
  const exportSvg = () => {
    if (diagrams.length === 0) {
      alert("No diagrams to export");
      return;
    }

    const svgContent = diagrams.map((d, i) => `<!-- Diagram ${i + 1} -->\n${d.svg}`).join("\n\n");

    const link = document.createElement("a");
    link.href = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgContent);
    link.download = `diagram-${Date.now()}.svg`;
    link.click();
  };

  return (
    <div className="diagram-panel">
      <style>{`
        .diagram-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .diagram-header {
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .diagram-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .diagram-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: white;
          max-height: ${maxHeight};
        }

        .diagram-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #6b7280;
          font-size: 14px;
        }

        .diagram-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #3b82f6;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .diagram-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 128px;
          color: #d1d5db;
          font-size: 14px;
        }

        .diagram-block {
          margin: 16px 0;
          padding: 12px;
          background: #f3f4f6;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          overflow-x: auto;
        }

        .diagram-block svg {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto;
        }

        .text-content {
          margin: 12px 0;
        }

        .markdown-h1 {
          margin: 16px 0 8px 0;
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        }

        .markdown-h2 {
          margin: 14px 0 6px 0;
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
        }

        .markdown-h3 {
          margin: 12px 0 4px 0;
          font-size: 16px;
          font-weight: 700;
          color: #374151;
        }

        .markdown-p {
          margin: 8px 0;
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
        }

        .markdown-li {
          margin: 6px 0 6px 16px;
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
        }

        .diagram-footer {
          padding: 12px 16px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .diagram-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .diagram-btn-primary {
          background: #3b82f6;
          color: white;
        }

        .diagram-btn-primary:hover {
          background: #2563eb;
        }

        .diagram-btn-secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .diagram-btn-secondary:hover {
          background: #d1d5db;
        }

        .diagram-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      {/* Header */}
      <div className="diagram-header">
        <h3>📊 Diagram Viewer</h3>
      </div>

      {/* Content */}
      <div className="diagram-content">
        {isLoading && (
          <div className="diagram-loading">
            <div className="diagram-spinner"></div>
            <span>Rendering diagrams...</span>
          </div>
        )}

        {!isLoading && diagramContent && (
          <div ref={diagramsRef}>
            {renderContent()}
          </div>
        )}

        {!isLoading && !diagramContent && (
          <div className="diagram-empty">No content to display</div>
        )}
      </div>

      {/* Footer */}
      <div className="diagram-footer">
        <button
          className="diagram-btn diagram-btn-secondary"
          onClick={exportSvg}
          disabled={diagrams.length === 0}
        >
          Export SVG
        </button>
        <button className="diagram-btn diagram-btn-primary" onClick={exportPng}>
          Export PNG
        </button>
      </div>
    </div>
  );
};

// Load html2canvas for PNG export
if (!window.html2canvas) {
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
  document.body.appendChild(script);
}

export default DiagramPanel;