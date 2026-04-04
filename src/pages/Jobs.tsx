import { jobs } from "@/data/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusStyle: Record<string, string> = {
  Open: "bg-success/10 text-success border-success/20",
  Closed: "bg-muted text-muted-foreground border-border",
  "On Hold": "bg-warning/10 text-warning border-warning/20",
};

export default function Jobs() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">{jobs.length} job postings</p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">+ Create Job</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map(job => (
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{job.title}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">{job.clientName}</p>
                </div>
                <Badge variant="outline" className={`${statusStyle[job.status]} text-xs border`}>{job.status}</Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {job.location}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <IndianRupee className="h-3.5 w-3.5" /> {job.salary}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {job.candidateCount} candidates
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {job.skills.map(s => (
                  <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <p className="text-xs text-muted-foreground">Recruiter: {job.recruiter}</p>
                <Button variant="ghost" size="sm" className="text-xs h-7">View</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
