import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

/**
 *
 * @param vendorId
 * @param accountId
 * @description Save publish request in publishRequest collection
 * @returns void
 */
export const fetchSyncLists = async (
  vendorId: string,
  accountId: string,
  channelId: string,
  listId?: string
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("syncRequests")
    .find(
      {
        vendorId,
        accountId,
        "metadata.channelId": channelId,
        "metadata.listId": listId,
        type: "LISTS"
      },
      { ignoreUndefined: true }
    )
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  return response;
};
