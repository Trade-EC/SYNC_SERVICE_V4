import { z } from "zod";

import { schedulesByChannelValidator } from "../validators/common.validator";
import { taxesValidator } from "../validators/common.validator";
import { scheduleValidator } from "../validators/common.validator";

export type TaxInfo = z.infer<typeof taxesValidator>;

export type Schedule = z.infer<typeof scheduleValidator>;

export type ScheduleByChannel = z.infer<typeof schedulesByChannelValidator>;

export interface SchemaSchedule
  extends Pick<Schedule, "day" | "startDate" | "endDate"> {
  catalogueId: string;
  from: number;
  to: number;
}
