import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const fetchStoresByVendorRepository = async (
  accountId: string,
  vendorId: string,
  storeId?: string
) => {
  const dbClient = await connectToDatabase();

  return dbClient
    .collection("stores")
    .find(
      {
        "vendor.id": vendorId,
        storeId: storeId ? `${accountId}#${storeId}` : undefined,
        "account.id": accountId
      },
      { ignoreUndefined: true }
    )
    .toArray();
};
