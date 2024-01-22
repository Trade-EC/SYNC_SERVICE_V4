import { z } from "zod";

export const additionalInfoValidator = z.record(z.string().min(1), z.any());

export const taxesValidator = z.object({
  taxRate: z.number().optional(),
  vatRatePercentage: z.number().optional()
});

export const scheduleValidator = z.object({
  day: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
    "SPECIAL"
  ]),
  // TODO: Validador especial
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // TODO: Validador especial
  startTime: z.string(),
  // TODO: Validador especial
  endTime: z.string()
});

export const imageValidator = z.object({
  imageCategoryId: z.string().max(45).or(z.number().int()),
  fileUrl: z.string()
});

export const schedulesByChannelValidator = z.object({
  channelId: z.string(),
  schedules: z.array(scheduleValidator)
});

export const headersValidator = z.object({
  account: z.string().min(1)
});

export const syncHeadersValidator = z.object({
  account: z.string(),
  country: z.string()
});

export const productsQueryParamsValidator = z.object({
  type: z.enum(["INCREMENTAL", "ALL"]).optional()
});
