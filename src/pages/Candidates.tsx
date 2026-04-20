import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Search, Phone, Mail, Trash2, Pencil, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface CandidateRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  current_company: string | null;
  experience_years: number;
  skills: string[];
  notes: string | null;
  created_by: string | null;
}

const empty = { full_name: "", email: "", phone: "", current_company: "", experience_years: "0", skills: "", notes: "" };

export default function Candidates() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [expFilter, setExpFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCandidates(); }, []);

  async function fetchCandidates() {
    setLoading(true);
    const { data, error } = await supabase.from("candidates").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Error loading candidates", description: error.message, variant: "destructive" });
    setCandidates(data ?? []);
    setLoading(false);
  }

  const allSkills = useMemo(() => Array.from(new Set(candidates.flatMap((c) => c.skills))).sort(), [candidates]);

  const filtered = candidates.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      c.full_name.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.phone?.includes(search) ?? false);
    const matchSkill = skillFilter === "all" || c.skills.includes(skillFilter);
    const matchExp = expFilter === "all" ||
      (expFilter === "0-2" && c.experience_years <= 2) ||
      (expFilter === "3-5" && c.experience_years >= 3 && c.experience_years <= 5) ||
      (expFilter === "6+" && c.experience_years >= 6);
    return matchSearch && matchSkill && matchExp;
  });

  function openCreate() { setEditingId(null); setForm(empty); setDialogOpen(true); }
  function openEdit(c: CandidateRow) {
    setEditingId(c.id);
    setForm({
      full_name: c.full_name, email: c.email ?? "", phone: c.phone ?? "",
      current_company: c.current_company ?? "", experience_years: String(c.experience_years),
      skills: c.skills.join(", "), notes: c.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.full_name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      current_company: form.current_company.trim() || null,
      experience_years: Number(form.experience_years) || 0,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      notes: form.notes.trim() || null,
    };
    const { error } = editingId
      ? await supabase.from("candidates").update(payload).eq("id", editingId)
      : await supabase.from("candidates").insert({ ...payload, created_by: user?.id });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editingId ? "Candidate updated" : "Candidate added" });
    setDialogOpen(false);
    fetchCandidates();
  }

  async function remove(id: string) {
    if (!confirm("Delete this candidate? Their applications will also be removed.")) return;
    const { error } = await supabase.from("candidates").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Candidate deleted" });
    fetchCandidates();
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} candidate{filtered.length !== 1 ? "s" : ""} found</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-accent text-accent-foreground hover:bg-accent/90">+ Add Candidate</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingId ? "Edit Candidate" : "Add Candidate"}</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Current Company</Label><Input value={form.current_company} onChange={(e) => setForm({ ...form, current_company: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Experience (yrs)</Label><Input type="number" min="0" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Skills (comma separated)</Label><Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingId ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={skillFilter} onValueChange={setSkillFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Skill" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Skills</SelectItem>
            {allSkills.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={expFilter} onValueChange={setExpFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Experience" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Experience</SelectItem>
            <SelectItem value="0-2">0-2 years</SelectItem>
            <SelectItem value="3-5">3-5 years</SelectItem>
            <SelectItem value="6+">6+ years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground text-sm">
          {candidates.length === 0 ? "No candidates yet. Add your first candidate above." : "No candidates match the filters."}
        </CardContent></Card>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const canEdit = c.created_by === user?.id;
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{c.full_name}</p>
                        <p className="text-muted-foreground text-xs">{c.current_company ?? "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{c.experience_years} yrs</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.skills.slice(0, 2).map((s) => <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>)}
                        {c.skills.length > 2 && <Badge variant="secondary" className="text-xs font-normal">+{c.skills.length - 2}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {c.email && <a href={`mailto:${c.email}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Mail className="h-3.5 w-3.5" /></Button></a>}
                        {c.phone && <a href={`tel:${c.phone}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-3.5 w-3.5" /></Button></a>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
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
