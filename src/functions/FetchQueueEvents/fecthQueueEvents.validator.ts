import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const queueEventsValidator = z.object({
  queue: z.enum(["stores", "products", "shippingCost", "images", "publish"])
});
