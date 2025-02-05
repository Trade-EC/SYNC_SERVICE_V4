import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

import { PublishValidatorProps } from "./publishWebhook.types";

/**
 *
 * @param vendorId
 * @param accountId
 * @description Save publish request in publishRequest collection
 * @returns void
 */
export const savePublishRequest = async (props: PublishValidatorProps) => {
  const { vendorId, accountId, status, type, publishId, error } = props;
  const dbClient = await connectToDatabase();
  const response = await dbClient.collection("publishRequest").updateOne(
    {
      vendorId,
      accountId,
      $or: [{ status: "PENDING" }],
      type,
      publishId
    },
    {
      $set: {
        updatedAt: new Date(
          new Date().toLocaleString("en", { timeZone: "America/Guayaquil" })
        ),
        status,
        error: status === "ERROR" ? error : undefined
      }
    }
  );

  return response;
};
