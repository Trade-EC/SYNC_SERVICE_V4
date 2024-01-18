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
  const { vendorId, accountId, status, type } = props;
  const dbClient = await connectToDatabase();
  const response = await dbClient.collection("publishRequest").updateOne(
    {
      vendorId,
      accountId,
      $or: [{ status: "PENDING" }],
      type
    },
    { $set: { updatedAt: new Date(), status } }
  );

  return response;
};
