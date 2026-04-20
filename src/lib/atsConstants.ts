import type { Database } from "@/integrations/supabase/types";

export type JobStatus = Database["public"]["Enums"]["job_status"];
export type ApplicationStage = Database["public"]["Enums"]["application_stage"];
export type InterviewType = Database["public"]["Enums"]["interview_type"];
export type InterviewStatus = Database["public"]["Enums"]["interview_status"];

export const JOB_STATUSES: JobStatus[] = ["open", "on_hold", "closed"];
export const APPLICATION_STAGES: ApplicationStage[] = [
  "applied",
  "screened",
  "submitted",
  "interview",
  "selected",
  "rejected",
];
export const INTERVIEW_TYPES: InterviewType[] = ["phone", "video", "in_person"];
export const INTERVIEW_STATUSES: InterviewStatus[] = ["scheduled", "completed", "cancelled"];

export const stageLabel: Record<ApplicationStage, string> = {
  applied: "Applied",
  screened: "Screened",
  submitted: "Submitted",
  interview: "Interview",
  selected: "Selected",
  rejected: "Rejected",
};

export const jobStatusLabel: Record<JobStatus, string> = {
  open: "Open",
  on_hold: "On Hold",
  closed: "Closed",
};

export const interviewTypeLabel: Record<InterviewType, string> = {
  phone: "Phone",
  video: "Video",
  in_person: "In-Person",
};

export const interviewStatusLabel: Record<InterviewStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const stageColors: Record<ApplicationStage, string> = {
  applied: "bg-info/10 text-info border-info/20",
  screened: "bg-warning/10 text-warning border-warning/20",
  submitted: "bg-accent/10 text-accent border-accent/20",
  interview: "bg-primary/10 text-primary border-primary/20",
  selected: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export const jobStatusColors: Record<JobStatus, string> = {
  open: "bg-success/10 text-success border-success/20",
  closed: "bg-muted text-muted-foreground border-border",
  on_hold: "bg-warning/10 text-warning border-warning/20",
};

export const interviewStatusColors: Record<InterviewStatus, string> = {
  scheduled: "bg-info/10 text-info border-info/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};
