
-- recruiter_targets
CREATE TABLE public.recruiter_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month date NOT NULL,
  target_jobs int NOT NULL DEFAULT 0,
  target_revenue numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recruiter_targets TO authenticated;
GRANT ALL ON public.recruiter_targets TO service_role;

ALTER TABLE public.recruiter_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view recruiter targets"
  ON public.recruiter_targets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage recruiter targets"
  ON public.recruiter_targets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_recruiter_targets_updated_at
BEFORE UPDATE ON public.recruiter_targets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  entity_table text,
  entity_id uuid,
  actor_id uuid,
  read_by uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view notifications"
  ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update notifications (mark read)"
  ON public.notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Activity logging trigger
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_label text;
  v_id uuid;
  v_action text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated';
    v_id := NEW.id;
  ELSE
    v_action := 'deleted';
    v_id := OLD.id;
  END IF;

  v_label := CASE TG_TABLE_NAME
    WHEN 'jobs' THEN 'Job'
    WHEN 'candidates' THEN 'Candidate'
    WHEN 'applications' THEN 'Application'
    WHEN 'interviews' THEN 'Interview'
    WHEN 'clients' THEN 'Client'
    WHEN 'invoices' THEN 'Invoice'
    WHEN 'offer_letters' THEN 'Offer letter'
    ELSE TG_TABLE_NAME
  END;

  INSERT INTO public.notifications (type, title, message, entity_table, entity_id, actor_id)
  VALUES (
    TG_TABLE_NAME || '.' || v_action,
    v_label || ' ' || v_action,
    NULL,
    TG_TABLE_NAME,
    v_id,
    v_actor
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_activity() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['jobs','candidates','applications','interviews','clients','invoices','offer_letters'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_log_activity ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_log_activity AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_activity()', t);
  END LOOP;
END $$;
