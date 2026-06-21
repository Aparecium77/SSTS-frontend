import type { Schedule } from "@/api/interface/schedule";

export interface ResourceFilters {
  category: Schedule.ResourceCategory;
  department: string;
  status: "" | Schedule.ResourceStatus;
  keyword: string;
}
