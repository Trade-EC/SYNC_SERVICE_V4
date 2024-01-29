import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

import { updateVendorValidator } from "./updateVendor.validator";

export type UpdateVendorPayload = z.infer<typeof updateVendorValidator>;
