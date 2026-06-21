import type { Schedule } from "@/api/interface/schedule";

export interface PublishFilters {
  status: "" | Schedule.PublishStatus;
  keyword: string;
}
