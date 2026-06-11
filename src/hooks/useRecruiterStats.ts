import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RecruiterStat {
  user_id: string;
  full_name: string | null;
  role: string;
  total_jobs: number;
  open_jobs: number;
  on_hold_jobs: number;
  closed_jobs: number;
  closed_this_month: number;
  revenue_this_month: number;
  close_rate: number; // 0-100
}

function startOfMonthISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export function useRecruiterStats() {
  const [stats, setStats] = useState<RecruiterStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const monthStart = startOfMonthISO();
      const [profilesRes, rolesRes, jobsRes, invoicesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("jobs").select("created_by, status, updated_at"),
        supabase.from("invoices").select("created_by, total_amount, issue_date").gte("issue_date", monthStart.slice(0, 10)),
      ]);

      const profiles = profilesRes.data ?? [];
      const roles = rolesRes.data ?? [];
      const jobs = jobsRes.data ?? [];
      const invoices = invoicesRes.data ?? [];

      const result: RecruiterStat[] = profiles.map((p: any) => {
        const userJobs = jobs.filter((j: any) => j.created_by === p.user_id);
        const closed = userJobs.filter((j: any) => j.status === "closed");
        const closedThisMonth = closed.filter((j: any) => j.updated_at && j.updated_at >= monthStart).length;
        const revThisMonth = invoices
          .filter((i: any) => i.created_by === p.user_id)
          .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
        const role =
          roles.find((r: any) => r.user_id === p.user_id && r.role === "admin")?.role ??
          roles.find((r: any) => r.user_id === p.user_id)?.role ??
          "recruiter";
        return {
          user_id: p.user_id,
          full_name: p.full_name,
          role,
          total_jobs: userJobs.length,
          open_jobs: userJobs.filter((j: any) => j.status === "open").length,
          on_hold_jobs: userJobs.filter((j: any) => j.status === "on_hold").length,
          closed_jobs: closed.length,
          closed_this_month: closedThisMonth,
          revenue_this_month: revThisMonth,
          close_rate: userJobs.length ? Math.round((closed.length / userJobs.length) * 100) : 0,
        };
      });

      setStats(result.sort((a, b) => b.total_jobs - a.total_jobs));
      setLoading(false);
    })();
  }, []);

  return { stats, loading };
}