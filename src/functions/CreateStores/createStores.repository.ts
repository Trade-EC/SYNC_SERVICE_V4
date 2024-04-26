import { CreateStoreProps, DBStore } from "./createStores.types";

import {
  saveErrorSyncRequest,
  saveSyncRequest
} from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
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
  const { accountId, vendorId, requestId, countryId } = registerFilter;
  const commonFilters = { accountId, vendorId, requestId };
  const dbClient = await connectToDatabase();
  await dbClient
    .collection("syncStores")
    .updateOne(
      { storeId, ...commonFilters },
      { $set: { status: "SUCCESS" } },
      { upsert: false }
    );
  const allRecords = await dbClient
    .collection("syncStores")
    .find({ ...registerFilter })
    .toArray();

  const pendingExists = allRecords.some(record => record.status === "PENDING");
  const allSuccess = allRecords.every(record => record.status === "SUCCESS");
  const errorExists = allRecords.some(record => record.status === "ERROR");

  const syncRequest: SyncRequest = {
    accountId,
    countryId,
    status: "SUCCESS",
    vendorId,
    hash: storeHash,
    type: "CHANNELS_STORES",
    metadata: {},
    requestId
  };
  if (allSuccess && !pendingExists) {
    await saveSyncRequest(syncRequest, false);
    await dbClient.collection("syncStores").deleteMany(commonFilters);
  }

  if (errorExists && !pendingExists) {
    await saveErrorSyncRequest(syncRequest);
  }
};

export const updateErrorStoreSyncRecord = async (
  register: SyncStoreRecord,
  errorMessage: string
) => {
  const dbClient = await connectToDatabase();
  await dbClient
    .collection("syncStores")
    .updateOne({ ...register }, { $set: { status: "ERROR", errorMessage } });
};

export const errorCreateStore = async (
  props: CreateStoreProps,
  errorMessage: string
) => {
  const { storeHash, body, requestId } = props;
  const { accountId, vendorId, countryId } = body;
  const { store } = body;
  const { storeId } = store;
  const commonFilters = {
    storeId: `${accountId}.${countryId}.${vendorId}.${storeId}`,
    accountId,
    countryId,
    vendorId,
    status: "PENDING" as const,
    hash: storeHash,
    requestId
  };

  await updateErrorStoreSyncRecord(commonFilters, errorMessage);

  const dbClient = await connectToDatabase();
  const allRecords = await dbClient
    .collection("syncStores")
    .find(
      { ...commonFilters, storeId: undefined, status: undefined },
      { ignoreUndefined: true }
    )
    .toArray();

  const pendingExists = allRecords.some(record => record.status === "PENDING");
  const errorExists = allRecords.some(record => record.status === "ERROR");

  if (!pendingExists && errorExists) {
    await saveErrorSyncRequest({
      accountId,
      vendorId,
      hash: storeHash,
      type: "CHANNELS_STORES",
      metadata: {}
    });
  }
};
