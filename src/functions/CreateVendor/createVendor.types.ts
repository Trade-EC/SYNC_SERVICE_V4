import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

import { createVendorValidator } from "./createVendor.validator";

export type CreateVendorPayload = z.infer<typeof createVendorValidator>;
