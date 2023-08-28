import { z } from "zod";

import { timePeriodValidator } from "../validators/common.validator";
import { scheduleValidator } from "../validators/common.validator";
import { scheduleByChannelValidator } from "../validators/store.validator";

export type ScheduleByChannel = z.infer<typeof scheduleByChannelValidator>;

export type Schedule = z.infer<typeof scheduleValidator>;

export type TimePeriod = z.infer<typeof timePeriodValidator>;

export type OldDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY"
  | "SPECIAL";

export interface OldSchedule {
  day: OldDay;
  startDate?: Schedule["startDate"];
  endDate?: Schedule["endDate"];
  from: TimePeriod["startTime"];
  to: TimePeriod["endTime"];
  catalogueId: string;
}
