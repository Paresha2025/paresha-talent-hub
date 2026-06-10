REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

DROP POLICY IF EXISTS "Authenticated can update applications" ON public.applications;
CREATE POLICY "Owner or admin can update applications"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = created_by) OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK ((auth.uid() = created_by) OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authenticated can update interviews" ON public.interviews;
CREATE POLICY "Owner or admin can update interviews"
  ON public.interviews
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = created_by) OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK ((auth.uid() = created_by) OR public.has_role(auth.uid(), 'admin'::public.app_role));