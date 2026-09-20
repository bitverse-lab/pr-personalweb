import type { ApplicationStatus, WorkMode } from "@/db/schema/career";

export interface ApplicationDto {
  id: string;
  companyId: string;
  companyName: string;
  roleTitle: string;
  status: ApplicationStatus;
  location: string | null;
  workMode: WorkMode | null;
  jobUrl: string | null;
  salaryRange: string | null;
  appliedAt: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpcomingInterviewDto {
  id: string;
  applicationId: string;
  startAt: Date;
  status: string;
}
