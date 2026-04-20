import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { APPLICATION_STAGES, stageLabel, stageColors, type ApplicationStage } from "@/lib/atsConstants";

interface AppRow {
  id: string;
  stage: ApplicationStage;
  candidate_id: string;
  job_id: string;
  candidates: { full_name: string; experience_years: number; skills: string[] } | null;
  jobs: { title: string; client_name: string | null } | null;
}

export default function Pipeline() {
  const { user } = useAuth();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [candidates, setCandidates] = useState<{ id: string; full_name: string }[]>([]);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [newApp, setNewApp] = useState({ candidate_id: "", job_id: "", stage: "applied" as ApplicationStage });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [appsRes, candRes, jobsRes] = await Promise.all([
      supabase.from("applications").select("id, stage, candidate_id, job_id, candidates(full_name, experience_years, skills), jobs(title, client_name)").order("created_at", { ascending: false }),
      supabase.from("candidates").select("id, full_name").order("full_name"),
      supabase.from("jobs").select("id, title").order("title"),
    ]);
    if (appsRes.error) toast({ title: "Error", description: appsRes.error.message, variant: "destructive" });
    setApps((appsRes.data as any) ?? []);
    setCandidates(candRes.data ?? []);
    setJobs(jobsRes.data ?? []);
    setLoading(false);
  }

  async function handleDrop(stage: ApplicationStage) {
    if (!draggedId) return;
    const app = apps.find((a) => a.id === draggedId);
    setDraggedId(null);
    if (!app || app.stage === stage) return;
    // Optimistic update
    setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, stage } : a)));
    const { error } = await supabase.from("applications").update({ stage }).eq("id", app.id);
    if (error) {
      toast({ title: "Error updating stage", description: error.message, variant: "destructive" });
      fetchAll();
    }
  }

  async function createApplication() {
    if (!newApp.candidate_id || !newApp.job_id) { toast({ title: "Pick a candidate and a job", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("applications").insert({
      candidate_id: newApp.candidate_id,
      job_id: newApp.job_id,
      stage: newApp.stage,
      created_by: user?.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Application added to pipeline" });
    setDialogOpen(false);
    setNewApp({ candidate_id: "", job_id: "", stage: "applied" });
    fetchAll();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">Drag candidates across stages</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"><Plus className="h-4 w-4" /> Add to Pipeline</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Candidate to Pipeline</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5"><Label>Candidate</Label>
                <Select value={newApp.candidate_id} onValueChange={(v) => setNewApp({ ...newApp, candidate_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pick a candidate" /></SelectTrigger>
                  <SelectContent>{candidates.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Job</Label>
                <Select value={newApp.job_id} onValueChange={(v) => setNewApp({ ...newApp, job_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pick a job" /></SelectTrigger>
                  <SelectContent>{jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Stage</Label>
                <Select value={newApp.stage} onValueChange={(v) => setNewApp({ ...newApp, stage: v as ApplicationStage })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{APPLICATION_STAGES.map((s) => <SelectItem key={s} value={s}>{stageLabel[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createApplication} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : apps.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground text-sm">No applications yet. Add candidates to the pipeline above.</CardContent></Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {APPLICATION_STAGES.map((stage) => {
            const stageApps = apps.filter((a) => a.stage === stage);
            return (
              <div key={stage} className="kanban-column min-w-[260px] flex-shrink-0" onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(stage)}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">{stageLabel[stage]}</h3>
                  <Badge variant="outline" className={`${stageColors[stage]} border text-xs`}>{stageApps.length}</Badge>
                </div>
                <div className="space-y-3">
                  {stageApps.map((a) => (
                    <div key={a.id} draggable onDragStart={() => setDraggedId(a.id)} className="kanban-card cursor-grab active:cursor-grabbing">
                      <p className="font-medium text-sm mb-1">{a.candidates?.full_name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground mb-2 truncate">{a.jobs?.title ?? "—"}{a.jobs?.client_name ? ` · ${a.jobs.client_name}` : ""}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {a.candidates?.skills?.slice(0, 2).map((s) => <Badge key={s} variant="secondary" className="text-[10px] font-normal px-1.5 py-0">{s}</Badge>)}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{a.candidates?.experience_years ?? 0}y</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
