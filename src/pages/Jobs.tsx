import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, IndianRupee, Trash2, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { JOB_STATUSES, jobStatusLabel, jobStatusColors, type JobStatus } from "@/lib/atsConstants";

interface JobRow {
  id: string;
  title: string;
  client_name: string | null;
  description: string | null;
  location: string | null;
  salary: string | null;
  skills: string[];
  recruiter: string | null;
  status: JobStatus;
  created_by: string | null;
  candidate_count?: number;
}

const empty = { title: "", client_name: "", description: "", location: "", salary: "", skills: "", recruiter: "", status: "open" as JobStatus };

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchJobs(); }, []);

  async function fetchJobs() {
    setLoading(true);
    const { data: jobsData, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading jobs", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    // Get candidate counts per job
    const { data: apps } = await supabase.from("applications").select("job_id");
    const counts = new Map<string, number>();
    apps?.forEach((a) => counts.set(a.job_id, (counts.get(a.job_id) ?? 0) + 1));
    setJobs((jobsData ?? []).map((j) => ({ ...j, candidate_count: counts.get(j.id) ?? 0 })));
    setLoading(false);
  }

  function openCreate() { setEditingId(null); setForm(empty); setDialogOpen(true); }
  function openEdit(j: JobRow) {
    setEditingId(j.id);
    setForm({
      title: j.title, client_name: j.client_name ?? "", description: j.description ?? "",
      location: j.location ?? "", salary: j.salary ?? "", skills: j.skills.join(", "),
      recruiter: j.recruiter ?? "", status: j.status,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      client_name: form.client_name.trim() || null,
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      salary: form.salary.trim() || null,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      recruiter: form.recruiter.trim() || null,
      status: form.status,
    };
    const { error } = editingId
      ? await supabase.from("jobs").update(payload).eq("id", editingId)
      : await supabase.from("jobs").insert({ ...payload, created_by: user?.id });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editingId ? "Job updated" : "Job created" });
    setDialogOpen(false);
    fetchJobs();
  }

  async function remove(id: string) {
    if (!confirm("Delete this job? All applications for it will also be removed.")) return;
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Job deleted" });
    fetchJobs();
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">{jobs.length} job posting{jobs.length !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-accent text-accent-foreground hover:bg-accent/90">+ Create Job</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingId ? "Edit Job" : "Create Job"}</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Client</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Salary</Label><Input placeholder="₹10-15 LPA" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Recruiter</Label><Input value={form.recruiter} onChange={(e) => setForm({ ...form, recruiter: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as JobStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{JOB_STATUSES.map((s) => <SelectItem key={s} value={s}>{jobStatusLabel[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Skills (comma separated)</Label><Input placeholder="React, TypeScript, Node.js" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingId ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : jobs.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground text-sm">No jobs yet. Create your first job to get started.</CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const canEdit = job.created_by === user?.id;
            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                      <p className="text-muted-foreground text-xs mt-0.5 truncate">{job.client_name ?? "—"}</p>
                    </div>
                    <Badge variant="outline" className={`${jobStatusColors[job.status]} text-xs border shrink-0`}>{jobStatusLabel[job.status]}</Badge>
                  </div>
                  <div className="space-y-2 mb-4">
                    {job.location && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {job.location}</div>}
                    {job.salary && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><IndianRupee className="h-3.5 w-3.5" /> {job.salary}</div>}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> {job.candidate_count} candidate{job.candidate_count !== 1 ? "s" : ""}</div>
                  </div>
                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {job.skills.slice(0, 4).map((s) => <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>)}
                      {job.skills.length > 4 && <Badge variant="secondary" className="text-xs">+{job.skills.length - 4}</Badge>}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <p className="text-xs text-muted-foreground truncate">{job.recruiter ? `Recruiter: ${job.recruiter}` : "—"}</p>
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(job)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(job.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
