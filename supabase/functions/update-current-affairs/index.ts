import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function isSafeHttpUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const p = new URL(url).protocol;
    return p === "http:" || p === "https:";
  } catch {
    return false;
  }
}

// CBSE / school-exam focused queries only. Avoid celebrity gossip, crime,
// entertainment, and routine politics — focus on what shows up in CBSE
// social science, science, GK, and school competitive exam papers.
// Strictly CBSE GK / current-affairs for class 1–12 students. Each query
// explicitly mentions CBSE GK exam relevance to bias Firecrawl toward
// study-portal style sources (Jagran Josh, BYJU's, Adda247, GKToday, etc.).
const CATEGORIES: { key: string; query: string }[] = [
  { key: "national", query: "CBSE GK current affairs class 1 to 12 students India: government schemes, policies, constitutional amendments, supreme court judgments, important appointments" },
  { key: "international", query: "CBSE GK current affairs class 1 to 12 students international: United Nations, G20, summits, treaties, India foreign relations, world organizations" },
  { key: "business", query: "CBSE GK current affairs class 1 to 12 Indian economy: RBI, union budget, GDP, banking, economic survey, important indices, NITI Aayog" },
  { key: "sports", query: "CBSE GK current affairs class 1 to 12 sports: Olympics, Asian Games, Commonwealth Games, World Cup winners, Khel Ratna, Arjuna Award, India sports achievements" },
  { key: "science", query: "CBSE GK current affairs class 1 to 12 science and technology: ISRO missions Chandrayaan Aditya, space launches, scientific discoveries, environment, climate, Nobel Prize science" },
  { key: "exams", query: "CBSE GK current affairs for class 1 to 12 school exams: awards and honours, books and authors, important days, summits and conferences, appointments, Nobel Prize, Padma awards" },
];

// Domains that consistently publish CBSE/school-exam-oriented GK and current
// affairs digests. Items from these domains are prioritised.
const EXAM_DOMAINS = [
  "jagranjosh.com", "byjus.com", "adda247.com", "gktoday.in", "testbook.com",
  "vedantu.com", "toppr.com", "studyiq.com", "drishtiias.com", "ncert.nic.in",
  "cbse.gov.in", "currentaffairs.adda247.com", "unacademy.com", "embibe.com",
  "successcds.net", "indiabix.com", "careerpower.in", "oliveboard.in",
];

// Block obviously non-exam topics (entertainment, crime, gossip, lifestyle).
const BLOCK_PATTERN = /\b(bollywood|hollywood|celebrity|gossip|movie review|box office|murder|rape|assault|sex|dating|fashion week|recipe|horoscope|astrology|viral video|tiktok|instagram reel|trailer|teaser|song release|web series|netflix|amazon prime|ipl auction gossip|wedding|divorce|affair)\b/i;

// Positive signal: topics that genuinely appear in CBSE/school GK papers.
const EXAM_PATTERN = /\b(award|honour|honor|appointed|appointment|launch(?:ed)?|scheme|policy|bill|act\b|amendment|summit|conference|treaty|agreement|mission|satellite|ISRO|DRDO|RBI|budget|GDP|index|ranking|Nobel|Padma|Bharat Ratna|Khel Ratna|Arjuna|Olympic|Asian Games|Commonwealth|World Cup|UNESCO|UN |G20|G7|BRICS|book\b|author|day\b|anniversary|inaugurat|MoU|constitution|supreme court|parliament|election commission)\b/i;

async function searchCategory(query: string) {
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit: 8, tbs: "qdr:d" }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Firecrawl search failed", res.status, text);
    return [];
  }
  const data = await res.json();
  // v2 returns { success, data: { web: [...] } } or { data: [...] } depending on version
  const items = data?.data?.web ?? data?.data ?? data?.web ?? [];
  return Array.isArray(items) ? items : [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // Require an authenticated user — prevents anonymous abuse of the paid Firecrawl API.
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

    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let inserted = 0;

    for (const cat of CATEGORIES) {
      const items = await searchCategory(cat.query);
      const rows = items
        .map((r: any) => ({
          category: cat.key,
          title: (r.title ?? "").toString().slice(0, 300),
          summary: (r.description ?? r.snippet ?? "").toString().slice(0, 600),
          source_url: isSafeHttpUrl(r.url) ? r.url : null,
          source: (() => {
            try { return isSafeHttpUrl(r.url) ? new URL(r.url).hostname.replace(/^www\./, "") : null; }
            catch { return null; }
          })(),
          published_at: r.publishedDate ?? r.published_date ?? null,
        }))
        .filter((r) => {
          if (!r.title || !r.source_url) return false;
          const text = `${r.title} ${r.summary ?? ""}`;
          if (BLOCK_PATTERN.test(text)) return false;
          const isExamDomain = r.source ? EXAM_DOMAINS.some((d) => r.source!.endsWith(d)) : false;
          // Keep only if from an exam-prep domain OR text matches exam-relevant pattern
          return isExamDomain || EXAM_PATTERN.test(text);
        });

      if (rows.length === 0) continue;
      const { error, count } = await admin
        .from("current_affairs")
        .upsert(rows, { onConflict: "source_url", ignoreDuplicates: true, count: "exact" });
      if (error) console.error("Upsert error", cat.key, error.message);
      else inserted += count ?? rows.length;
    }

    // Retention: keep last 30 days
    await admin.from("current_affairs").delete().lt("fetched_at", new Date(Date.now() - 30 * 86400_000).toISOString());

    return new Response(JSON.stringify({ ok: true, inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("update-current-affairs error", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
