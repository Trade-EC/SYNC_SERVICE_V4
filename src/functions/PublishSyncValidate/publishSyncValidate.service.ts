import { APIGatewayProxyEvent } from "aws-lambda";

import { publishSyncValidateValidator } from "./publishSyncValidate.validate";
import { publishSyncQueryValidator } from "./publishSyncValidate.validate";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";

/**
 *
 * @param event
 * @description Fetch stores by vendor service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const publishSyncValidateService = async (
  event: APIGatewayProxyEvent
) => {
  const { headers, body, queryStringParameters = {} } = event;
  const { rePublish } = publishSyncQueryValidator.parse(queryStringParameters);
  const parsedBody = JSON.parse(body ?? "");
  const { account: accountId } = headersValidator.parse(headers);
  const info = publishSyncValidateValidator.parse(parsedBody);
  const { vendorId } = info;

  await sqsClient.sendMessage({
    QueueUrl: process.env.SYNC_PUBLISH_SQS_URL ?? "",
    MessageBody: JSON.stringify({ vendorId, accountId, rePublish }),
    MessageGroupId: `${accountId}-${vendorId}`
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Publish sync process started"
    })
  };
};
