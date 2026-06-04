
CREATE TABLE public.current_affairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  summary text,
  source_url text,
  source text,
  published_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX current_affairs_url_uniq ON public.current_affairs (source_url) WHERE source_url IS NOT NULL;
CREATE INDEX current_affairs_cat_time ON public.current_affairs (category, published_at DESC NULLS LAST, fetched_at DESC);

GRANT SELECT ON public.current_affairs TO authenticated;
GRANT ALL ON public.current_affairs TO service_role;

ALTER TABLE public.current_affairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read current affairs"
ON public.current_affairs FOR SELECT TO authenticated USING (true);

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
