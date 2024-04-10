import { z } from "zod";

import { timeValidator } from "./common.validator";

export const vendorChannelsValidator = z.object({
  channelId: z.string(),
  name: z.string(),
  active: z.boolean(),
  mediaId: z.string().optional(),
  ecommerceChannelId: z.string().nullable(),
  channelReferenceName: z.string().nullable()
});

export const vendorValidatorRefine = <T extends z.ZodObject<any>>(
  value: z.infer<T>,
  ctx: z.RefinementCtx
) => {
  const isEveryday = value.syncTimeUnit === "EVERYDAY";

  if (isEveryday) {
    const timeResult = timeValidator.safeParse(value.syncTimeValue);
    if (!timeResult.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "syncTimeValue should be a valid time format when syncTimeUnit is EVERYDAY",
        path: ["syncTimeValue"]
      });
    }
  } else {
    const syncTimeValueResult = z.number().int().safeParse(value.syncTimeValue);
    if (!syncTimeValueResult.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "syncTimeValue should be an integer when syncTimeUnit is HOURS",
        path: ["syncTimeValue"]
      });
    }
  }
};

export const vendorValidator = z.object({
  vendorId: z.string(),
  account: z.object({
    accountId: z.string()
  }),
  active: z.boolean(),
  name: z.string(),
  syncTimeUnit: z.enum(["EVERYDAY", "HOURS"]),
  syncTimeValue: z.number().or(timeValidator),
  channels: vendorChannelsValidator.array(),
  countryId: z.string(),
  externalId: z.string()
});
