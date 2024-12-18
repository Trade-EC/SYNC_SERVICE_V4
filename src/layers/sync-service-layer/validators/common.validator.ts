import { z } from "zod";

export const timeRegExp = new RegExp("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$");

export const additionalInfoValidator = z.record(z.string().min(1), z.any());

export const taxesValidator = z.array(
  z.object({
    name: z.string().optional(),
    type: z.enum(["IVA", "ICE", "SERVICIO", "OTROS"]).optional(),
    vatRatePercentage: z.number()
  })
);

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
  imageCategoryId: z.string().max(45),
  fileUrl: z.string()
});

export const schedulesByChannelValidator = z.object({
  channelId: z.string(),
  schedules: z.array(scheduleValidator)
});

export const headersValidator = z.object({
  account: z.string().min(1),
  country: z.string().min(1)
});

export const syncHeadersValidator = z.object({
  account: z.string(),
  country: z.string()
});

export const productsQueryParamsValidator = z.object({
  type: z.enum(["INCREMENTAL", "ALL"]).optional()
});

export const timeValidator = z.string().superRefine((value, ctx) => {
  const isValid = timeRegExp.test(value);
  if (!isValid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid time format"
    });
  }
});
