import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const fetchProductsByVendorRepository = async (
  accountId: string,
  vendorId: string,
  productId?: string,
  channelId?: string,
  storeId?: string
) => {
  const dbClient = await connectToDatabase();

  let statusFilter = "";

  if (storeId) {
    statusFilter += `#${storeId}`;
  }

  if (channelId) {
    statusFilter += `#${channelId}`;
  }

  if (storeId && !channelId) {
    statusFilter = "#";
  }

  return dbClient
    .collection("products")
    .find(
      {
        "vendor.id": vendorId,
        "account.accountId": accountId,
        productId: productId ? `${accountId}#${productId}` : undefined,
        "statuses.vendorIdStoreIdChannelId": statusFilter
          ? { $regex: statusFilter }
          : undefined
      },
      { ignoreUndefined: true }
    )
    .toArray();
};
