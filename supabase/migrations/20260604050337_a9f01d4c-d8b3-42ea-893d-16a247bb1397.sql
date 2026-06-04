CREATE OR REPLACE FUNCTION public.prevent_xp_client_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.xp IS DISTINCT FROM OLD.xp
     AND current_setting('request.jwt.claim.role', true) <> 'service_role' THEN
    NEW.xp := OLD.xp;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_xp_client_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_prevent_xp_client_update ON public.profiles;
CREATE TRIGGER profiles_prevent_xp_client_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_xp_client_update();