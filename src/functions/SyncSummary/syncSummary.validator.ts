import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const syncSummaryValidator = z.object({
  vendorId: z.string(),
  accountId: z.string(),
  channelId: z.string()
});
