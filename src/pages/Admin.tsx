import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Target, FolderPlus, Trash2, Plus, ShieldCheck, IndianRupee, Users, Crown, UserMinus } from "lucide-react";
import { Briefcase, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useRecruiterStats } from "@/hooks/useRecruiterStats";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TargetHistory } from "@/components/TargetHistory";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface MonthlyTarget {
  id: string;
  month: string;
  target_amount: number;
}

interface UserRow {
  user_id: string;
  full_name: string | null;
  roles: string[];
}

interface RecruiterTarget {
  id: string;
  user_id: string;
  month: string;
  target_jobs: number;
  target_revenue: number;
  full_name?: string | null;
}

export default function Admin() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { stats: recruiterStats } = useRecruiterStats();
  const [projects, setProjects] = useState<Project[]>([]);
  const [targets, setTargets] = useState<MonthlyTarget[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [recTargets, setRecTargets] = useState<RecruiterTarget[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Project form
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  // Target form
  const [targetMonth, setTargetMonth] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");

  // Recruiter target form
  const [rtUser, setRtUser] = useState("");
  const [rtMonth, setRtMonth] = useState("");
  const [rtJobs, setRtJobs] = useState("");
  const [rtRevenue, setRtRevenue] = useState("");

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  async function fetchData() {
    setLoadingData(true);
    const [projectsRes, targetsRes, profilesRes, rolesRes, recTargetsRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("monthly_targets").select("*").order("month", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("recruiter_targets").select("*").order("month", { ascending: false }),
    ]);
    setProjects(projectsRes.data ?? []);
    setTargets(targetsRes.data ?? []);

    const profiles = profilesRes.data ?? [];
    const roles = rolesRes.data ?? [];
    setUsers(
      profiles.map((p: any) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        roles: roles.filter((r: any) => r.user_id === p.user_id).map((r: any) => r.role),
      }))
    );

    const rt = recTargetsRes.data ?? [];
    setRecTargets(
      rt.map((r: any) => ({
        ...r,
        full_name: profiles.find((p: any) => p.user_id === r.user_id)?.full_name ?? "Unknown",
      }))
    );
    setLoadingData(false);
  }

  async function promoteToAdmin(userId: string) {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Promoted to admin" }); fetchData(); }
  }

  async function revokeAdmin(userId: string) {
    if (userId === user?.id) {
      toast({ title: "Cannot revoke your own admin", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin");
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Admin revoked" }); fetchData(); }
  }

  async function deleteUserAccount(userId: string) {
    if (userId === user?.id) {
      toast({ title: "Cannot delete your own account", variant: "destructive" });
      return;
    }
    if (!confirm("Remove this user's roles and profile? Their auth account will remain until deleted from backend Users.")) return;
    const { error: rolesErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error: profErr } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (rolesErr || profErr) {
      toast({ title: "Error", description: (rolesErr || profErr)?.message, variant: "destructive" });
    } else {
      toast({ title: "User removed" });
      fetchData();
    }
  }

  async function saveRecruiterTarget() {
    if (!rtUser || !rtMonth) {
      toast({ title: "Pick a recruiter and month", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("recruiter_targets").upsert(
      {
        user_id: rtUser,
        month: rtMonth + "-01",
        target_jobs: Number(rtJobs) || 0,
        target_revenue: Number(rtRevenue) || 0,
        created_by: user?.id,
      },
      { onConflict: "user_id,month" }
    );
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Recruiter target saved" });
      setRtUser(""); setRtMonth(""); setRtJobs(""); setRtRevenue("");
      fetchData();
    }
  }

  async function deleteRecruiterTarget(id: string) {
    const { error } = await supabase.from("recruiter_targets").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Recruiter target removed" }); fetchData(); }
  }

  async function addProject() {
    if (!projectName.trim()) return;
    const { error } = await supabase.from("projects").insert({
      name: projectName.trim(),
      description: projectDesc.trim() || null,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Project added" });
      setProjectName("");
      setProjectDesc("");
      setProjectDialogOpen(false);
      fetchData();
    }
  }

  async function deleteProject(id: string) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Project removed" });
      fetchData();
    }
  }

  async function upsertTarget() {
    if (!targetMonth || !targetAmount) return;
    const monthDate = targetMonth + "-01";
    const { error } = await supabase.from("monthly_targets").upsert(
      { month: monthDate, target_amount: Number(targetAmount), created_by: user?.id },
      { onConflict: "month" }
    );
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Target saved" });
      setTargetMonth("");
      setTargetAmount("");
      fetchData();
    }
  }

  async function updateTarget(id: string) {
    const { error } = await supabase
      .from("monthly_targets")
      .update({ target_amount: Number(editAmount) })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Target updated" });
      setEditingTarget(null);
      fetchData();
    }
  }

  async function deleteTarget(id: string) {
    const { error } = await supabase.from("monthly_targets").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Target removed" });
      fetchData();
    }
  }

  if (roleLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <ShieldCheck className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground text-sm">Only administrators can access this panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage accounts, roles, targets and projects</p>
      </div>

      {/* User Accounts */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" /> User Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-card border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isAdminUser = u.roles.includes("admin");
                  return (
                    <TableRow key={u.user_id}>
                      <TableCell className="text-sm font-medium">
                        {u.full_name || "Unnamed"}
                        {u.user_id === user?.id && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {u.roles.length === 0 && (
                            <Badge variant="outline" className="text-xs">none</Badge>
                          )}
                          {u.roles.map((r) => (
                            <Badge
                              key={r}
                              variant={r === "admin" ? "default" : "secondary"}
                              className="text-xs capitalize"
                            >
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {isAdminUser ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs gap-1"
                              onClick={() => revokeAdmin(u.user_id)}
                              disabled={u.user_id === user?.id}
                            >
                              <UserMinus className="h-3.5 w-3.5" /> Revoke admin
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs gap-1 text-accent"
                              onClick={() => promoteToAdmin(u.user_id)}
                            >
                              <Crown className="h-3.5 w-3.5" /> Promote to admin
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteUserAccount(u.user_id)}
                            disabled={u.user_id === user?.id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recruiter Performance */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" /> Recruiter Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-card border rounded-xl overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recruiter</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Open</TableHead>
                  <TableHead className="text-center">On Hold</TableHead>
                  <TableHead className="text-center">Closed</TableHead>
                  <TableHead className="text-center">Closed (MTD)</TableHead>
                  <TableHead className="text-center">Close Rate</TableHead>
                  <TableHead className="text-right">Revenue (MTD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recruiterStats.map((s) => (
                  <TableRow key={s.user_id}>
                    <TableCell className="text-sm font-medium">
                      {s.full_name || "Unnamed"}
                      {s.role === "admin" && <Badge variant="default" className="ml-2 text-[10px]">admin</Badge>}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1 text-sm font-semibold">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />{s.total_jobs}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm"><Badge variant="outline">{s.open_jobs}</Badge></TableCell>
                    <TableCell className="text-center text-sm">
                      <Badge variant="outline" className="border-accent/40 text-accent">{s.on_hold_jobs}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      <Badge variant="outline" className="border-green-500/40 text-green-600 dark:text-green-400">{s.closed_jobs}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">{s.closed_this_month}</TableCell>
                    <TableCell className="text-center text-sm">{s.close_rate}%</TableCell>
                    <TableCell className="text-right text-sm">
                      <span className="inline-flex items-center"><IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />{s.revenue_this_month.toLocaleString("en-IN")}</span>
                    </TableCell>
                  </TableRow>
                ))}
                {recruiterStats.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">No recruiters yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recruiter Targets */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" /> Recruiter Targets & Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Recruiter</Label>
              <Select value={rtUser} onValueChange={setRtUser}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>
                      {u.full_name || "Unnamed"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Month</Label>
              <Input type="month" value={rtMonth} onChange={(e) => setRtMonth(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target Jobs</Label>
              <Input type="number" value={rtJobs} onChange={(e) => setRtJobs(e.target.value)} placeholder="5" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target Revenue (₹)</Label>
              <Input type="number" value={rtRevenue} onChange={(e) => setRtRevenue(e.target.value)} placeholder="200000" className="h-9 text-sm" />
            </div>
            <Button onClick={saveRecruiterTarget} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 h-9">
              Save Target
            </Button>
          </div>

          {recTargets.length > 0 && (
            <div className="bg-card border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recruiter</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead className="min-w-[180px]">Jobs Progress</TableHead>
                    <TableHead className="min-w-[200px]">Revenue Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recTargets.map((r) => {
                    const stat = recruiterStats.find((s) => s.user_id === r.user_id);
                    const tMonth = new Date(r.month);
                    const now = new Date();
                    const isCurrent = tMonth.getFullYear() === now.getFullYear() && tMonth.getMonth() === now.getMonth();
                    const actualJobs = isCurrent ? stat?.closed_this_month ?? 0 : 0;
                    const actualRev = isCurrent ? stat?.revenue_this_month ?? 0 : 0;
                    const jobsPct = r.target_jobs ? Math.min(100, Math.round((actualJobs / r.target_jobs) * 100)) : 0;
                    const revPct = Number(r.target_revenue) ? Math.min(100, Math.round((actualRev / Number(r.target_revenue)) * 100)) : 0;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm font-medium">{r.full_name}</TableCell>
                        <TableCell className="text-sm">
                          {tMonth.toLocaleDateString("en-IN", { year: "numeric", month: "long" })}
                          {isCurrent && <Badge variant="outline" className="ml-2 text-[10px]">current</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs flex justify-between">
                              <span className="font-medium">{actualJobs} / {r.target_jobs}</span>
                              <span className="text-muted-foreground">{jobsPct}%</span>
                            </div>
                            <Progress value={jobsPct} className="h-1.5" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs flex justify-between gap-2">
                              <span className="font-medium inline-flex items-center">
                                <IndianRupee className="h-3 w-3" />{actualRev.toLocaleString("en-IN")}
                                <span className="text-muted-foreground"> / </span>
                                <IndianRupee className="h-3 w-3" />{Number(r.target_revenue).toLocaleString("en-IN")}
                              </span>
                              <span className="text-muted-foreground">{revPct}%</span>
                            </div>
                            <Progress value={revPct} className="h-1.5" />
                          </div>
                        </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteRecruiterTarget(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target History */}
      <TargetHistory />

      {/* Monthly Targets Section */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" /> Monthly Targets
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Month</Label>
              <Input
                type="month"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target Amount (₹)</Label>
              <Input
                type="number"
                placeholder="500000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <Button onClick={upsertTarget} size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 h-9">
              Set Target
            </Button>
          </div>

          {targets.length > 0 && (
            <div className="bg-card border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Target Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm font-medium">
                        {new Date(t.month).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}
                      </TableCell>
                      <TableCell>
                        {editingTarget === t.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="h-8 w-32 text-sm"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === "Enter") updateTarget(t.id); if (e.key === "Escape") setEditingTarget(null); }}
                            />
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-accent" onClick={() => updateTarget(t.id)}>Save</Button>
                            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingTarget(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-sm">
                            <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                            {Number(t.target_amount).toLocaleString("en-IN")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => { setEditingTarget(t.id); setEditAmount(String(t.target_amount)); }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteTarget(t.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Section */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-accent" /> Projects
            </CardTitle>
            <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Project Name</Label>
                    <Input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. Senior Developer Hiring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      value={projectDesc}
                      onChange={(e) => setProjectDesc(e.target.value)}
                      placeholder="Brief description..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={addProject} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    Add Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No projects yet. Add your first project above.</p>
          ) : (
            <div className="bg-card border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm font-medium">{p.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {p.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteProject(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
