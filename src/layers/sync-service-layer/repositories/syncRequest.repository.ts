import { v4 as uuid } from "uuid";

import { ErrorSyncRequest, SyncRequest } from "../types/syncRequest.types";
import { getDateNow } from "../utils/common.utils";
import { connectToDatabase } from "../utils/mongo.utils";

/**
 *
 * @param syncRequest
 * @description Fetch sync request
 * @returns {Promise<SyncRequest>}
 */
export const fetchSyncRequest = async (syncRequest: SyncRequest) => {
  const { createdAt, s3Path, metadata, ...restFilters } = syncRequest;
  const dbClient = await connectToDatabase();
  const dbSyncRequest = await dbClient
    .collection("syncRequests")
    .findOne({ ...restFilters });

  return dbSyncRequest;
};

/**
 *
 * @param syncRequest
 * @param upsert
 * @description Save sync request
 * @returns {void}
 */
export const saveSyncRequest = async (
  syncRequest: SyncRequest,
  upsert = true
) => {
  const { requestId: request } = syncRequest;
  const { status } = syncRequest;
  let dbSyncRequest: any;
  const dbClient = await connectToDatabase();
  const requestId = request ?? uuid();
  const syncRequestDb = await dbClient
    .collection("syncRequests")
    .findOne({ requestId });

  if (syncRequestDb) {
    dbSyncRequest = await dbClient
      .collection("syncRequests")
      .updateOne(
        { requestId },
        { $set: { status, updatedAt: getDateNow() } },
        { upsert, ignoreUndefined: true }
      );
  } else {
    dbSyncRequest = await dbClient.collection("syncRequests").insertOne({
      ...syncRequest,
      requestId,
      createdAt: getDateNow(),
      updatedAt: getDateNow()
    });
  }

  return dbSyncRequest;
};

export const saveErrorSyncRequest = async (
  errorSyncRequest: ErrorSyncRequest
) => {
  const dbClient = await connectToDatabase();
  const dbSyncRequest = await dbClient.collection("syncRequests").updateMany(
    { ...errorSyncRequest, status: "PENDING" },
    {
      $set: {
        status: "ERROR",
        updatedAt: getDateNow()
      }
    }
  );

  return dbSyncRequest;
};
