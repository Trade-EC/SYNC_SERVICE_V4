import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

import { PublishValidatorProps } from "./publishWebhook.types";

import { getDateNow } from "/opt/nodejs/sync-service-layer/utils/common.utils";

/**
 *
 * @param vendorId
 * @param accountId
 * @description Save publish request in publishRequest collection
 * @returns void
 */
export const savePublishRequest = async (props: PublishValidatorProps) => {
  const { vendorId, accountId, status, type, publishId } = props;
  const { error, warning } = props;
  const dbClient = await connectToDatabase();

  const updateQuery: any = {
    $set: {
      updatedAt: getDateNow(),
      status
    }
  };

  if (status === "ERROR") {
    updateQuery.$set.error = error;
    updateQuery.$set.status = status;
  }

  if (status === "WARNING" && warning) {
    updateQuery.$push = { warnings: warning };
  }

  const response = await dbClient.collection("publishRequest").updateOne(
    {
      vendorId,
      accountId,
      type,
      publishId
    },
    { ...updateQuery }
  );

  return response;
};
