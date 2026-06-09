import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, FileText, Loader2, Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
const INVOICE_STATUSES: InvoiceStatus[] = ["draft", "sent", "paid", "overdue", "cancelled"];
const statusColors: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-zinc-200 text-zinc-700",
};

interface Client {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  gstin: string | null;
  notes: string | null;
  created_by: string | null;
}
interface LineItem { description: string; qty: number; rate: number }
interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_percent: number;
  total_amount: number;
  status: InvoiceStatus;
  line_items: LineItem[];
  notes: string | null;
  created_by: string | null;
}

const emptyClient = { company_name: "", contact_person: "", email: "", phone: "", address: "", gstin: "", notes: "" };

function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyClient);
  const [saving, setSaving] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [c, i] = await Promise.all([
      supabase.from("clients").select("*").order("created_at", { ascending: false }),
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
    ]);
    if (c.error) toast({ title: "Error", description: c.error.message, variant: "destructive" });
    if (i.error) toast({ title: "Error", description: i.error.message, variant: "destructive" });
    setClients((c.data ?? []) as Client[]);
    setInvoices((i.data ?? []) as unknown as Invoice[]);
    setLoading(false);
  }

  function openCreate() { setEditingId(null); setForm(emptyClient); setDialog(true); }
  function openEdit(c: Client) {
    setEditingId(c.id);
    setForm({
      company_name: c.company_name, contact_person: c.contact_person ?? "", email: c.email ?? "",
      phone: c.phone ?? "", address: c.address ?? "", gstin: c.gstin ?? "", notes: c.notes ?? "",
    });
    setDialog(true);
  }

  async function saveClient() {
    if (!form.company_name.trim()) { toast({ title: "Company name required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      company_name: form.company_name.trim(),
      contact_person: form.contact_person.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      gstin: form.gstin.trim() || null,
      notes: form.notes.trim() || null,
    };
    const { error } = editingId
      ? await supabase.from("clients").update(payload).eq("id", editingId)
      : await supabase.from("clients").insert({ ...payload, created_by: user?.id });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editingId ? "Client updated" : "Client added" });
    setDialog(false); fetchAll();
  }

  async function deleteClient(id: string) {
    if (!confirm("Delete this client? Their invoices will also be removed.")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Client deleted" }); fetchAll();
  }

  const invoicesByClient = useMemo(() => {
    const m = new Map<string, Invoice[]>();
    invoices.forEach((inv) => {
      if (!m.has(inv.client_id)) m.set(inv.client_id, []);
      m.get(inv.client_id)!.push(inv);
    });
    return m;
  }, [invoices]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={dialog} onOpenChange={setDialog}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> Add Client</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingId ? "Edit Client" : "Add Client"}</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5"><Label>Company Name *</Label><Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Contact Person</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>GSTIN</Label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Address</Label><Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialog(false)}>Cancel</Button>
              <Button onClick={saveClient} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingId ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : clients.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground text-sm">No clients yet.</CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => {
            const cinv = invoicesByClient.get(c.id) ?? [];
            const outstanding = cinv.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + Number(i.total_amount), 0);
            const canEdit = c.created_by === user?.id;
            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-accent shrink-0" /><h3 className="font-semibold text-sm truncate">{c.company_name}</h3></div>
                      {c.contact_person && <p className="text-muted-foreground text-xs mt-1 truncate">{c.contact_person}</p>}
                    </div>
                    {canEdit && (
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteClient(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {c.email && <div className="flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5" /> {c.email}</div>}
                    {c.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {c.phone}</div>}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">{cinv.length} invoice{cinv.length !== 1 ? "s" : ""}</p>
                      {outstanding > 0 && <p className="text-xs text-red-600 font-medium">{fmtINR(outstanding)} due</p>}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setDetailClient(c)}><FileText className="h-3.5 w-3.5" /> Invoices</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ClientInvoicesDialog
        client={detailClient}
        invoices={detailClient ? invoicesByClient.get(detailClient.id) ?? [] : []}
        onClose={() => setDetailClient(null)}
        onChanged={fetchAll}
        userId={user?.id}
      />
    </div>
  );
}

function ClientInvoicesDialog({ client, invoices, onClose, onChanged, userId }: {
  client: Client | null; invoices: Invoice[]; onClose: () => void; onChanged: () => void; userId: string | undefined;
}) {
  const [mode, setMode] = useState<"list" | "form">("list");
  const [editingInv, setEditingInv] = useState<Invoice | null>(null);
  const [invNumber, setInvNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tax, setTax] = useState("18");
  const [status, setStatus] = useState<InvoiceStatus>("draft");
  const [items, setItems] = useState<LineItem[]>([{ description: "", qty: 1, rate: 0 }]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditingInv(null);
    const next = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    setInvNumber(next);
    setIssueDate(new Date().toISOString().slice(0, 10));
    setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setTax("18"); setStatus("draft"); setItems([{ description: "", qty: 1, rate: 0 }]); setNotes("");
    setMode("form");
  }
  function openEdit(inv: Invoice) {
    setEditingInv(inv);
    setInvNumber(inv.invoice_number);
    setIssueDate(inv.issue_date);
    setDueDate(inv.due_date ?? "");
    setTax(String(inv.tax_percent)); setStatus(inv.status);
    setItems(inv.line_items?.length ? inv.line_items : [{ description: "", qty: 1, rate: 0 }]);
    setNotes(inv.notes ?? "");
    setMode("form");
  }

  const subtotal = items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.rate || 0), 0);
  const taxAmt = subtotal * (Number(tax) / 100);
  const total = subtotal + taxAmt;

  async function save() {
    if (!client) return;
    if (!invNumber.trim()) { toast({ title: "Invoice number required", variant: "destructive" }); return; }
    setSaving(true);
    const payload: any = {
      client_id: client.id,
      invoice_number: invNumber.trim(),
      issue_date: issueDate,
      due_date: dueDate || null,
      subtotal, tax_percent: Number(tax), total_amount: total,
      status,
      line_items: items.filter((i) => i.description.trim()),
      notes: notes.trim() || null,
    };
    const { error } = editingInv
      ? await supabase.from("invoices").update(payload).eq("id", editingInv.id)
      : await supabase.from("invoices").insert({ ...payload, created_by: userId });
    setSaving(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: editingInv ? "Invoice updated" : "Invoice created" });
    setMode("list"); onChanged();
  }

  async function del(id: string) {
    if (!confirm("Delete this invoice?")) return;
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Invoice deleted" }); onChanged();
  }

  return (
    <Dialog open={!!client} onOpenChange={(o) => { if (!o) { onClose(); setMode("list"); } }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client?.company_name} — Invoices</DialogTitle>
        </DialogHeader>
        {mode === "list" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openNew} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> New Invoice</Button>
            </div>
            {invoices.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No invoices yet for this client.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Number</TableHead><TableHead>Issued</TableHead><TableHead>Due</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium text-sm">{inv.invoice_number}</TableCell>
                      <TableCell className="text-sm">{inv.issue_date}</TableCell>
                      <TableCell className="text-sm">{inv.due_date ?? "—"}</TableCell>
                      <TableCell className="text-sm">{fmtINR(Number(inv.total_amount))}</TableCell>
                      <TableCell><Badge variant="outline" className={`${statusColors[inv.status]} border-0 text-xs capitalize`}>{inv.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(inv)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(inv.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Invoice #</Label><Input value={invNumber} onChange={(e) => setInvNumber(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INVOICE_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Issue Date</Label><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Tax %</Label><Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label>Line items</Label>
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_120px_auto] gap-2">
                  <Input placeholder="Description" value={it.description} onChange={(e) => { const n = [...items]; n[idx] = { ...it, description: e.target.value }; setItems(n); }} />
                  <Input type="number" placeholder="Qty" value={it.qty} onChange={(e) => { const n = [...items]; n[idx] = { ...it, qty: Number(e.target.value) }; setItems(n); }} />
                  <Input type="number" placeholder="Rate" value={it.rate} onChange={(e) => { const n = [...items]; n[idx] = { ...it, rate: Number(e.target.value) }; setItems(n); }} />
                  <Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={items.length === 1}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setItems([...items, { description: "", qty: 1, rate: 0 }])}><Plus className="h-3.5 w-3.5" /> Add line</Button>
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>{fmtINR(subtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Tax ({tax}%)</span><span>{fmtINR(taxAmt)}</span></div>
              <div className="flex justify-between font-semibold text-base pt-1 border-t"><span>Total</span><span>{fmtINR(total)}</span></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setMode("list")}>Back</Button>
              <Button onClick={save} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingInv ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}