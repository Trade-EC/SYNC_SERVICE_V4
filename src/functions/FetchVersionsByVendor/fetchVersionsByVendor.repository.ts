import { getPaginatedData } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const fetchVersionsByVendorRepository = async (
  accountId: string,
  vendorId: string,
  type: "STORES" | "PRODUCTS" | "SHIPPING_COSTS",
  skip: number,
  limit: number
) => {
  const filter = {
    vendorId,
    accountId,
    type
  };

  const sort = {
    version: -1
  };

  return await getPaginatedData("versions", skip, limit, filter, sort);
};
