import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// CBSE / school-exam focused queries only. Avoid celebrity gossip, crime,
// entertainment, and routine politics — focus on what shows up in CBSE
// social science, science, GK, and school competitive exam papers.
const CATEGORIES: { key: string; query: string }[] = [
  { key: "national", query: "India current affairs for CBSE school exams: government schemes, policies, constitutional amendments, supreme court judgments" },
  { key: "international", query: "international current affairs for CBSE school exams: United Nations, summits, treaties, global organizations, India foreign relations" },
  { key: "business", query: "Indian economy current affairs for school exams: RBI, budget, GDP, banking, economic survey, important indices" },
  { key: "sports", query: "major sports current affairs for school GK exams: Olympics, Asian Games, World Cup winners, Khel Ratna awards, India sports achievements" },
  { key: "science", query: "science and technology current affairs for CBSE school exams: ISRO missions, space launches, scientific discoveries, environment, climate" },
  { key: "exams", query: "static GK and current affairs important for CBSE class 9 10 11 12 board exams and school olympiads: awards, books, appointments, days, summits" },
];

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
          source_url: r.url ?? null,
          source: (() => {
            try { return r.url ? new URL(r.url).hostname.replace(/^www\./, "") : null; }
            catch { return null; }
          })(),
          published_at: r.publishedDate ?? r.published_date ?? null,
        }))
        .filter((r) => r.title && r.source_url);

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
