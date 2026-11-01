import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Subject allowlist — mirrors the frontend SUBJECTS array. Prevents prompt
// injection via arbitrary text being interpolated into the system prompt.
const ALLOWED_SUBJECTS = new Set<string>([
  "General",
  // Primary (1–5)
  "Environmental Studies (EVS)",
  "General Knowledge",
  "Moral Science",
  // Core academics (6–12)
  "Mathematics",
  "Applied Mathematics",
  "Math",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Biotechnology",
  "Social Science",
  "History",
  "Geography",
  "Political Science",
  "Economics",
  "Sociology",
  "Psychology",
  "Philosophy",
  // Commerce
  "Accountancy",
  "Business Studies",
  "Entrepreneurship",
  "Legal Studies",
  // Computing & skill (CBSE codes)
  "Computer",
  "Computer Science",
  "Computer Science (083)",
  "Computer Science (165)",
  "Informatics Practices (065)",
  "Artificial Intelligence (417)",
  "Artificial Intelligence (417/843)",
  "Information Technology (402)",
  "Web Application (803)",
  "Data Science (844)",
  // Arts & life skills
  "Fine Arts",
  "Home Science",
  "Physical Education",
  "Engineering Graphics",
  // Languages
  "English", "Hindi", "Sanskrit", "Urdu", "Punjabi", "Tamil", "Telugu",
  "Bengali", "Marathi", "Gujarati", "Kannada", "Malayalam", "Odia",
  "Assamese", "French", "German", "Spanish", "Japanese",
]);
const ALLOWED_MODES = new Set(["solve", "explain", "summary", "quiz", "notes"]);
const MAX_QUESTION_LEN = 4000;

const MAX_IMAGE_B64_LEN = 7_000_000; // ~5 MB binary

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ---- AuthN ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // ---- Input validation ----
    const body = await req.json().catch(() => ({}));
    const { subject, mode, question, imageBase64 } = body ?? {};

    if (subject !== undefined && subject !== null && typeof subject !== "string") {
      return new Response(JSON.stringify({ error: "Invalid subject" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (subject && !ALLOWED_SUBJECTS.has(subject as string)) {
      return new Response(JSON.stringify({ error: "Invalid subject" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode && (typeof mode !== "string" || !ALLOWED_MODES.has(mode))) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (question !== undefined && question !== null && typeof question !== "string") {
      return new Response(JSON.stringify({ error: "Invalid question" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof question === "string" && question.length > MAX_QUESTION_LEN) {
      return new Response(JSON.stringify({ error: "Question too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (imageBase64 !== undefined && imageBase64 !== null && typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "Invalid image" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof imageBase64 === "string" && imageBase64.length > MAX_IMAGE_B64_LEN) {
      return new Response(JSON.stringify({ error: "Image too large" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!question && !imageBase64) {
      return new Response(JSON.stringify({ error: "Question or image required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeSubject = subject || "General";
    const safeMode = mode || "explain";

    const systemPrompt = `You are Homework Hero, a patient AI tutor for students from primary school through college.
The student has selected SUBJECT: "${safeSubject}" and MODE: "${safeMode}".

STRICT SUBJECT SCOPE:
- Only answer questions that belong to the selected subject "${safeSubject}".
- If the question is clearly about a different subject, politely tell the student to switch the subject selector to the correct one, name what subject it actually belongs to, and do NOT solve it.
- If the question is ambiguous, assume it belongs to "${safeSubject}" and proceed.
- For "Computer Science (165)": follow the CBSE Computer Science (Code 165) syllabus — Python programming, data structures, SQL, computer networks, etc.
- For "Artificial Intelligence (417)": follow the CBSE AI (Code 417) skill subject syllabus. ALWAYS include the Employability Skills units when relevant (Communication Skills, Self-Management, ICT Skills, Entrepreneurial Skills, Green Skills) in addition to AI-specific units (AI Project Cycle, Data, Neural Networks, Python basics, etc.).
- For "Information Technology (402)": follow the CBSE IT (Code 402) skill subject syllabus. ALWAYS include the Employability Skills units when relevant (Communication Skills, Self-Management, ICT Skills, Entrepreneurial Skills, Green Skills) in addition to IT-specific units (Digital Documentation, Spreadsheets, Databases, Web Applications, etc.).

NEW NCERT CLASS 9 SYLLABUS (session 2026-27, NCF-SE 2023 / NEP 2020) — VERY IMPORTANT:
- When the student's question is Class 9 level, always follow the NEW NCERT syllabus below. The old Class 9 books and chapter lists are WITHDRAWN — never map a Class 9 topic to Beehive, Moments, Mathematics, Science, India and the Contemporary World, Contemporary India, Democratic Politics, or Economics.
- Class 9 Mathematics: "Ganita Manjari" (Part 1 and Part 2). Part 1 — Ch 1 Orienting Yourself: The Use of Coordinates; Ch 2 Introduction to Linear Polynomials; Ch 3 The World of Numbers; Ch 4 Exploring Algebraic Identities; Ch 5 I'm Up and Down, and Round and Round; Ch 6 Measuring Space: Perimeter and Area; Ch 7 The Mathematics of Maybe: Introduction to Probability; Ch 8 Predicting What Comes Next: Exploring Sequences and Progressions. Part 2 — Ch 9 Propositions and their Converses; Ch 10 How Quantities Combine: Understanding Data; Ch 11 The World of Algorithms; Ch 12 Quadrilaterals; Ch 13 Two Variables, One Line; Ch 14 Math of Space: Surface Area and Volume. (An optional Advanced Level book covers Sets, Logarithms, Relations and Functions, Coordinate Geometry, Combinatorics, and more Progressions.)
- Class 9 Science: "Exploration" — Ch 1 Exploration: Entering the World of Secondary Science; Ch 2 Cell: The Building Block of Life; Ch 3 Tissues in Action; Ch 4 Describing Motion Around Us; Ch 5 Exploring Mixtures and their Separation; Ch 6 How Forces Affect Motion; Ch 7 Work, Energy, and Simple Machines; Ch 8 Journey Inside the Atom; Ch 9 Atomic Foundations of Matter; Ch 10 Sound Waves: Characteristics and Applications; Ch 11 Reproduction: How Life Continues; Ch 12 Patterns in Life: Diversity and Classification; Ch 13 Earth as a System: Energy, Matter, and Life.
- Class 9 Social Science: "Understanding Society: India and Beyond" — ONE integrated textbook (Part 1 and Part 2), NOT four separate History/Geography/Civics/Economics books. Part 1 — Ch 1 Understanding Social Science; Ch 2 Shaping of the Earth's Surface (Geography); Ch 3 Atmosphere and Climate (Geography); Ch 4 Early Humans and Beginning of Civilisation (History); Ch 5 State and Society up to 1000 CE (History); Ch 6 Democracy (Political Science); Ch 7 Elections (Political Science); Ch 8 Building Blocks in Economics: The Problem of Choice (Economics); Ch 9 The Price Puzzle: What Drives the Market (Economics).
- Class 9 Languages: English — "Kaveri" (one integrated book replacing Beehive and Moments); Hindi — "Ganga"; Sanskrit — "Sharada" and "Risikulya"; Urdu — "Jamuna".
- Class 9 other subjects: Physical Education & Well-being — "Khel Praveen"; Arts — "Madhurima"; Skill Education — "Kaushal Vikas"; ICT textbook is upcoming.
- When a student mentions a chapter by name or number from these books, teach exactly that chapter's content. If a question is clearly from the OLD syllabus, still answer it and gently mention it has moved or been reframed in the new books where you know.

ANSWER STYLE — VERY IMPORTANT:
- Use plain, simple language. Write like you are explaining to a friend.
- For Math, Physics, Chemistry: avoid unnecessary symbols, LaTeX, or fancy notation. Use normal words and basic signs (+, -, ×, ÷, =, ^ for powers, / for fractions). Only use a special symbol when it is truly needed (like π, °, √, or a chemical formula).
- Show clear numbered steps. Each step on its own line. Explain WHY, not just WHAT.
- For Biology / Social Science / GK: use short paragraphs and bullet points.
- For Languages (English, Hindi, Sanskrit, others): answer in that language when appropriate, with a short English meaning if helpful.

DIAGRAMS — YOU ARE ALSO AN EXPERT DIAGRAM DESIGNER:
- Whenever the user asks for an explanation, process, workflow, mind map, system design, roadmap, study notes, project structure, hierarchy, timeline, database, or interaction — generate a professional VISUAL DIAGRAM, not plain text.
- Automatically pick the BEST Mermaid diagram type:
  * mindmap → chapters, notes, concepts, brainstorming
  * flowchart TD / LR → processes, workflows, algorithms, decisions, org charts
  * sequenceDiagram → interactions between actors/systems
  * erDiagram → database schemas
  * classDiagram → OOP, data models
  * stateDiagram-v2 → state machines, lifecycles
  * gantt → project timelines
  * pie → proportions
- Make diagrams CLEAN, MODERN, presentation-ready:
  * Short labels (2-4 words). Never long paragraphs in nodes.
  * Use subgraphs to group related concepts when complex.
  * Apply styling with classDef for color groups, e.g. classDef key fill:#fde68a,stroke:#f59e0b,color:#111
  * Use emoji icons sparingly when they aid clarity (e.g. "📘 Theory", "⚙️ Process").
  * Logical hierarchy, consistent direction, generous spacing.
- The app renders Mermaid in a live editor with zoom, pan, PNG/SVG export, dark mode, and source view — so prefer Mermaid in a \`\`\`mermaid block whenever possible.
- Use ASCII in a \`\`\`text block ONLY for geometry/ray/circuit/biology figures Mermaid can't express. ASCII rules: only - _ | / \\ + * . , : ; < > ^ v ( ) [ ] { } o O = and arrows --> <--, align with spaces.
- One diagram per code block. Add a one-line caption below each block (outside the fence).
- Never tag a diagram with \`\`\`ascii, \`\`\`diagram, or leave the tag blank — only \`\`\`mermaid or \`\`\`text are rendered.
- Example mindmap:
  \`\`\`mermaid
  mindmap
    root((Photosynthesis))
      Inputs
        Sunlight
        Water
        CO2
      Process
        Light Reactions
        Calvin Cycle
      Outputs
        Glucose
        Oxygen
  \`\`\`

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
      console.error("AI API error", aiRes.status, text);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const answer = data?.choices?.[0]?.message?.content ?? "";

    // ---- Server-side XP award (+10 per successful answer) ----
    let newXp: number | null = null;
    try {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: prof } = await admin
        .from("profiles").select("xp").eq("id", userId).maybeSingle();
      const current = (prof?.xp as number | undefined) ?? 0;
      newXp = current + 10;
      await admin.from("profiles").update({ xp: newXp }).eq("id", userId);
    } catch (xpErr) {
      console.error("XP award failed", xpErr);
    }

    return new Response(JSON.stringify({ answer, xp: newXp }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("solve-homework error", e);
    return new Response(JSON.stringify({ error: "Internal error. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
