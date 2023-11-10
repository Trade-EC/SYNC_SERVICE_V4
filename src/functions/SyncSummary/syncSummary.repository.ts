import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";

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
  channelId: string
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("syncRequests")
    .find({ vendorId, channelId, accountId, type: "LIST" })
    .toArray();
  return response;
};
