import { vendorValidator } from "/opt/nodejs/sync-service-layer/validators/vendor.validator";

export const updateVendorValidator = vendorValidator
  .omit({ vendorId: true, account: true })
  .partial();

export const updateVendorPathParameterValidator = vendorValidator.pick({
  vendorId: true
});
