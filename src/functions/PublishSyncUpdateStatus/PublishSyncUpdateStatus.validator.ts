import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const publishSyncUpStatusValidator = z.object({
  vendorId: z.string(),
  accountId: z.string(),
  version: z.number(),
  all: z.boolean().optional(),
  type: z.enum(["STORES", "PRODUCTS"])
});
