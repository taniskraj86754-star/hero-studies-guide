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
// Strictly CBSE class 1–12 syllabus & GK relevant. Avoid crime, gossip,
// entertainment, stock tips, betting, adult or political controversy content.
const CATEGORIES: { key: string; query: string }[] = [
  { key: "national", query: "CBSE class 1 to 12 current affairs India: NCERT syllabus related government schemes, new policies, constitutional amendments, important supreme court judgments, national awards" },
  { key: "international", query: "CBSE class 1 to 12 GK current affairs world: United Nations, G20, summits, treaties, India foreign relations, world geography updates" },
  { key: "business", query: "CBSE class 1 to 12 economics current affairs India: RBI announcements, Union Budget highlights, GDP, economic survey, banking schemes for students" },
  { key: "sports", query: "CBSE class 1 to 12 sports GK current affairs: Olympics, Asian Games, Commonwealth Games, World Cup winners, Khel Ratna, Arjuna awards, India sports achievements" },
  { key: "science", query: "CBSE class 1 to 12 science and technology current affairs: ISRO missions, space launches, scientific discoveries, environment, climate change, biodiversity" },
  { key: "exams", query: "CBSE class 1 to 12 static GK current affairs school exams: important days, books and authors, new appointments, national and international awards, summits" },
];

// Block titles that are clearly not school-exam appropriate.
const BLOCKLIST = /\b(murder|rape|sex|porn|nude|killed|suicide|betting|gambl|liquor|drug bust|arrest|affair|divorce|bollywood|kardashian|stock tip|cryptocurrency price|ipo grey market|box office|crime|molest|assault|terror attack|abuse)\b/i;

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
        .filter((r) => r.title && r.source_url && !BLOCKLIST.test(`${r.title} ${r.summary ?? ""}`));

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
