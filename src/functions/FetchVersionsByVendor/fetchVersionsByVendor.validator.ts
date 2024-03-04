import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const fetchVersionsByVendorValidator = z.object({
  vendorId: z.string(),
  type: z.enum(["STORES", "PRODUCTS", "SHIPPING_COSTS"]),
  skip: z.coerce.number().optional(),
  limit: z.coerce.number().optional()
});
