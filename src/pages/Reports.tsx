import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, Briefcase, ListChecks, CalendarCheck, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function toCsv(rows: Record<string, any>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = Array.isArray(v) ? v.join("; ") : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function download(name: string, csv: string) {
  if (!csv) { toast({ title: "Nothing to export", description: "No data found." }); return; }
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [busy, setBusy] = useState<string | null>(null);

  async function exportCandidates() {
    setBusy("candidates");
    const { data, error } = await supabase.from("candidates").select("full_name, email, phone, current_company, experience_years, skills, notes, created_at");
    setBusy(null);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    download("candidates.csv", toCsv(data ?? []));
  }
  async function exportJobs() {
    setBusy("jobs");
    const { data, error } = await supabase.from("jobs").select("title, client_name, location, salary, status, recruiter, skills, created_at");
    setBusy(null);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    download("jobs.csv", toCsv(data ?? []));
  }
  async function exportApplications() {
    setBusy("applications");
    const { data, error } = await supabase.from("applications").select("stage, created_at, updated_at, candidates(full_name, email), jobs(title, client_name)");
    setBusy(null);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const flat = (data ?? []).map((a: any) => ({
      candidate: a.candidates?.full_name ?? "",
      candidate_email: a.candidates?.email ?? "",
      job: a.jobs?.title ?? "",
      client: a.jobs?.client_name ?? "",
      stage: a.stage,
      applied_at: a.created_at,
      last_updated: a.updated_at,
    }));
    download("applications.csv", toCsv(flat));
  }
  async function exportInterviews() {
    setBusy("interviews");
    const { data, error } = await supabase.from("interviews").select("scheduled_at, type, status, feedback, notes, applications(candidates(full_name), jobs(title))");
    setBusy(null);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const flat = (data ?? []).map((i: any) => ({
      candidate: i.applications?.candidates?.full_name ?? "",
      job: i.applications?.jobs?.title ?? "",
      scheduled_at: i.scheduled_at,
      type: i.type,
      status: i.status,
      feedback: i.feedback ?? "",
      notes: i.notes ?? "",
    }));
    download("interviews.csv", toCsv(flat));
  }

  const reports = [
    { key: "candidates", title: "Candidates", description: "Export all candidates with skills, experience, and contact info", icon: Users, color: "text-info", action: exportCandidates },
    { key: "jobs", title: "Jobs", description: "Export all job postings with client, location, salary, and status", icon: Briefcase, color: "text-accent", action: exportJobs },
    { key: "applications", title: "Applications", description: "Export every candidate–job application with current pipeline stage", icon: ListChecks, color: "text-warning", action: exportApplications },
    { key: "interviews", title: "Interviews", description: "Export all scheduled and completed interviews with feedback", icon: CalendarCheck, color: "text-success", action: exportInterviews },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Reports & Export</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate and download recruitment reports as CSV</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {reports.map((r) => (
          <Card key={r.key} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <r.icon className={`h-5 w-5 ${r.color}`} />
                </div>
                <CardTitle className="text-sm font-semibold">{r.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">{r.description}</p>
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={r.action} disabled={busy === r.key}>
                {busy === r.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Download CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
