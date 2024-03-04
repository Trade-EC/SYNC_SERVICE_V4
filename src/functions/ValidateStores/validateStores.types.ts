import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { storeValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { vendorValidator } from "/opt/nodejs/sync-service-layer/validators/vendor.validator";

export type Store = z.infer<typeof storeValidator>;
export type Vendor = z.infer<typeof vendorValidator>;
