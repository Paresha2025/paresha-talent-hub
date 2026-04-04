import { useState } from "react";
import { candidates as allCandidates, stageColors, type Candidate } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, Mail, MessageCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function Candidates() {
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [expFilter, setExpFilter] = useState("all");

  const allSkills = Array.from(new Set(allCandidates.flatMap(c => c.skills))).sort();

  const filtered = allCandidates.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchSkill = skillFilter === "all" || c.skills.includes(skillFilter);
    const matchExp = expFilter === "all" ||
      (expFilter === "0-2" && c.experience <= 2) ||
      (expFilter === "3-5" && c.experience >= 3 && c.experience <= 5) ||
      (expFilter === "6+" && c.experience >= 6);
    return matchSearch && matchSkill && matchExp;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidates</h1>
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} candidates found</p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">+ Add Candidate</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={skillFilter} onValueChange={setSkillFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Skill" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Skills</SelectItem>
            {allSkills.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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

      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Job Applied</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Contact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-muted-foreground text-xs">{c.currentCompany}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{c.jobTitle}</TableCell>
                <TableCell className="text-sm">{c.experience} yrs</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.skills.slice(0, 2).map(s => (
                      <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
                    ))}
                    {c.skills.length > 2 && <Badge variant="secondary" className="text-xs font-normal">+{c.skills.length - 2}</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${stageColors[c.stage]} border text-xs font-medium`} variant="outline">{c.stage}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Mail className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-success"><MessageCircle className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
