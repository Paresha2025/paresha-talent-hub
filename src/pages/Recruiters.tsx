import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase } from "lucide-react";

interface RecruiterRow {
  user_id: string;
  full_name: string | null;
  role: string;
  total: number;
  open: number;
  in_progress: number;
  closed: number;
}

export default function Recruiters() {
  const [rows, setRows] = useState<RecruiterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [profilesRes, rolesRes, jobsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("jobs").select("created_by, status"),
      ]);

      const profiles = profilesRes.data ?? [];
      const roles = rolesRes.data ?? [];
      const jobs = jobsRes.data ?? [];

      const result: RecruiterRow[] = profiles.map((p: any) => {
        const userJobs = jobs.filter((j: any) => j.created_by === p.user_id);
        const role =
          roles.find((r: any) => r.user_id === p.user_id && r.role === "admin")
            ?.role ??
          roles.find((r: any) => r.user_id === p.user_id)?.role ??
          "recruiter";
        return {
          user_id: p.user_id,
          full_name: p.full_name,
          role,
          total: userJobs.length,
          open: userJobs.filter((j: any) => j.status === "open").length,
          in_progress: userJobs.filter(
            (j: any) => j.status === "in_progress"
          ).length,
          closed: userJobs.filter((j: any) => j.status === "closed").length,
        };
      });

      setRows(result.sort((a, b) => b.total - a.total));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">Recruiters</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Job workload by recruiter
        </p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" /> Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              Loading…
            </p>
          ) : (
            <div className="bg-card border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recruiter</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Total Jobs</TableHead>
                    <TableHead className="text-center">Open</TableHead>
                    <TableHead className="text-center">In Progress</TableHead>
                    <TableHead className="text-center">Closed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.user_id}>
                      <TableCell className="text-sm font-medium">
                        {r.full_name || "Unnamed"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={r.role === "admin" ? "default" : "secondary"}
                          className="text-xs capitalize"
                        >
                          {r.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1 text-sm font-semibold">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          {r.total}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <Badge variant="outline">{r.open}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <Badge variant="outline" className="border-accent/40 text-accent">
                          {r.in_progress}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <Badge variant="outline" className="border-green-500/40 text-green-600 dark:text-green-400">
                          {r.closed}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                        No recruiters yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}