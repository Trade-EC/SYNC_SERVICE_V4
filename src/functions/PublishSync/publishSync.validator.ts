import { z } from "/opt/nodejs/node_modules/zod";

export const publishSyncValidator = z.object({
  vendorId: z.string()
});
