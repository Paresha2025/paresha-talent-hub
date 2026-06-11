import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, IndianRupee } from "lucide-react";
import { useRecruiterStats } from "@/hooks/useRecruiterStats";

export default function Recruiters() {
  const { stats, loading } = useRecruiterStats();

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">Recruiters</h1>
        <p className="text-muted-foreground text-sm mt-1">Workload and performance by recruiter</p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" /> Team Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground text-sm py-8">Loading…</p>
          ) : (
            <div className="bg-card border rounded-xl overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recruiter</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Open</TableHead>
                    <TableHead className="text-center">On Hold</TableHead>
                    <TableHead className="text-center">Closed</TableHead>
                    <TableHead className="text-center">This Month</TableHead>
                    <TableHead className="text-center">Close Rate</TableHead>
                    <TableHead className="text-right">Revenue (MTD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((r) => (
                    <TableRow key={r.user_id}>
                      <TableCell className="text-sm font-medium">{r.full_name || "Unnamed"}</TableCell>
                      <TableCell>
                        <Badge variant={r.role === "admin" ? "default" : "secondary"} className="text-xs capitalize">{r.role}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1 text-sm font-semibold">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          {r.total_jobs}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm"><Badge variant="outline">{r.open_jobs}</Badge></TableCell>
                      <TableCell className="text-center text-sm">
                        <Badge variant="outline" className="border-accent/40 text-accent">{r.on_hold_jobs}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <Badge variant="outline" className="border-green-500/40 text-green-600 dark:text-green-400">{r.closed_jobs}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">{r.closed_this_month}</TableCell>
                      <TableCell className="text-center text-sm">{r.close_rate}%</TableCell>
                      <TableCell className="text-right text-sm">
                        <span className="inline-flex items-center"><IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />{r.revenue_this_month.toLocaleString("en-IN")}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {stats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">No recruiters yet</TableCell>
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