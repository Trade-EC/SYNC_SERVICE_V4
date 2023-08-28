import { z } from "zod";

export const imageValidator = z.object({
  url: z.string(),
  name: z.string(),
  key: z.string(),
  cloudFrontUrl: z.string(),
  bucket: z.string(),
  type: z.string()
});

export const translationValidator = z.object({
  translations: z.object({
    es_es: z.string(),
    en_us: z.string()
  })
});

export const timePeriodValidator = z.object({
  startTime: z.number().int(),
  endTime: z.number().int(),
  utcOffset: z.string()
});

export const yesNoValidator = z.union([z.literal("YES"), z.literal("NO")]);

export const scheduleValidator = z.object({
  dayOfWeek: z.union([
    z.literal("EVERYDAY"),
    z.literal("WEEKDAYS"),
    z.literal("MONDAY"),
    z.literal("MONDAY"),
    z.literal("TUESDAY"),
    z.literal("WEDNESDAY"),
    z.literal("THURSDAY"),
    z.literal("FRIDAY"),
    z.literal("SATURDAY"),
    z.literal("SUNDAY"),
    z.literal("SPECIAL")
  ]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  timePeriods: z.array(timePeriodValidator)
});

export const oldScheduleValidator = z.object({
  day: z.union([
    z.literal("MONDAY"),
    z.literal("MONDAY"),
    z.literal("TUESDAY"),
    z.literal("WEDNESDAY"),
    z.literal("THURSDAY"),
    z.literal("FRIDAY"),
    z.literal("SATURDAY"),
    z.literal("SUNDAY"),
    z.literal("SPECIAL")
  ]),
  from: z.number().int(),
  to: z.number().int(),
  utcOffset: z.string()
});

export const commonAttributesValidator = z.object({
  externalId: z.string(),
  showInMenu: z.boolean()
});
