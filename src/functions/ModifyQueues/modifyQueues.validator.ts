import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const queuesBodyValidator = z.object({
  queue: z.enum([
    "stores-dlq",
    "products-dlq",
    "shippingCost-dlq",
    "images-dlq",
    "publish-dlq"
  ]),
  action: z.enum(["purge", "reInject"])
});
