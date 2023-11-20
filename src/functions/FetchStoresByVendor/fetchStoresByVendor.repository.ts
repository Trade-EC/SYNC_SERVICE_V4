import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";

export const fetchStoresByVendorRepository = async (
  accountId: string,
  vendorId: string,
  storeId?: string
) => {
  const dbClient = await connectToDatabase();

  return dbClient
    .collection("stores")
    .find(
      { "vendor.id": vendorId, storeId, "account.id": accountId },
      { ignoreUndefined: true }
    )
    .toArray();
};
