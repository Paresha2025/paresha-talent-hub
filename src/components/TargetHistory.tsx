import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, IndianRupee } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const CLOSED_POSITION_VALUE = 50000;
const MONTHS = 12;

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

interface Row { month: string; target: number; achieved: number; }

export function TargetHistory() {
  const [companyRows, setCompanyRows] = useState<Row[]>([]);
  const [recruiters, setRecruiters] = useState<{ user_id: string; name: string }[]>([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>("");
  const [recRows, setRecRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const monthKeys = useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    for (let i = MONTHS - 1; i >= 0; i--) {
      keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
    }
    return keys;
  }, []);

  useEffect(() => {
    (async () => {
      const start = new Date();
      start.setMonth(start.getMonth() - (MONTHS - 1));
      start.setDate(1);
      const startIso = start.toISOString();

      const [targetsRes, appsRes, profilesRes, recTargetsRes, jobsRes, invoicesRes] = await Promise.all([
        supabase.from("monthly_targets").select("month, target_amount"),
        supabase.from("applications").select("updated_at").eq("stage", "selected").gte("updated_at", startIso),
        supabase.from("profiles").select("user_id, full_name"),
        supabase.from("recruiter_targets").select("user_id, month, target_jobs, target_revenue"),
        supabase.from("jobs").select("created_by, status, updated_at").eq("status", "closed").gte("updated_at", startIso),
        supabase.from("invoices").select("created_by, total_amount, issue_date").gte("issue_date", startIso.slice(0, 10)),
      ]);

      // Company target vs achieved
      const tMap = new Map<string, number>();
      (targetsRes.data ?? []).forEach((t: any) => {
        const d = new Date(t.month);
        tMap.set(monthKey(d), Number(t.target_amount));
      });
      const achievedMap = new Map<string, number>();
      (appsRes.data ?? []).forEach((a: any) => {
        const k = monthKey(new Date(a.updated_at));
        achievedMap.set(k, (achievedMap.get(k) ?? 0) + CLOSED_POSITION_VALUE);
      });
      setCompanyRows(monthKeys.map((k) => ({
        month: monthLabel(k),
        target: tMap.get(k) ?? 0,
        achieved: achievedMap.get(k) ?? 0,
      })));

      // Recruiters list
      const profs = profilesRes.data ?? [];
      setRecruiters(profs.map((p: any) => ({ user_id: p.user_id, name: p.full_name || "Unnamed" })));
      if (profs.length && !selectedRecruiter) setSelectedRecruiter(profs[0].user_id);

      // Stash raw recruiter data on window for selector
      (window as any).__recHist = {
        recTargets: recTargetsRes.data ?? [],
        jobs: jobsRes.data ?? [],
        invoices: invoicesRes.data ?? [],
      };
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedRecruiter) return;
    const data = (window as any).__recHist;
    if (!data) return;
    const tMap = new Map<string, { jobs: number; revenue: number }>();
    (data.recTargets as any[]).filter((r) => r.user_id === selectedRecruiter).forEach((r) => {
      tMap.set(monthKey(new Date(r.month)), { jobs: r.target_jobs, revenue: Number(r.target_revenue) });
    });
    const aJobs = new Map<string, number>();
    (data.jobs as any[]).filter((j) => j.created_by === selectedRecruiter).forEach((j) => {
      const k = monthKey(new Date(j.updated_at));
      aJobs.set(k, (aJobs.get(k) ?? 0) + 1);
    });
    const aRev = new Map<string, number>();
    (data.invoices as any[]).filter((i) => i.created_by === selectedRecruiter).forEach((i) => {
      const k = monthKey(new Date(i.issue_date));
      aRev.set(k, (aRev.get(k) ?? 0) + Number(i.total_amount || 0));
    });
    setRecRows(monthKeys.map((k) => ({
      month: monthLabel(k),
      target: tMap.get(k)?.revenue ?? 0,
      achieved: aRev.get(k) ?? 0,
      // also expose job counts via extra fields
      ...({ targetJobs: tMap.get(k)?.jobs ?? 0, closedJobs: aJobs.get(k) ?? 0 } as any),
    })));
  }, [selectedRecruiter, monthKeys]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <History className="h-5 w-5 text-accent" /> Target History (Last 12 Months)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4 text-muted-foreground" /> Company — Target vs Achieved
          </h3>
          {loading ? (
            <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={companyRows}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                <Tooltip formatter={(v: number) => `₹${Number(v).toLocaleString("en-IN")}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="target" name="Target" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="achieved" name="Achieved" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
            <h3 className="text-sm font-semibold">Recruiter — Target vs Achieved</h3>
            <Select value={selectedRecruiter} onValueChange={setSelectedRecruiter}>
              <SelectTrigger className="h-8 text-xs w-48"><SelectValue placeholder="Select recruiter" /></SelectTrigger>
              <SelectContent>
                {recruiters.map((r) => (
                  <SelectItem key={r.user_id} value={r.user_id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {recRows.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={recRows}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                <Tooltip formatter={(v: number, n: string) => n.includes("Jobs") ? v : `₹${Number(v).toLocaleString("en-IN")}`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="target" name="Revenue Target" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="achieved" name="Revenue Achieved" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}