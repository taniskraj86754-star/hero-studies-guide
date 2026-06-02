import React, { useEffect, useRef, useState } from "react";

const DiagramPanel = ({ content = "", maxHeight = "600px" }) => {
  const [diagrams, setDiagrams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load and initialize Mermaid
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
    script.async = true;
    script.onload = () => {
      if (window.mermaid) {
        window.mermaid.initialize({ startOnLoad: true, theme: "default" });
      }
    };
    document.body.appendChild(script);
  }, []);

  // Render diagrams
  useEffect(() => {
    if (!content) return;
    renderDiagrams();
  }, [content]);

  const renderDiagrams = async () => {
    setLoading(true);
    const regex = /```mermaid\n([\s\S]*?)\n```/g;
    const matches = [...content.matchAll(regex)];
    const rendered = [];

    for (let i = 0; i < matches.length; i++) {
      try {
        const code = matches[i][1];
        const id = `merm-${i}`;
        const { svg } = await window.mermaid.render(id, code);
        rendered.push({ id, svg });
      } catch (e) {
        console.error("Diagram error:", e);
      }
    }

    setDiagrams(rendered);
    setLoading(false);
  };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>📊 Diagrams</h3>
      </div>
      <div style={{ maxHeight, overflowY: "auto", padding: "16px", background: "#fff" }}>
        {loading && <p>Loading diagrams...</p>}
        {!loading && diagrams.length === 0 && <p style={{ color: "#999" }}>No diagrams</p>}
        {diagrams.map((d) => (
          <div key={d.id} style={{ margin: "16px 0", padding: "12px", background: "#f3f4f6", borderRadius: "6px" }}>
            <div dangerouslySetInnerHTML={{ __html: d.svg }} style={{ display: "flex", justifyContent: "center" }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiagramPanel;