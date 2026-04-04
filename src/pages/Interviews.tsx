import { interviews } from "@/data/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Video, Phone, MapPin, MessageSquare } from "lucide-react";

const typeIcon = { Phone: Phone, Video: Video, "In-Person": MapPin };
const statusStyle: Record<string, string> = {
  Scheduled: "bg-info/10 text-info border-info/20",
  Completed: "bg-success/10 text-success border-success/20",
  Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Interviews() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Interviews</h1>
          <p className="text-muted-foreground text-sm mt-1">{interviews.length} interviews tracked</p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">+ Schedule Interview</Button>
      </div>

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {interviews.map(i => {
              const Icon = typeIcon[i.type];
              return (
                <TableRow key={i.id}>
                  <TableCell className="font-medium text-sm">{i.candidateName}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{i.jobTitle}</p>
                      <p className="text-xs text-muted-foreground">{i.clientName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      {i.date} · {i.time}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {i.type}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${statusStyle[i.status]} text-xs border`}>{i.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {i.feedback ? (
                      <p className="text-xs text-muted-foreground max-w-[200px] truncate">{i.feedback}</p>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                        <MessageSquare className="h-3 w-3" /> Add
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
