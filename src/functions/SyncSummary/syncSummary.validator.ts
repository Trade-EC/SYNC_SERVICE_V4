import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const syncSummaryValidator = z.object({
  vendorId: z.string().optional(),
  channelId: z.string().optional(),
  listId: z.string().optional()
});
