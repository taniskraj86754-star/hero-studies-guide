import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Newspaper, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Item {
  id: string;
  category: string;
  title: string;
  summary: string | null;
  source_url: string | null;
  source: string | null;
  published_at: string | null;
  fetched_at: string;
}

const CATS = [
  { key: "national", label: "India" },
  { key: "international", label: "World" },
  { key: "business", label: "Business" },
  { key: "sports", label: "Sports" },
  { key: "science", label: "Sci/Tech" },
  { key: "exams", label: "Exams" },
];

export default function CurrentAffairs() {
  const [cat, setCat] = useState("national");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (category: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("current_affairs")
      .select("*")
      .eq("category", category)
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("fetched_at", { ascending: false })
      .limit(20);
    setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(cat); }, [cat]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke("update-current-affairs", { body: {} });
      if (error) throw error;
      toast.success("News updated");
      await load(cat);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="bg-card rounded-[2rem] border border-border shadow-card p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold">Current Affairs</h2>
            <p className="text-xs text-muted-foreground">Auto-updated every 4 hours</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </Button>
      </div>

      <Tabs value={cat} onValueChange={setCat}>
        <TabsList className="rounded-xl flex-wrap h-auto">
          {CATS.map((c) => (
            <TabsTrigger key={c.key} value={c.key} className="rounded-lg">{c.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No news yet. Tap Refresh to fetch the latest.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => {
            const safeUrl = it.source_url && /^https?:\/\//i.test(it.source_url) ? it.source_url : "#";
            return (
            <li key={it.id} className="rounded-2xl border border-border p-4 hover:border-primary/40 transition-smooth">
              <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="block">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-sm leading-snug">{it.title}</h3>
                  <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                </div>
                {it.summary && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{it.summary}</p>}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  {it.source && <span className="font-medium text-primary">{it.source}</span>}
                  <span>· {formatDistanceToNow(new Date(it.published_at ?? it.fetched_at), { addSuffix: true })}</span>
                </div>
              </a>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
