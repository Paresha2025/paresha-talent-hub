import { Briefcase, Users, CalendarCheck, CheckCircle2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { chartData, candidates, jobs, interviews } from "@/data/mockData";

const stats = [
  { label: "Active Jobs", value: jobs.filter(j => j.status === 'Open').length, icon: Briefcase, gradient: "from-info/20 to-info/5", iconBg: "bg-info/15", iconColor: "text-info", border: "border-info/20" },
  { label: "Total Candidates", value: candidates.length, icon: Users, gradient: "from-accent/20 to-accent/5", iconBg: "bg-accent/15", iconColor: "text-accent", border: "border-accent/20" },
  { label: "Interviews", value: interviews.filter(i => i.status === 'Scheduled').length, icon: CalendarCheck, gradient: "from-warning/20 to-warning/5", iconBg: "bg-warning/15", iconColor: "text-warning", border: "border-warning/20" },
  { label: "Offers Made", value: candidates.filter(c => c.stage === 'Selected').length, icon: CheckCircle2, gradient: "from-success/20 to-success/5", iconBg: "bg-success/15", iconColor: "text-success", border: "border-success/20" },
  { label: "Hired (MTD)", value: 7, icon: TrendingUp, gradient: "from-primary/20 to-primary/5", iconBg: "bg-primary/15", iconColor: "text-primary", border: "border-primary/20" },
];

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

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's your recruitment overview.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`relative overflow-hidden rounded-xl border ${s.border} bg-gradient-to-br ${s.gradient} p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${s.iconBg} mb-3`}>
              <s.icon className={`h-5 w-5 ${s.iconColor}`} />
            </div>
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="text-muted-foreground text-xs mt-1 font-medium">{s.label}</p>
            <div className="absolute -right-3 -bottom-3 opacity-[0.07]">
              <s.icon className="h-20 w-20" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Candidates per Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData.candidatesPerStage}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="stage"
                  animationBegin={0}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  cornerRadius={4}
                >
                  {chartData.candidatesPerStage.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {chartData.candidatesPerStage.map((item, i) => (
                <div key={item.stage} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  {item.stage}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Closures</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.monthlyClosures}>
                <defs>
                  <linearGradient id="closureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="closures"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2.5}
                  fill="url(#closureGrad)"
                  dot={{ fill: 'hsl(var(--accent))', r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                  animationBegin={0}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 overflow-hidden border-0 shadow-md bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recruiter Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData.recruiterPerformance} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="submissions" fill="hsl(var(--info))" radius={[6, 6, 0, 0]} animationBegin={0} animationDuration={1200} />
                <Bar dataKey="interviews" fill="hsl(var(--warning))" radius={[6, 6, 0, 0]} animationBegin={200} animationDuration={1200} />
                <Bar dataKey="hires" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} animationBegin={400} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-6 justify-center mt-2">
              {[{ label: 'Submissions', color: 'hsl(var(--info))' }, { label: 'Interviews', color: 'hsl(var(--warning))' }, { label: 'Hires', color: 'hsl(var(--accent))' }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
