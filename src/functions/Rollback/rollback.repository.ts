import { fetchFileS3 } from "/opt/nodejs/sync-service-layer/utils/s3.utils";
import { DBVersion } from "/opt/nodejs/sync-service-layer/types/common.types";
import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";
import { DbProduct } from "/opt/nodejs/sync-service-layer/types/products.types";

export const fetchVersionRepository = async (
  accountId: string,
  vendorId: string,
  version: number,
  type: "STORES" | "PRODUCTS" | "SHIPPING_COSTS"
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("versions")
    .findOne({ accountId, vendorId, type, version }, { limit: 1 });

  return response as unknown as DBVersion;
};

export const rollbackStoresRepository = async (
  accountId: string,
  vendorId: string,
  version: number
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("historyStores")
    .aggregate([
      {
        $match: { "vendor.id": vendorId, "account.id": accountId, version }
      },
      { $addFields: { status: "DRAFT", deletedAt: null, version: null } },
      { $project: { _id: 0 } },
      { $merge: { into: "stores", on: "storeId", whenMatched: "replace" } }
    ])
    .toArray();

  return response;
};

export const rollbackProductsRepository = async (
  accountId: string,
  vendorId: string,
  version: number
) => {
  const dbVersion = await fetchVersionRepository(
    accountId,
    vendorId,
    version,
    "PRODUCTS"
  );
  if (!dbVersion?.location) {
    throw new Error("Version not found, or location not found");
  }

  const products = await fetchFileS3(dbVersion.location);

  const response = await Promise.all(
    products.map(async (product: DbProduct) => {
      const dbClient = await connectToDatabase();
      return await dbClient.collection("products").updateOne(
        {
          "vendor.id": vendorId,
          "account.accountId": accountId,
          productId: product.productId
        },
        {
          $set: {
            ...product,
            status: "DRAFT",
            deletedAt: null,
            version: null
          }
        },
        { upsert: true }
      );
    })
  );

  return response;
};

export const rollbackShippingCostRepository = async (
  accountId: string,
  vendorId: string,
  version: number
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("historyShippingCost")
    .aggregate([
      {
        $match: {
          "vendor.id": vendorId,
          "account.accountId": accountId,
          version
        }
      },
      { $addFields: { status: "DRAFT", deletedAt: null, version: null } },
      { $project: { _id: 0 } },
      {
        $merge: {
          into: "shippingCost",
          on: "shippingCostId",
          whenMatched: "replace"
        }
      }
    ])
    .toArray();
  return response;
};
