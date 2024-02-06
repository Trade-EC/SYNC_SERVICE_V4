import { DBStore } from "./createStores.types";

import { saveSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { SyncStoreRecord } from "/opt/nodejs/sync-service-layer/types/common.types";
import { SyncRequest } from "/opt/nodejs/sync-service-layer/types/syncRequest.types";
import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const findStore = async (storeId: string) => {
  const dbClient = await connectToDatabase();
  const store = await dbClient.collection("stores").findOne({
    storeId,
    $or: [{ status: "DRAFT" }, { status: "PUBLISHED" }]
  });

  return store as unknown as DBStore;
};

/**
 * @param stores DbStores to create or update
 * @returns void
 */

export const createOrUpdateStores = async (store: DBStore) => {
  const dbClient = await connectToDatabase();
  const { storeId } = store;
  return await dbClient
    .collection("stores")
    .updateMany(
      { storeId, $or: [{ status: "DRAFT" }, { status: "PUBLISHED" }] },
      { $set: { ...store } },
      { upsert: true }
    );
};

/**
 *
 * @param register {@link SyncStoreRecord}
 * @param storeHash string
 * @description Verify if sync list is success
 * @returns {Promise<void>}
 */
export const verifyCompletedStore = async (
  register: SyncStoreRecord,
  storeHash: string
) => {
  const { status, storeId, ...registerFilter } = register;
  const { accountId, vendorId } = registerFilter;
  const dbClient = await connectToDatabase();
  await dbClient
    .collection("syncStores")
    .updateOne(
      { vendorId, accountId, storeId },
      { $set: { status: "SUCCESS" } },
      { upsert: false }
    );
  const allRecords = await dbClient
    .collection("syncStores")
    .find({ ...registerFilter })
    .toArray();

  const allSuccess = allRecords.every(record => record.status === "SUCCESS");

  if (allSuccess) {
    const syncRequest: SyncRequest = {
      accountId,
      status: "SUCCESS",
      vendorId,
      hash: storeHash,
      type: "CHANNELS_STORES",
      metadata: {}
    };

    await saveSyncRequest(syncRequest, false);
    await dbClient.collection("syncStores").deleteMany({ accountId, vendorId });
  }
};
