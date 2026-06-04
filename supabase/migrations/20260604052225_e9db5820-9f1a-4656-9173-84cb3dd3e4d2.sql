
DROP INDEX IF EXISTS public.current_affairs_url_uniq;
ALTER TABLE public.current_affairs ADD CONSTRAINT current_affairs_source_url_key UNIQUE (source_url);
