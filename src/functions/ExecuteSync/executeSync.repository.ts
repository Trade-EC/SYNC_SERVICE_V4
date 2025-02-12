import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";
import { SyncRequest } from "/opt/nodejs/sync-service-layer//types/syncRequest.types";
import {
  getDateNow,
  getTodayMidnight
} from "/opt/nodejs/sync-service-layer/utils/common.utils";

import { ExecuteSyncParams } from "./executeSyncs.types";

export const fetchSyncRequests = async (params: ExecuteSyncParams) => {
  const { vendorId, status, type, requestId, dateStart, dateEnd } = params;
  const dbClient = await connectToDatabase();
  const allRecords = await dbClient
    .collection("syncRequests")
    .find(
      {
        vendorId,
        status,
        type,
        requestId: requestId ?? undefined,
        createdAt: requestId
          ? undefined
          : {
              $gte: dateStart ?? getTodayMidnight(),
              $lt: dateEnd ?? getDateNow()
            }
      },
      { ignoreUndefined: true }
    )
    .toArray();

  return allRecords as unknown as SyncRequest[];
};
