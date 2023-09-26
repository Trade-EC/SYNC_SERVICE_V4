import { SyncRequest } from "../types/syncRequest.types";
import { connectToDatabase } from "../utils/mongo.utils";

export const fetchSyncRequest = async (syncRequest: SyncRequest) => {
  const dbClient = await connectToDatabase();
  const dbSyncRequest = await dbClient
    .collection("syncRequests")
    .findOne({ ...syncRequest });
  return dbSyncRequest;
};

export const saveSyncRequest = async (syncRequest: SyncRequest) => {
  const { status, ...filters } = syncRequest;
  const dbClient = await connectToDatabase();
  const dbSyncRequest = await dbClient
    .collection("syncRequests")
    .updateOne({ ...filters }, { $set: { ...syncRequest } }, { upsert: true });
  return dbSyncRequest;
};
