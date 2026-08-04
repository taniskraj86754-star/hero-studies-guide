import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const MAX_PROMPT_LEN = 600;

const STYLES: Record<string, string> = {
  textbook:
    "clean NCERT-style school textbook diagram, crisp black outlines on a pure white background, flat minimal colour fills, clear straight leader lines with tidy printed labels",
  blackboard:
    "chalkboard style educational diagram, white and pastel chalk lines on a dark slate green board, hand-drawn but neat, clearly readable labels",
  labeled3d:
    "semi-realistic 3D educational illustration with soft shading, accurate proportions, clear labels with thin pointer lines, white background",
  flow: "minimal flowchart / process diagram with rounded boxes, arrows showing direction, short labels inside each box, generous white space",
};

const RATIOS: Record<string, string> = {
  "4:3": "1024x768",
  "1:1": "1024x1024",
  "16:9": "1280x720",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Image generation is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const rawPrompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!rawPrompt) {
      return new Response(JSON.stringify({ error: "Describe the diagram you want" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const prompt = rawPrompt.slice(0, MAX_PROMPT_LEN);
    const style = STYLES[body.style as string] ?? STYLES.textbook;
    const size = RATIOS[body.ratio as string] ?? RATIOS["4:3"];
    const subject = typeof body.subject === "string" ? body.subject.slice(0, 80) : "";

    const fullPrompt = [
      `Create an educational diagram for a CBSE school student${subject ? ` studying ${subject}` : ""}.`,
      `Topic: ${prompt}.`,
      `Style: ${style}.`,
      "Requirements: scientifically and factually correct, no invented parts, no watermark, no extra decoration.",
      "All text must be spelled correctly in English, large enough to read, and placed outside the shapes it labels.",
      "Use clear geometric lines, arrows and shapes; keep the composition centred with margins.",
    ].join(" ");

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
        size,
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const status = upstream.status === 429 ? 429 : 502;
      const message =
        upstream.status === 429
          ? "Too many diagram requests right now — please try again in a moment."
          : "Diagram generation failed. Please try again.";
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Unexpected error generating diagram" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
