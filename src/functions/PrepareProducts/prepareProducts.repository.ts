import { DbProduct } from "/opt/nodejs/sync-service-layer/types/products.types";
import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const deactivateStoreInProduct = async (
  productsIds: string[],
  vendorIdStoreIdChannelId: string[],
  accountId: string,
  vendorId: string
) => {
  const dbClient = await connectToDatabase();
  return dbClient.collection<DbProduct>("products").updateMany(
    {
      "account.id": accountId,
      "vendor.id": vendorId,
      productId: { $nin: productsIds },
      "statuses.vendorIdStoreIdChannelId": {
        $in: vendorIdStoreIdChannelId
      }
    },
    {
      $pullAll: {
        "statuses.$[].vendorIdStoreIdChannelId": vendorIdStoreIdChannelId, // Usamos $[] para indicar que se aplique a cada elemento del array statuses
        "images.$[].vendorIdStoreIdChannelId": vendorIdStoreIdChannelId,
        "prices.$[].vendorIdStoreIdChannelId": vendorIdStoreIdChannelId,
        "categories.$[].vendorIdStoreIdChannelId": vendorIdStoreIdChannelId
      }
    }
  );
};
