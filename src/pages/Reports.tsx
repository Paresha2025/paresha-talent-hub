import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Users, Building2, TrendingUp, CalendarDays } from "lucide-react";

const reports = [
  { title: "Candidate List", description: "Export all candidates with their details, stages, and skills", icon: Users, color: "text-info" },
  { title: "Client-wise Hiring", description: "Hiring summary grouped by client with job counts and status", icon: Building2, color: "text-accent" },
  { title: "Recruiter Performance", description: "Performance metrics for each recruiter — submissions, interviews, hires", icon: TrendingUp, color: "text-warning" },
  { title: "Monthly Hiring Summary", description: "Month-over-month hiring trends with closures and pipeline data", icon: CalendarDays, color: "text-success" },
];

export default function Reports() {
  const handleExport = (title: string) => {
    // Placeholder — would generate CSV/Excel
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent("Name,Email,Status\nSample,sample@test.com,Active");
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Reports & Export</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate and download recruitment reports</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {reports.map(r => (
          <Card key={r.title} className="hover:shadow-md transition-shadow">
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => handleExport(r.title)}>
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={() => handleExport(r.title)}>
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
