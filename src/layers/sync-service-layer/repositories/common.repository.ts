import { SyncProductRecord } from "../types/common.types";
import { DbProduct } from "../types/products.types";
import { connectToDatabase } from "../utils/mongo.utils";

/**
 *
 * @param accountId
 * @param vendorId
 * @description Fetch draft stores
 * @returns {Promise<DbProduct[]>}
 */
export const fetchDraftStores = async (accountId: string, vendorId: string) => {
  const dbClient = await connectToDatabase();
  const stores = await dbClient
    .collection("stores")
    .find(
      {
        status: "DRAFT",
        "vendor.id": vendorId,
        accounts: { $elemMatch: { id: accountId } }
      },
      { projection: { storeId: 1, _id: 0 } }
    )
    .toArray();
  return stores;
};

/**
 *
 * @param productId
 * @description Find product by id
 * @returns {Promise<DbProduct>}
 */
export const findProduct = async (productId: string) => {
  const dbClient = await connectToDatabase();
  const product = await dbClient.collection("products").findOne({
    productId,
    $or: [{ status: "DRAFT" }, { status: "PUBLISHED" }]
  });

  return product as unknown as DbProduct;
};

/**
 *
 * @param products
 * @description Create sync records
 * @returns {Promise<void>}
 */
export const createSyncRecords = async (products: SyncProductRecord[]) => {
  const dbClient = await connectToDatabase();
  const records = products.map(product => {
    const { status, ...restProduct } = product;
    return {
      updateOne: {
        filter: { ...restProduct },
        update: { $set: { ...product } },
        upsert: true
      }
    };
  });

  return dbClient.collection("syncLists").bulkWrite(records);
};
