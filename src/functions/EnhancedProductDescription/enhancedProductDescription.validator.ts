import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const enhancedProductDescriptionValidator = z.object({
  vendorId: z.string()
});
