import { getPaginatedData } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const fetchStoresByVendorRepository = async (
  accountId: string,
  vendorId: string,
  skip: number,
  limit: number,
  status?: string,
  storeId?: string
) => {
  const filter = {
    "vendor.id": vendorId,
    storeId: storeId ? `${vendorId}.${storeId}` : undefined,
    "account.id": accountId,
    status
  };

  const sort = { productId: 1 };
  return await getPaginatedData("stores", skip, limit, filter, sort);
};
