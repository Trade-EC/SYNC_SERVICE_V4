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

export const deactivateStores = async (
  storeIds: string[],
  accountId: string,
  vendorId: string
) => {
  const dbClient = await connectToDatabase();
  return dbClient.collection("syncStores").updateMany(
    {
      "account.id": accountId,
      "vendor.id": vendorId,
      storeId: { $not: { $in: storeIds } }
    },
    { $set: { active: false } }
  );
};
