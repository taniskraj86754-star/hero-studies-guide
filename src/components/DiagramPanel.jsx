import React, { useEffect, useState } from "react";

const DiagramPanel = ({ content = "", maxHeight = "600px" }) => {
  const [diagrams, setDiagrams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = React.useRef(null);

  // Initialize Mermaid
  useEffect(() => {
    const initMermaid = async () => {
      if (window.mermaid) {
        window.mermaid.contentLoaded();
        return;
      }

      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
        script.async = true;
        script.onload = () => {
          if (window.mermaid) {
            window.mermaid.initialize({
              startOnLoad: false,
              theme: "default",
              securityLevel: "loose",
            });
          }
          resolve(true);
        };
        document.body.appendChild(script);
      });
    };

    initMermaid();
  }, []);

  // Parse and render diagrams
  useEffect(() => {
    if (!content || !window.mermaid) {
      setDiagrams([]);
      return;
    }

    const parseDiagrams = async () => {
      setLoading(true);
      try {
        const regex = /```mermaid\n([\s\S]*?)\n```/g;
        const matches = Array.from(content.matchAll(regex));

        if (matches.length === 0) {
          setDiagrams([]);
          setLoading(false);
          return;
        }

        const result = [];
        for (let i = 0; i < matches.length; i++) {
          try {
            const code = matches[i][1].trim();
            if (!code) continue;

            const id = `diagram-${Date.now()}-${i}`;
            const { svg } = await window.mermaid.render(id, code);

            result.push({
              id,
              svg,
              code,
            });
          } catch (err) {
            console.error(`Failed to render diagram ${i}:`, err);
          }
        }

        setDiagrams(result);
      } catch (err) {
        console.error("Error parsing diagrams:", err);
        setDiagrams([]);
      } finally {
        setLoading(false);
      }
    };

    parseDiagrams();
  }, [content]);

  if (!content) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#374151" }}>
          📊 Diagrams
        </h3>
      </div>

      <div
        style={{
          maxHeight,
          overflowY: "auto",
          padding: "16px",
          backgroundColor: "#ffffff",
        }}
      >
        {loading && (
          <div style={{ textAlign: "center", color: "#999", padding: "20px" }}>
            Rendering diagrams...
          </div>
        )}

        {!loading && diagrams.length === 0 && (
          <div style={{ textAlign: "center", color: "#d1d5db", padding: "20px" }}>
            No mermaid diagrams found
          </div>
        )}

        {!loading &&
          diagrams.map((diagram) => (
            <div
              key={diagram.id}
              style={{
                margin: "12px 0",
                padding: "12px",
                backgroundColor: "#f3f4f6",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
                overflowX: "auto",
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: diagram.svg }}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              />
            </div>
          ))}
      </div>
    </div>
  );
};

export default DiagramPanel;
