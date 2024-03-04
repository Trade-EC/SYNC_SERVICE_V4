import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

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
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("historyProducts")
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
      { $merge: { into: "products", on: "productId", whenMatched: "replace" } }
    ])
    .toArray();

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
