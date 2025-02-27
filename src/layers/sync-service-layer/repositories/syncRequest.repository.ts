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
  const { requestId } = syncRequest;
  const { status, metadata, ...restFilters } = syncRequest;
  const dbClient = await connectToDatabase();
  const updateQuery = {
    $set: {
      ...syncRequest,
      updatedAt: getDateNow()
    }
  };
  let dbSyncRequest: any;
  if (requestId) {
    dbSyncRequest = await dbClient
      .collection("syncRequests")
      .updateOne(
        { requestId },
        { status, updatedAt: getDateNow() },
        { upsert, ignoreUndefined: true }
      );
  } else {
    dbSyncRequest = await dbClient
      .collection("syncRequests")
      .updateMany(
        { ...restFilters, $or: [{ status: "PENDING" }, { status: "ERROR" }] },
        updateQuery,
        { upsert, ignoreUndefined: true }
      );
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
