import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Users, CalendarCheck, CheckCircle2, TrendingUp, Target, IndianRupee, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { APPLICATION_STAGES, stageLabel } from "@/lib/atsConstants";

const CLOSED_POSITION_VALUE = 50000;
const COLORS = ['hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--accent))', 'hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--destructive))'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg">
      {label && <p className="text-xs font-medium text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

function formatCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ activeJobs: 0, candidates: 0, scheduledInterviews: 0, selected: 0, hiredMtd: 0 });
  const [stagesData, setStagesData] = useState<{ stage: string; count: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; closures: number }[]>([]);
  const [monthlyTarget, setMonthlyTarget] = useState(0);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    setLoading(true);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const [jobsRes, candRes, intRes, appsRes, hiredMtdRes, recentAppsRes, targetRes] = await Promise.all([
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("candidates").select("id", { count: "exact", head: true }),
      supabase.from("interviews").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
      supabase.from("applications").select("stage"),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("stage", "selected").gte("updated_at", monthStart),
      supabase.from("applications").select("stage, updated_at").eq("stage", "selected").gte("updated_at", sixMonthsAgo.toISOString()),
      supabase.from("monthly_targets").select("target_amount").eq("month", monthStr).maybeSingle(),
    ]);

    setCounts({
      activeJobs: jobsRes.count ?? 0,
      candidates: candRes.count ?? 0,
      scheduledInterviews: intRes.count ?? 0,
      selected: (appsRes.data ?? []).filter((a) => a.stage === "selected").length,
      hiredMtd: hiredMtdRes.count ?? 0,
    });

    // Stage breakdown
    const stageMap = new Map<string, number>();
    APPLICATION_STAGES.forEach((s) => stageMap.set(s, 0));
    (appsRes.data ?? []).forEach((a) => stageMap.set(a.stage, (stageMap.get(a.stage) ?? 0) + 1));
    setStagesData(APPLICATION_STAGES.map((s) => ({ stage: stageLabel[s], count: stageMap.get(s) ?? 0 })));

    // Monthly closures (last 6 months)
    const monthly = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthly.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
    }
    (recentAppsRes.data ?? []).forEach((a) => {
      const d = new Date(a.updated_at);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (monthly.has(k)) monthly.set(k, (monthly.get(k) ?? 0) + 1);
    });
    setMonthlyData(Array.from(monthly.entries()).map(([k, v]) => {
      const [, m] = k.split("-").map(Number);
      return { month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m], closures: v };
    }));

    setMonthlyTarget(Number(targetRes.data?.target_amount ?? 0));
    setLoading(false);
  }

  const stats = useMemo(() => [
    { label: "Active Jobs", value: counts.activeJobs, icon: Briefcase, gradient: "from-info/20 to-info/5", iconBg: "bg-info/15", iconColor: "text-info", border: "border-info/20" },
    { label: "Total Candidates", value: counts.candidates, icon: Users, gradient: "from-accent/20 to-accent/5", iconBg: "bg-accent/15", iconColor: "text-accent", border: "border-accent/20" },
    { label: "Interviews", value: counts.scheduledInterviews, icon: CalendarCheck, gradient: "from-warning/20 to-warning/5", iconBg: "bg-warning/15", iconColor: "text-warning", border: "border-warning/20" },
    { label: "Offers Made", value: counts.selected, icon: CheckCircle2, gradient: "from-success/20 to-success/5", iconBg: "bg-success/15", iconColor: "text-success", border: "border-success/20" },
    { label: "Hired (MTD)", value: counts.hiredMtd, icon: TrendingUp, gradient: "from-primary/20 to-primary/5", iconBg: "bg-primary/15", iconColor: "text-primary", border: "border-primary/20" },
  ], [counts]);

  const achieved = counts.hiredMtd * CLOSED_POSITION_VALUE;
  const remaining = Math.max(0, monthlyTarget - achieved);
  const progress = monthlyTarget > 0 ? Math.min(100, (achieved / monthlyTarget) * 100) : 0;

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's your recruitment overview.</p>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-accent/30 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-4 min-w-[240px] shadow-md">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-accent/15">
              <Target className="h-4 w-4 text-accent" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Monthly Target</span>
          </div>
          {monthlyTarget === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No target set for this month. Admin can set one in Admin Panel.</p>
          ) : (
            <>
              <p className="text-xl font-bold tracking-tight">{formatCurrency(monthlyTarget)}</p>
              <Progress value={progress} className="h-2 mt-2 bg-accent/10" />
              <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                <span>Achieved: <span className="font-semibold text-accent">{formatCurrency(achieved)}</span></span>
                <span>Remaining: <span className="font-semibold text-warning">{formatCurrency(remaining)}</span></span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {counts.hiredMtd} hire{counts.hiredMtd !== 1 ? "s" : ""} × {formatCurrency(CLOSED_POSITION_VALUE)}/hire
              </p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`relative overflow-hidden rounded-xl border ${s.border} bg-gradient-to-br ${s.gradient} p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}>
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${s.iconBg} mb-3`}>
              <s.icon className={`h-5 w-5 ${s.iconColor}`} />
            </div>
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="text-muted-foreground text-xs mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden border-0 shadow-md">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Candidates per Stage</CardTitle></CardHeader>
          <CardContent>
            {stagesData.every((s) => s.count === 0) ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No applications yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stagesData.filter((s) => s.count > 0)} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={4} dataKey="count" nameKey="stage" cornerRadius={4}>
                    {stagesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-md">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Monthly Closures (Last 6 Months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="closureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="closures" stroke="hsl(var(--accent))" strokeWidth={2.5} fill="url(#closureGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
