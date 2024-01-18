import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

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
  const dbClient = await connectToDatabase();

  let statusFilter = "";

  if (storeId) {
    statusFilter += `.${storeId}`;
  }

  if (channelId) {
    statusFilter += `.${channelId}`;
  }

  if (storeId && !channelId) {
    statusFilter = ".";
  }

  return dbClient
    .collection("products")
    .aggregate(
      [
        {
          $match: {
            "vendor.id": vendorId,
            "account.accountId": accountId,
            status,
            productId: productId
              ? `${accountId}.${vendorId}.${productId}`
              : undefined,
            "statuses.vendorIdStoreIdChannelId": statusFilter
              ? { $regex: statusFilter }
              : undefined
          }
        },
        { $skip: skip },
        { $limit: limit }
      ],
      { ignoreUndefined: true }
    )
    .toArray();
};
