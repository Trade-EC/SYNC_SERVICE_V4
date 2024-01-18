import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const fetchStoresByVendorRepository = async (
  accountId: string,
  vendorId: string,
  skip: number,
  limit: number,
  status?: string,
  storeId?: string
) => {
  const dbClient = await connectToDatabase();

  return dbClient
    .collection("products")
    .aggregate(
      [
        {
          $match: {
            "vendor.id": vendorId,
            storeId: storeId
              ? `${accountId}.${vendorId}.${storeId}`
              : undefined,
            "account.id": accountId,
            status
          }
        },
        { $skip: skip },
        { $limit: limit }
      ],
      { ignoreUndefined: true }
    )
    .toArray();
};
