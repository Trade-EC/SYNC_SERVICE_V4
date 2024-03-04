import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const rollbackValidator = z.object({
  vendorId: z.string(),
  type: z.enum(["STORES", "PRODUCTS"]),
  version: z.number().int()
});
