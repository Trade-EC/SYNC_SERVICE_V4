import { SyncRequest } from "../types/syncRequest.types";
import { connectToDatabase } from "../utils/mongo.utils";

export const fetchSyncRequest = async (syncRequest: SyncRequest) => {
  const dbClient = await connectToDatabase();
  const dbSyncRequest = await dbClient
    .collection("syncRequests")
    .findOne({ ...syncRequest });

  return dbSyncRequest;
};

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
      { upsert }
    );

  return dbSyncRequest;
};
