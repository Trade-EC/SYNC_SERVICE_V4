import { z } from "zod";

import { schedulesByChannelValidator } from "../validators/common.validator";
import { taxesValidator } from "../validators/common.validator";
import { scheduleValidator } from "../validators/common.validator";
import { dbImageValidator } from "../validators/database.validator";

export type TaxInfo = z.infer<typeof taxesValidator>;

export type Schedule = z.infer<typeof scheduleValidator>;

export type ScheduleByChannel = z.infer<typeof schedulesByChannelValidator>;

export type DbImage = z.infer<typeof dbImageValidator>;

export interface SchemaSchedule
  extends Pick<Schedule, "day" | "startDate" | "endDate"> {
  catalogueId: string;
  from: number;
  to: number;
}

export interface HeadersProps {
  accountId: string;
}

export interface SyncProductRecord {
  productId: string;
  listId: string;
  accountId: string;
  channelId: string;
  vendorId: string;
  storeId: string;
  status: "PENDING" | "SUCCESS";
}

export interface SyncStoreRecord {
  accountId: string;
  vendorId: string;
  storeId: string;
  status: "PENDING" | "SUCCESS";
}
