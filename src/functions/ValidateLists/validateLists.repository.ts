import { SyncProductRecord } from "/opt/nodejs/sync-service-layer/types/common.types";
import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

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
