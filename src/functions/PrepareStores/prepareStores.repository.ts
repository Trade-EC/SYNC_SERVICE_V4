import { SyncStoreRecord } from "/opt/nodejs/sync-service-layer/types/common.types";
import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const createSyncStoresRecords = async (stores: SyncStoreRecord[]) => {
  const dbClient = await connectToDatabase();
  const records = stores.map(store => {
    const { status, ...restStore } = store;
    return {
      updateOne: {
        filter: { ...restStore },
        update: { $set: { ...store } },
        upsert: true
      }
    };
  });

  return dbClient.collection("syncStores").bulkWrite(records);
};
