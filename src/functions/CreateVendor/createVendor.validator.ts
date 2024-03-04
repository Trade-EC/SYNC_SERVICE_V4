import { vendorValidator } from "/opt/nodejs/sync-service-layer/validators/vendor.validator";
import { vendorValidatorRefine } from "/opt/nodejs/sync-service-layer/validators/vendor.validator";

export const createVendorValidator = vendorValidator
  .omit({
    account: true,
    channels: true
  })
  .superRefine(vendorValidatorRefine);
