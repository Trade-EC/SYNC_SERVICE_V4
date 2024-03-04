import { ErrorSyncRequest, SyncRequest } from "../types/syncRequest.types";
import { connectToDatabase } from "../utils/mongo.utils";

/**
 *
 * @param syncRequest
 * @description Fetch sync request
 * @returns {Promise<SyncRequest>}
 */
export const fetchSyncRequest = async (syncRequest: SyncRequest) => {
  const { createdAt, s3Path, ...restFilters } = syncRequest;
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
  const dbClient = await connectToDatabase();
  const dbSyncRequest = await dbClient
    .collection("syncRequests")
    .updateMany(
      { ...syncRequest, status: "PENDING" },
      { $set: { ...syncRequest, updatedAt: new Date() } },
      { upsert, ignoreUndefined: true }
    );

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
        updatedAt: new Date()
      }
    }
  );

  return dbSyncRequest;
};
