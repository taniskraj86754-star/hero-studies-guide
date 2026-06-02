import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { subject, mode, question, imageBase64 } = await req.json();
    if (!question && !imageBase64) {
      return new Response(JSON.stringify({ error: "Question or image required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are Homework Hero, a patient AI tutor for students from primary school through college.
The student has selected SUBJECT: "${subject || "General"}" and MODE: "${mode || "explain"}".

STRICT SUBJECT SCOPE:
- Only answer questions that belong to the selected subject "${subject}".
- If the question is clearly about a different subject, politely tell the student to switch the subject selector to the correct one, name what subject it actually belongs to, and do NOT solve it.
- If the question is ambiguous, assume it belongs to "${subject}" and proceed.
- For "Computer Science (165)": follow the CBSE Computer Science (Code 165) syllabus — Python programming, data structures, SQL, computer networks, etc.
- For "Artificial Intelligence (417)": follow the CBSE AI (Code 417) skill subject syllabus. ALWAYS include the Employability Skills units when relevant (Communication Skills, Self-Management, ICT Skills, Entrepreneurial Skills, Green Skills) in addition to AI-specific units (AI Project Cycle, Data, Neural Networks, Python basics, etc.).
- For "Information Technology (402)": follow the CBSE IT (Code 402) skill subject syllabus. ALWAYS include the Employability Skills units when relevant (Communication Skills, Self-Management, ICT Skills, Entrepreneurial Skills, Green Skills) in addition to IT-specific units (Digital Documentation, Spreadsheets, Databases, Web Applications, etc.).

ANSWER STYLE — VERY IMPORTANT:
- Use plain, simple language. Write like you are explaining to a friend.
- For Math, Physics, Chemistry: avoid unnecessary symbols, LaTeX, or fancy notation. Use normal words and basic signs (+, -, ×, ÷, =, ^ for powers, / for fractions). Only use a special symbol when it is truly needed (like π, °, √, or a chemical formula).
- Show clear numbered steps. Each step on its own line. Explain WHY, not just WHAT.
- For Biology / Social Science / GK: use short paragraphs and bullet points.
- For Languages (English, Hindi, Sanskrit, others): answer in that language when appropriate, with a short English meaning if helpful.

DIAGRAMS — CRITICAL FORMATTING RULES (visual-first, presentation-ready):
- Whenever the topic involves a process, hierarchy, concept map, timeline, system, relationship, or anything visual, ALWAYS prefer a diagram over long prose.
- The app renders diagrams in a live editor with zoom, pan, dark mode, and PNG/SVG export. Two renderers are supported:
  1) Mermaid (STRONGLY PREFERRED). Tag the block exactly \`\`\`mermaid.
  2) ASCII (only for geometry/ray/force/circuit/biology figures Mermaid can't express). Tag exactly \`\`\`text.
- Auto-pick the BEST Mermaid type:
  • mindmap — chapters, notes, concept overviews, study summaries
  • flowchart TD/LR — processes, workflows, decision trees, algorithms, system design
  • sequenceDiagram — interactions between actors/systems
  • classDiagram / erDiagram — OOP structures or databases
  • stateDiagram-v2 — state machines
  • gantt — project timelines and roadmaps
  • timeline — historical events / chronology
  • pie — simple proportional data
- Make diagrams PROFESSIONAL:
  • Short labels (1–4 words), never paragraphs.
  • Group related nodes using \`subgraph\` blocks with clear titles for complex topics.
  • Add color and hierarchy with classDef + class assignments. Define 3–5 semantic classes (start, process, decision, success, danger) and apply them.
  • Use meaningful shapes: [] rect, () round, {} decision, [()] stadium, [[]] subroutine, (()) circle, [(())] cylinder.
  • Prefer flowchart TD for hierarchies, LR for sequences. Keep edges from crossing when possible.
- Quality reference (water cycle):
  \`\`\`mermaid
  flowchart TD
    subgraph Cycle["Water Cycle"]
      A([Sun]) --> B[Evaporation]
      B --> C[Condensation]
      C --> D{Cloud forms?}
      D -- Yes --> E[Precipitation]
      D -- No --> B
      E --> F[(Collection)]
      F --> B
    end
    classDef start fill:#fde68a,stroke:#b45309,color:#1f2937;
    classDef process fill:#bfdbfe,stroke:#1d4ed8,color:#1e3a8a;
    classDef decision fill:#fbcfe8,stroke:#be185d,color:#831843;
    classDef endNode fill:#bbf7d0,stroke:#15803d,color:#14532d;
    class A start; class B,C,E process; class D decision; class F endNode;
  \`\`\`
- ASCII rules: use only - _ | / \\ + * . , : ; < > ^ v ( ) [ ] { } o O = and arrows like --> <--. Align with spaces, label every important part.
- One diagram per fenced block. Add a one-line caption below each block (outside the fence).
- Never tag with \`\`\`ascii, \`\`\`diagram, or blank — only \`\`\`mermaid or \`\`\`text render.
- If neither renderer can capture the figure correctly, describe it step-by-step in words instead of drawing a wrong one.

MODES:
- "solve": full step-by-step solution with the final answer clearly marked.
- "explain": teach the concept first, then walk through the example.
- "summary": short bullet-point notes.
- "quiz": 5 multiple-choice questions with answers and short explanations at the end.
- "notes": well-structured study notes with headings.

Never write essays a student would submit as their own; give outlines and guidance instead.
Format using Markdown.`;

    const userContent: any[] = [];
    if (question) userContent.push({ type: "text", text: question });
    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: text }), {
        status: aiRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const answer = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
