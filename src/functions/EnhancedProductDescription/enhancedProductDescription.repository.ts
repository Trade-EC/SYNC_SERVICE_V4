import { ProductDescription } from "./enhancedProductDescription.types";

import { DbProduct } from "/opt/nodejs/sync-service-layer/types/products.types";
import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const fetchProductsByVendor = async (
  accountId: string,
  vendorId: string
) => {
  const dbClient = await connectToDatabase();
  return dbClient
    .collection<DbProduct>("products")
    .find(
      {
        "account.accountId": accountId,
        "vendor.id": vendorId
      },
      {
        projection: {
          _id: 0,
          productId: 1,
          categories: 1,
          description: 1,
          name: 1
        }
      }
    )
    .toArray() as unknown as DbProduct[];
};

export const addAiDescriptionRecords = async (
  descriptions: ProductDescription[]
) => {
  const dbClient = await connectToDatabase();
  const records = descriptions.map(descriptions => {
    const { productId, aiDescription } = descriptions;
    return {
      updateOne: {
        filter: { productId },
        update: { $set: { aiDescription } },
        upsert: true
      }
    };
  });

  return dbClient.collection("products").bulkWrite(records);
};
