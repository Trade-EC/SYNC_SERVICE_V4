import { z } from "zod";

export const vendorChannelsValidator = z.object({
  channelId: z.string(),
  name: z.string(),
  active: z.boolean(),
  mediaId: z.string().optional(),
  ecommerceChannelId: z.string().nullable(),
  channelReferenceName: z.string().nullable()
});

export const vendorValidator = z.object({
  vendorId: z.string(),
  account: z.object({
    accountId: z.string()
  }),
  active: z.boolean(),
  name: z.string(),
  syncTime: z.string(),
  channels: vendorChannelsValidator.array()
});
