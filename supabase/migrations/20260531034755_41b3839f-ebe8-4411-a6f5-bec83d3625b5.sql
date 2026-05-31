CREATE OR REPLACE FUNCTION public.get_total_questions()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint FROM public.homework_sessions;
$$;

GRANT EXECUTE ON FUNCTION public.get_total_questions() TO anon, authenticated;