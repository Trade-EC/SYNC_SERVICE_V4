import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const fetchHistoryStoresByVersionValidator = z.object({
  vendorId: z.string(),
  version: z.coerce.number().int(),
  skip: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().optional()
});
