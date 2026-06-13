
-- 1) Notifications: remove permissive insert/update policies
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated can update notifications (mark read)" ON public.notifications;

-- Safe RPC to mark a notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.notifications
     SET read_by = (
       SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(read_by, '{}'::uuid[]) || auth.uid()))
     )
   WHERE id = _id;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;

-- 2) Storage policies for 'phrs' bucket — users access only their own folder
DROP POLICY IF EXISTS "phrs users read own" ON storage.objects;
DROP POLICY IF EXISTS "phrs users insert own" ON storage.objects;
DROP POLICY IF EXISTS "phrs users update own" ON storage.objects;
DROP POLICY IF EXISTS "phrs users delete own" ON storage.objects;
DROP POLICY IF EXISTS "phrs admins manage all" ON storage.objects;

CREATE POLICY "phrs users read own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'phrs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "phrs users insert own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'phrs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "phrs users update own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'phrs' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'phrs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "phrs users delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'phrs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "phrs admins manage all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'phrs' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'phrs' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Realtime channel authorization — restrict to authenticated on the notifications-feed topic
DROP POLICY IF EXISTS "Authenticated can read notifications feed" ON realtime.messages;

CREATE POLICY "Authenticated can read notifications feed" ON realtime.messages
  FOR SELECT TO authenticated
  USING (realtime.topic() = 'notifications-feed');
