import { getPaginatedData } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const fetchProductsByVendorRepository = async (
  accountId: string,
  vendorId: string,
  skip: number,
  limit: number,
  status?: string,
  productId?: string,
  channelId?: string,
  storeId?: string
) => {
  let statusFilter = "";
  const externalStoreId = storeId ? storeId.split(".")[3] : "";

  if (externalStoreId) {
    statusFilter += `.${externalStoreId}`;
  }

  if (channelId) {
    statusFilter += `.${channelId}`;
  }

  if (externalStoreId && !channelId) {
    statusFilter = ".";
  }

  const filter = {
    "vendor.id": vendorId,
    "account.accountId": accountId,
    status,
    productId,
    "statuses.vendorIdStoreIdChannelId": statusFilter
      ? { $regex: statusFilter }
      : undefined
  };

  const sort = { productId: 1 };
  return await getPaginatedData("products", skip, limit, filter, sort);
};
