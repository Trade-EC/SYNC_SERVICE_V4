import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const fetchPublishRequest = async (
  accountId: string,
  vendorId: string
) => {
  const dbClient = await connectToDatabase();
  const dbPublishRequest = await dbClient
    .collection("publishRequest")
    .find({ accountId, vendorId, status: "PENDING" })
    .toArray();

  return dbPublishRequest;
};
