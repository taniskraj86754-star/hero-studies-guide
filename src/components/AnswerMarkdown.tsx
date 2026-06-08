import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AnswerMarkdownProps {
  content: string;
}

// Renders the assistant answer as Markdown, hiding diagram/code blocks that
// should be shown in their own panels so they don't appear twice.
const isDiagramBlock = (lang?: string, code?: string) => {
  const l = (lang || "").toLowerCase();
  if (l === "mermaid") return true;
  if (["text", "diagram", "ascii", "txt", ""].includes(l)) {
    const c = code || "";
    return /[-|+/\\<>*]/.test(c) && c.includes("\n");
  }
  return false;
};

const AnswerMarkdown = ({ content }: AnswerMarkdownProps) => (
  <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted prose-pre:text-foreground prose-code:before:hidden prose-code:after:hidden">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          const lang = match?.[1];
          const text = String(children).replace(/\n$/, "");
          const inline = !className;
          if (!inline && isDiagramBlock(lang, text)) return null;
          if (inline) {
            return (
              <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[0.85em]" {...props}>
                {children}
              </code>
            );
          }
          return (
            <pre className="rounded-xl overflow-x-auto p-4 bg-muted text-sm">
              <code className={className} {...props}>
                {text}
              </code>
            </pre>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

export default AnswerMarkdown;
