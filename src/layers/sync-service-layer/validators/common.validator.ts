import { z } from "zod";

export const taxesValidator = z.object({
  taxRate: z.number().optional(),
  vatRatePercentage: z.number().optional()
});

export const scheduleValidator = z.object({
  // TODO: Confirmar SPECIAL
  day: z.union([
    z.literal("MONDAY"),
    z.literal("TUESDAY"),
    z.literal("WEDNESDAY"),
    z.literal("THURSDAY"),
    z.literal("FRIDAY"),
    z.literal("SATURDAY"),
    z.literal("SUNDAY"),
    z.literal("SPECIAL")
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
