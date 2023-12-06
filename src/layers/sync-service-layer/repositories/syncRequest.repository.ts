import { SyncRequest } from "../types/syncRequest.types";
import { connectToDatabase } from "../utils/mongo.utils";

/**
 *
 * @param syncRequest
 * @description Fetch sync request
 * @returns {Promise<SyncRequest>}
 */
export const fetchSyncRequest = async (syncRequest: SyncRequest) => {
  const dbClient = await connectToDatabase();
  const dbSyncRequest = await dbClient
    .collection("syncRequests")
    .findOne({ ...syncRequest });

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
    .updateOne(
      { ...syncRequest, status: "PENDING" },
      { $set: { ...syncRequest } },
      { upsert, ignoreUndefined: true }
    );

  return dbSyncRequest;
};
