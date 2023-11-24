import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const publishSyncValidator = z.object({
  vendorId: z.string()
});
