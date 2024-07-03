import { z } from "zod";

import { vendorValidator } from "../validators/vendor.validator";

export type Vendor = z.infer<typeof vendorValidator>;
// export type VendorChannels = z.infer<typeof vendorValidator>["channels"];
