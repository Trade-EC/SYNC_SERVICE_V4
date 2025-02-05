import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const publishWebhookValidator = z.object({
  vendorId: z.string(),
  accountId: z.string(),
  status: z.enum(["ERROR", "SUCCESS"]),
  type: z.enum(["PRODUCTS", "STORES"]),
  publishId: z.string(),
  error: z.string().optional()
});
