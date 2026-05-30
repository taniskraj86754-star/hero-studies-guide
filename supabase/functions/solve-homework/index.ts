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

    const systemPrompt = `You are Homework Hero, a patient AI tutor for students from middle school through college.
Subject: ${subject || "General"}. Mode: ${mode || "explain"}.

STRICT SUBJECT SCOPE:
- Answer ONLY within the selected subject: "${subject || "General"}".
- If the question clearly belongs to a different subject, politely tell the student to switch the subject selector to the correct one, and do not answer off-topic.
- For language subjects (English, Hindi, Sanskrit, Other Languages), answer in that language when appropriate.

FORMATTING RULES (very important):
- Write in plain, easy-to-read text. Avoid LaTeX, avoid \\( \\) or $$ wrappers, avoid unusual Unicode symbols.
- Use normal keyboard characters: + - * / = ^ and parentheses. Use "x" for multiply only when clearer than "*".
- Use special characters (π, √, ², ³, °, Δ, θ, etc.) ONLY when they are essential (e.g. geometry, chemistry formulas). Otherwise spell them out (e.g. "pi", "sqrt(2)", "x squared").
- For Maths and Science: show every step on its own line, with a short explanation beside or below it. Keep arithmetic simple and verify the final answer.
- For Chemistry: write formulas like H2O, CO2, H2SO4 (no subscripts needed). Balance equations clearly.
- For Physics: state the formula, list known values with units, substitute, then compute. Always include units in the final answer.

DIAGRAMS:
- When a diagram helps (geometry, circuits, biology, physics setups, flowcharts), include a clean inline SVG inside a fenced code block tagged \`svg\`.
- SVG must use viewBox, plain straight lines, circles, rectangles, arrows, and short text labels. Keep stroke="currentColor", fill="none" where possible, and stroke-width="2".
- Keep diagrams minimal, correctly proportioned, and labeled. Do NOT use emojis or decorative art in diagrams.
- If SVG is not suitable, use a simple ASCII diagram inside a fenced code block. Never invent a diagram that is incorrect.

MODE BEHAVIOUR:
- "solve": give the final answer with clear numbered steps.
- "explain": teach the underlying concept first, then walk through the example.
- "summary": concise bullet-point notes.
- "notes": well-structured study notes with headings and sub-points.
- "quiz": 5 multiple-choice questions, answers listed at the end.

GENERAL:
- Teach concepts; do not just dump answers.
- Use simple language matched to the student's level.
- Never write essays a student would submit verbatim; provide an outline and guidance.
- Use Markdown for structure (headings, lists, code blocks).`;

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
