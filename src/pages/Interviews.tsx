import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarCheck, Video, Phone, MapPin, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  INTERVIEW_TYPES, INTERVIEW_STATUSES, interviewTypeLabel, interviewStatusLabel, interviewStatusColors,
  type InterviewType, type InterviewStatus,
} from "@/lib/atsConstants";

interface InterviewRow {
  id: string;
  application_id: string;
  scheduled_at: string;
  type: InterviewType;
  status: InterviewStatus;
  feedback: string | null;
  notes: string | null;
  created_by: string | null;
  applications: {
    candidates: { full_name: string } | null;
    jobs: { title: string; client_name: string | null } | null;
  } | null;
}

const typeIcon = { phone: Phone, video: Video, in_person: MapPin };

export default function Interviews() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [applications, setApplications] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [form, setForm] = useState({ application_id: "", scheduled_at: "", type: "video" as InterviewType, status: "scheduled" as InterviewStatus, notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [intRes, appsRes] = await Promise.all([
      supabase.from("interviews")
        .select("*, applications(candidates(full_name), jobs(title, client_name))")
        .order("scheduled_at", { ascending: false }),
      supabase.from("applications")
        .select("id, candidates(full_name), jobs(title)"),
    ]);
    if (intRes.error) toast({ title: "Error", description: intRes.error.message, variant: "destructive" });
    setInterviews((intRes.data as any) ?? []);
    setApplications((appsRes.data ?? []).map((a: any) => ({
      id: a.id,
      label: `${a.candidates?.full_name ?? "?"} → ${a.jobs?.title ?? "?"}`,
    })));
    setLoading(false);
  }

  async function schedule() {
    if (!form.application_id || !form.scheduled_at) { toast({ title: "Pick an application and a date/time", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("interviews").insert({
      application_id: form.application_id,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      type: form.type,
      status: form.status,
      notes: form.notes.trim() || null,
      created_by: user?.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Interview scheduled" });
    setDialogOpen(false);
    setForm({ application_id: "", scheduled_at: "", type: "video", status: "scheduled", notes: "" });
    fetchAll();
  }

  async function updateStatus(id: string, status: InterviewStatus) {
    const { error } = await supabase.from("interviews").update({ status }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    fetchAll();
  }

  async function saveFeedback(id: string) {
    const { error } = await supabase.from("interviews").update({ feedback: feedbackText.trim() || null }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Feedback saved" });
    setFeedbackOpen(null); setFeedbackText("");
    fetchAll();
  }

  async function remove(id: string) {
    if (!confirm("Delete this interview?")) return;
    const { error } = await supabase.from("interviews").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Interview deleted" });
    fetchAll();
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Interviews</h1>
          <p className="text-muted-foreground text-sm mt-1">{interviews.length} interview{interviews.length !== 1 ? "s" : ""} tracked</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">+ Schedule Interview</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule Interview</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5"><Label>Application</Label>
                <Select value={form.application_id} onValueChange={(v) => setForm({ ...form, application_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pick an application" /></SelectTrigger>
                  <SelectContent>
                    {applications.length === 0
                      ? <div className="px-3 py-2 text-xs text-muted-foreground">No applications yet — add one in Pipeline first.</div>
                      : applications.map((a) => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Date & Time</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as InterviewType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{INTERVIEW_TYPES.map((t) => <SelectItem key={t} value={t}>{interviewTypeLabel[t]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={schedule} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : interviews.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground text-sm">No interviews yet. Schedule one above.</CardContent></Card>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job / Client</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.map((i) => {
                const Icon = typeIcon[i.type];
                const dt = new Date(i.scheduled_at);
                const canEdit = i.created_by === user?.id;
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium text-sm">{i.applications?.candidates?.full_name ?? "—"}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{i.applications?.jobs?.title ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{i.applications?.jobs?.client_name ?? ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        {dt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {interviewTypeLabel[i.type]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={i.status} onValueChange={(v) => updateStatus(i.id, v as InterviewStatus)}>
                        <SelectTrigger className={`h-7 text-xs border ${interviewStatusColors[i.status]} w-[120px]`}><SelectValue /></SelectTrigger>
                        <SelectContent>{INTERVIEW_STATUSES.map((s) => <SelectItem key={s} value={s}>{interviewStatusLabel[s]}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Dialog open={feedbackOpen === i.id} onOpenChange={(o) => { setFeedbackOpen(o ? i.id : null); setFeedbackText(o ? (i.feedback ?? "") : ""); }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs h-7 max-w-[200px] truncate justify-start">
                            {i.feedback ? i.feedback.slice(0, 30) + (i.feedback.length > 30 ? "..." : "") : "+ Add"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Interview Feedback</DialogTitle></DialogHeader>
                          <Textarea rows={5} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Add your feedback..." />
                          <DialogFooter>
                            <Button variant="ghost" onClick={() => setFeedbackOpen(null)}>Cancel</Button>
                            <Button onClick={() => saveFeedback(i.id)} className="bg-accent text-accent-foreground hover:bg-accent/90">Save</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(i.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
