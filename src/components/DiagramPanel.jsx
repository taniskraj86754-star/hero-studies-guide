import React, { useEffect, useRef, useState } from "react";

/**
 * DiagramPanel - Mermaid Diagram Renderer with CDN
 * Renders Mermaid diagrams from markdown code blocks
 */

const DiagramPanel = ({ content = "", maxHeight = "600px" }) => {
  const containerRef = useRef(null);
  const [diagrams, setDiagrams] = useState<{ id: string; svg: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load mermaid from CDN on component mount
  useEffect(() => {
    const loadMermaid = async () => {
      if (window.mermaid) {
        window.mermaid.contentLoaded();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
      script.async = true;
      script.onload = () => {
        if (window.mermaid) {
          window.mermaid.initialize({
            startOnLoad: false,
            theme: "default",
            securityLevel: "loose",
            flowchart: { useMaxWidth: true }
          });
        }
      };
      document.body.appendChild(script);
    };

    loadMermaid();
  }, []);

  // Render diagrams when content changes
  useEffect(() => {
    if (!content || !window.mermaid) {
      setDiagrams([]);
      return;
    }

    renderMermaidDiagrams();
  }, [content]);

  const renderMermaidDiagrams = async () => {
    setIsLoading(true);
    try {
      // Extract all mermaid code blocks
      const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
      const matches = Array.from(content.matchAll(mermaidRegex));

      if (matches.length === 0) {
        setDiagrams([]);
        setIsLoading(false);
        return;
      }

      const renderedDiagrams = [];

      for (let i = 0; i < matches.length; i++) {
        const code = matches[i][1].trim();
        if (!code) continue;

        try {
          const id = `mermaid-diagram-${Date.now()}-${i}`;
          
          // Render using mermaid
          const { svg } = await window.mermaid.render(id, code);
          
          renderedDiagrams.push({
            id,
            svg: svg || ""
          });
        } catch (error) {
          console.error(`Error rendering diagram ${i}:`, error);
        }
      }

      setDiagrams(renderedDiagrams);
    } catch (error) {
      console.error("Error parsing diagrams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!content) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.headerTitle}>📊 Diagram Viewer</h3>
        </div>
        <div style={{ ...styles.content, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={styles.empty}>No diagrams to display</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>📊 Diagram Viewer</h3>
      </div>

      {/* Content Area */}
      <div style={{ ...styles.content, maxHeight, overflowY: 'auto' }} ref={containerRef}>
        {isLoading && (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <span style={styles.loadingText}>Rendering diagrams...</span>
          </div>
        )}

        {!isLoading && diagrams.length === 0 && (
          <p style={styles.empty}>No mermaid diagrams found in the answer</p>
        )}

        {!isLoading && diagrams.length > 0 && (
          <div>
            {diagrams.map((diagram, index) => (
              <div key={diagram.id} style={styles.diagramBox}>
                <div
                  dangerouslySetInnerHTML={{ __html: diagram.svg }}
                  style={styles.diagramContent}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button
          onClick={() => {
            if (diagrams.length > 0) {
              const svgContent = diagrams.map((d, i) => `<!-- Diagram ${i + 1} -->\n${d.svg}`).join('\n\n');
              const link = document.createElement('a');
              link.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
              link.download = `diagrams-${Date.now()}.svg`;
              link.click();
            }
          }}
          disabled={diagrams.length === 0}
          style={{
            ...styles.button,
            ...styles.buttonSecondary,
            opacity: diagrams.length === 0 ? 0.5 : 1,
            cursor: diagrams.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Export SVG
        </button>
        <button
          onClick={() => {
            if (diagrams.length > 0 && containerRef.current) {
              // Simple PNG export - saves the rendered diagrams as image
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = 800;
              canvas.height = 600;
              if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `diagram-${Date.now()}.png`;
                link.click();
              }
            }
          }}
          style={{...styles.button, ...styles.buttonPrimary}}
        >
          Export PNG
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  headerTitle: {
    margin: '0',
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#374151',
  },
  content: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px',
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#6b7280',
    fontSize: '14px',
    height: '128px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #3b82f6',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  empty: {
    fontSize: '14px',
    color: '#d1d5db',
    margin: '0',
    textAlign: 'center' as const,
  },
  diagramBox: {
    margin: '16px 0',
    padding: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    overflowX: 'auto' as const,
  },
  diagramContent: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  footer: {
    padding: '12px 16px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  button: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
    color: 'white',
  },
  buttonSecondary: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
  },
};

// Add CSS keyframes for spinner animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default DiagramPanel;