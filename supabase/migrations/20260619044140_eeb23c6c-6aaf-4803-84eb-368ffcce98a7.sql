
CREATE TYPE public.call_status AS ENUM ('rnr','call_done','follow_up','screened','not_suitable','not_interested');

ALTER TABLE public.candidates
  ADD COLUMN location text,
  ADD COLUMN salary text,
  ADD COLUMN notice_period text,
  ADD COLUMN client_designation text,
  ADD COLUMN call_status public.call_status;
