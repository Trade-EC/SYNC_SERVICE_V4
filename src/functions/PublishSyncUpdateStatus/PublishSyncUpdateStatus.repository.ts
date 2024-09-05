import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

/**
 *
 * @param vendorId
 * @param accountId
 * @description Save stores in history collection
 * @returns void
 */
export const saveStoresInHistory = async (
  vendorId: string,
  accountId: string,
  version: number,
  all: boolean
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("stores")
    .aggregate(
      [
        {
          $match: {
            "vendor.id": vendorId,
            "account.id": accountId,
            status: !all ? "DRAFT" : undefined
          }
        },
        { $addFields: { status: "DELETED", deletedAt: new Date(), version } },
        { $project: { _id: 0 } },
        { $merge: { into: "historyStores" } }
      ],
      { ignoreUndefined: true }
    )
    .toArray();

  return response;
};

/**
 *
 * @param vendorId
 * @param accountId
 * @description Save stores in history collection
 * @returns void
 */
export const saveProductsInHistory = async (
  vendorId: string,
  accountId: string,
  version: number,
  all: boolean
) => {
  const dbClient = await connectToDatabase();
  const batchSize = 50;
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await dbClient
      .collection("products")
      .aggregate(
        [
          {
            $match: {
              "vendor.id": vendorId,
              "account.accountId": accountId,
              status: !all ? "DRAFT" : undefined
            }
          },
          { $addFields: { status: "DELETED", deletedAt: new Date(), version } },
          { $project: { _id: 0 } },
          { $skip: skip },
          { $limit: batchSize },
          { $merge: { into: "historyProducts" } }
        ],
        { ignoreUndefined: true }
      )
      .toArray();

    if (response.length < batchSize) {
      hasMore = false;
      skip += response.length;
    } else {
      skip += batchSize;
    }
  }
  logger.info("UPDATE STATUS PRODUCTS: DATA", {
    productsProcess: skip,
    batchSize
  });
};

/**
 *
 * @param vendorId
 * @param accountId
 * @description Update status stores in stores collection
 * @returns void
 */
export const updateStatusStores = async (
  vendorId: string,
  accountId: string
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("stores")
    .updateMany(
      { "vendor.id": vendorId, "account.id": accountId, status: "DRAFT" },
      { $set: { status: "PUBLISHED" } }
    );

  return response;
};

/**
 *
 * @param vendorId
 * @param accountId
 * @description Update status products in products collection
 * @returns void
 */
export const updateStatusProducts = async (
  vendorId: string,
  accountId: string
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient.collection("products").updateMany(
    {
      "vendor.id": vendorId,
      "account.accountId": accountId,
      status: "DRAFT"
    },
    { $set: { status: "PUBLISHED" } }
  );

  return response;
};

export const saveVersion = async (
  vendorId: string,
  accountId: string,
  version: number,
  type: "STORES" | "PRODUCTS" | "SHIPPING_COSTS"
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient.collection("versions").insertOne({
    vendorId,
    accountId,
    version,
    createdAt: new Date(),
    type
  });

  return response;
};
