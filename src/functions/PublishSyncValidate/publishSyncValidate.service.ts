import { APIGatewayProxyEvent } from "aws-lambda";

import { publishSyncValidateValidator } from "./publishSyncValidate.validator";
import { publishSyncQueryValidator } from "./publishSyncValidate.validator";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";
import { fetchMapAccount } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";

/**
 *
 * @param event
 * @description Fetch stores by vendor service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const publishSyncValidateService = async (
  event: APIGatewayProxyEvent
) => {
  const { headers, body, queryStringParameters } = event;
  const { rePublish, all } = publishSyncQueryValidator.parse(
    queryStringParameters ?? {}
  );
  const parsedBody = JSON.parse(body ?? "");
  const { account: requestAccountId, country: countryId } =
    headersValidator.parse(headers);
  let accountId = requestAccountId;
  const info = publishSyncValidateValidator.parse(parsedBody);
  const { vendorId } = info;
  const mapAccount = await fetchMapAccount(accountId);
  if (mapAccount) accountId = mapAccount;

  if (!vendorId.startsWith(`${accountId}.${countryId}`)) {
    throw new Error("Vendor not match");
  }

  await sqsExtendedClient.sendMessage({
    QueueUrl: process.env.SYNC_PUBLISH_SQS_URL ?? "",
    MessageBody: JSON.stringify({
      vendorId,
      accountId,
      rePublish,
      all
    })
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Publish sync process started"
    })
  };
};
