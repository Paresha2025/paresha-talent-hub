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
import { Target, FolderPlus, Trash2, Plus, ShieldCheck, IndianRupee } from "lucide-react";

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

export default function Admin() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [targets, setTargets] = useState<MonthlyTarget[]>([]);
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

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  async function fetchData() {
    setLoadingData(true);
    const [projectsRes, targetsRes] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("monthly_targets").select("*").order("month", { ascending: false }),
    ]);
    setProjects(projectsRes.data ?? []);
    setTargets(targetsRes.data ?? []);
    setLoadingData(false);
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
        <p className="text-muted-foreground text-sm mt-1">Manage targets and projects</p>
      </div>

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
