import { DbProduct } from "/opt/nodejs/sync-service-layer/types/products.types";
import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const getDbProductToDeactivate = async (
  productsIds: string[],
  vendorIdStoreIdChannelId: string[],
  accountId: string,
  vendorId: string,
  countryId: string
) => {
  const dbClient = await connectToDatabase();
  return dbClient
    .collection<DbProduct>("products")
    .find({
      "account.accountId": accountId,
      "vendor.id": `${accountId}.${countryId}.${vendorId}`,
      productId: { $nin: productsIds },
      "statuses.vendorIdStoreIdChannelId": {
        $in: vendorIdStoreIdChannelId
      }
    })
    .toArray();
};
