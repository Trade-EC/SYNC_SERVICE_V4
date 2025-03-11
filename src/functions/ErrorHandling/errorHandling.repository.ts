import { getDateNow } from "/opt/nodejs/sync-service-layer/utils/common.utils";
import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const saveErrorRecord = async (
  lambdaName: string,
  errorMessage: any
) => {
  const dbClient = await connectToDatabase();
  const errorRecord = dbClient.collection("errorRecords").insertOne({
    lambdaName,
    errorMessage,
    createdAt: getDateNow()
  });
  return errorRecord;
};
