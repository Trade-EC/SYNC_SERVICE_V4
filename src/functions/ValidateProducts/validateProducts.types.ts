import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { productsValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";

export type Lists = z.infer<typeof productsValidator>;
