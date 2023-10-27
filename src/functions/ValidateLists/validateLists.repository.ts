import { SyncProductRecord } from "/opt/nodejs/types/common.types";
import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";

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
