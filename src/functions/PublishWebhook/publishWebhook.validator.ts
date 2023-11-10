import { z } from "/opt/nodejs/node_modules/zod";

export const publishWebhookValidator = z.object({
  vendorId: z.string(),
  accountId: z.string(),
  status: z.enum(["ERROR", "SUCCESS"])
});
