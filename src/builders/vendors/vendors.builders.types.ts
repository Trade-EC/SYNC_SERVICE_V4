import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { vendorChannelsValidator } from "/opt/nodejs/sync-service-layer/validators/vendor.validator";
import { vendorValidator } from "/opt/nodejs/sync-service-layer/validators/vendor.validator";

export type Vendor = z.infer<typeof vendorValidator>;
export type VendorChannel = z.infer<typeof vendorChannelsValidator>;
