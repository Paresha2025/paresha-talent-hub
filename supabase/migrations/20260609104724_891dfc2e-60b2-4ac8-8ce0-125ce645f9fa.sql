
-- ============ CLIENTS ============
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  gstin TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "owner update clients" ON public.clients FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "owner delete clients" ON public.clients FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ INVOICES ============
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 18,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "owner update invoices" ON public.invoices FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "owner delete invoices" ON public.invoices FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ OFFER LETTERS ============
CREATE TYPE public.offer_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'withdrawn');

CREATE TABLE public.offer_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  salary TEXT NOT NULL,
  joining_date DATE,
  body TEXT NOT NULL,
  status public.offer_status NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  sent_to_email TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_letters TO authenticated;
GRANT ALL ON public.offer_letters TO service_role;
ALTER TABLE public.offer_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read offers" ON public.offer_letters FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert offers" ON public.offer_letters FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "owner update offers" ON public.offer_letters FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "owner delete offers" ON public.offer_letters FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE TRIGGER trg_offers_updated BEFORE UPDATE ON public.offer_letters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
