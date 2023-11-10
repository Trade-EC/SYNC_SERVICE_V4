import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";

/**
 *
 * @param vendorId
 * @param accountId
 * @description Save publish request in publishRequest collection
 * @returns void
 */
export const savePublishRequest = async (
  vendorId: string,
  accountId: string,
  status: "ERROR" | "SUCCESS"
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("publishRequest")
    .updateOne(
      { vendorId, accountId, status: "PENDING" },
      { $set: { updatedAt: new Date(), status } }
    );

  return response;
};
