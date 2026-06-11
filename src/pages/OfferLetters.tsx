import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSignature, Loader2, Mail, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { MessageCircle } from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";
import { toast } from "@/hooks/use-toast";

type OfferStatus = "draft" | "sent" | "accepted" | "rejected" | "withdrawn";
const OFFER_STATUSES: OfferStatus[] = ["draft", "sent", "accepted", "rejected", "withdrawn"];
const statusColors: Record<OfferStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-zinc-200 text-zinc-700",
};

interface OfferRow {
  id: string;
  application_id: string;
  position: string;
  salary: string;
  joining_date: string | null;
  body: string;
  status: OfferStatus;
  sent_at: string | null;
  sent_to_email: string | null;
  created_by: string | null;
  candidate_name?: string;
  candidate_email?: string;
  candidate_phone?: string | null;
  job_title?: string;
  client_name?: string;
}

interface AppOption {
  id: string; label: string; email: string | null; phone: string | null; jobTitle: string; clientName: string | null; candidateName: string;
}

function defaultBody(name: string, position: string, client: string, salary: string, joining: string) {
  return `Dear ${name},\n\nWe are delighted to offer you the position of ${position} at ${client} with an annual CTC of ${salary}.\n\nProposed joining date: ${joining}.\n\nWe look forward to having you on board.\n\nBest regards,\nParesha HR Services`;
}

export default function OfferLetters() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [apps, setApps] = useState<AppOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [appId, setAppId] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");
  const [joining, setJoining] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<OfferStatus>("draft");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [o, a] = await Promise.all([
      supabase.from("offer_letters").select("*").order("created_at", { ascending: false }),
      supabase.from("applications").select("id, candidate_id, job_id, candidates(full_name,email,phone), jobs(title,client_name)"),
    ]);
    if (o.error) toast({ title: "Error", description: o.error.message, variant: "destructive" });
    const enriched: OfferRow[] = (o.data ?? []).map((row: any) => {
      const m = (a.data ?? []).find((x: any) => x.id === row.application_id);
      return {
        ...row,
        candidate_name: m?.candidates?.full_name,
        candidate_email: m?.candidates?.email,
        candidate_phone: m?.candidates?.phone,
        job_title: m?.jobs?.title,
        client_name: m?.jobs?.client_name,
      };
    });
    setOffers(enriched);
    setApps((a.data ?? []).map((row: any) => ({
      id: row.id,
      candidateName: row.candidates?.full_name ?? "Unknown",
      email: row.candidates?.email,
      phone: row.candidates?.phone ?? null,
      jobTitle: row.jobs?.title ?? "Unknown",
      clientName: row.jobs?.client_name,
      label: `${row.candidates?.full_name ?? "?"} → ${row.jobs?.title ?? "?"}`,
    })));
    setLoading(false);
  }

  function openCreate() {
    setEditingId(null); setAppId(""); setPosition(""); setSalary(""); setJoining("");
    setBody(""); setStatus("draft"); setDialog(true);
  }
  function openEdit(o: OfferRow) {
    setEditingId(o.id); setAppId(o.application_id);
    setPosition(o.position); setSalary(o.salary);
    setJoining(o.joining_date ?? ""); setBody(o.body); setStatus(o.status);
    setDialog(true);
  }

  function pickApp(id: string) {
    setAppId(id);
    const a = apps.find((x) => x.id === id);
    if (a) {
      if (!position) setPosition(a.jobTitle);
      if (!body) setBody(defaultBody(a.candidateName, a.jobTitle, a.clientName ?? "the company", salary || "[CTC]", joining || "[date]"));
    }
  }

  async function save() {
    if (!appId) { toast({ title: "Pick an application", variant: "destructive" }); return; }
    if (!position.trim() || !salary.trim()) { toast({ title: "Position and salary required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      application_id: appId, position: position.trim(), salary: salary.trim(),
      joining_date: joining || null, body, status,
    };
    const { error } = editingId
      ? await supabase.from("offer_letters").update(payload).eq("id", editingId)
      : await supabase.from("offer_letters").insert({ ...payload, created_by: user?.id });
    setSaving(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: editingId ? "Offer updated" : "Offer created" });
    setDialog(false); fetchAll();
  }

  async function remove(id: string) {
    if (!confirm("Delete this offer letter?")) return;
    const { error } = await supabase.from("offer_letters").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Offer deleted" }); fetchAll();
  }

  async function sendEmail(o: OfferRow) {
    if (!o.candidate_email) { toast({ title: "No candidate email on file", variant: "destructive" }); return; }
    setSending(o.id);
    // Open default mail client with prefilled message — works without email infra
    const subject = encodeURIComponent(`Offer Letter — ${o.position}`);
    const bodyEnc = encodeURIComponent(o.body);
    window.open(`mailto:${o.candidate_email}?subject=${subject}&body=${bodyEnc}`, "_blank");
    // Mark as sent
    const { error } = await supabase.from("offer_letters").update({
      status: "sent", sent_at: new Date().toISOString(), sent_to_email: o.candidate_email,
    }).eq("id", o.id);
    setSending(null);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Offer marked as sent", description: "Email draft opened in your mail app." });
    fetchAll();
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Offer Letters</h1>
          <p className="text-muted-foreground text-sm mt-1">{offers.length} offer{offers.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openCreate} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> New Offer Letter</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : offers.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground text-sm">No offer letters yet. Generate one from a selected candidate.</CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {offers.map((o) => {
            const canEdit = o.created_by === user?.id;
            return (
              <Card key={o.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2"><FileSignature className="h-4 w-4 text-accent shrink-0" /><h3 className="font-semibold text-sm truncate">{o.position}</h3></div>
                      <p className="text-muted-foreground text-xs mt-1 truncate">{o.candidate_name} • {o.client_name ?? o.job_title}</p>
                    </div>
                    <Badge variant="outline" className={`${statusColors[o.status]} border-0 text-xs capitalize shrink-0`}>{o.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>CTC: <span className="text-foreground font-medium">{o.salary}</span></div>
                    {o.joining_date && <div>Joining: <span className="text-foreground">{o.joining_date}</span></div>}
                    {o.candidate_email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{o.candidate_email}</div>}
                  </div>
                  <pre className="text-xs whitespace-pre-wrap bg-muted/30 rounded p-2 max-h-24 overflow-hidden line-clamp-4">{o.body}</pre>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" className="flex-1" disabled={!o.candidate_email || sending === o.id} onClick={() => sendEmail(o)}>
                      {sending === o.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send Email
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700 border-green-200 hover:bg-green-50"
                      disabled={!o.candidate_phone}
                      title={o.candidate_phone ? "Send via WhatsApp" : "No phone on file"}
                      onClick={() => {
                        const msg = `Hi ${o.candidate_name?.split(" ")[0] ?? ""},\n\nPlease find your offer letter from Paresha HR Services below:\n\n${o.body}`;
                        const ok = openWhatsApp(o.candidate_phone, msg);
                        if (!ok) toast({ title: "Invalid phone number", variant: "destructive" });
                      }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </Button>
                    {canEdit && (<>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(o.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </>)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Offer Letter" : "Generate Offer Letter"}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>Application *</Label>
              <Select value={appId} onValueChange={pickApp} disabled={!!editingId}>
                <SelectTrigger><SelectValue placeholder="Pick candidate → job" /></SelectTrigger>
                <SelectContent>{apps.map((a) => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Position *</Label><Input value={position} onChange={(e) => setPosition(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>CTC *</Label><Input placeholder="₹20,00,000 per annum" value={salary} onChange={(e) => setSalary(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Joining Date</Label><Input type="date" value={joining} onChange={(e) => setJoining(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as OfferStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OFFER_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Letter Body</Label><Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingId ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}