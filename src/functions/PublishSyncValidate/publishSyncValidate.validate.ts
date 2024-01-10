import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const publishSyncValidateValidator = z.object({
  vendorId: z.string()
});

export const publishSyncQueryValidator = z.object({
  rePublish: z.boolean().optional()
});
