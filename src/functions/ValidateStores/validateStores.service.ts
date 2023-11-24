import { APIGatewayProxyEvent } from "aws-lambda";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";
import { fetchSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/sync-service-layer/types/syncRequest.types";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { validateStores } from "/opt/nodejs/transforms-layer/validators/store.validator";
// @ts-ignore
import sha1 from "/opt/nodejs/sync-service-layer/node_modules/sha1";

/**
 *
 * @param event
 * @description Validate stores service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const validateStoresService = async (event: APIGatewayProxyEvent) => {
  logger.info("STORE VALIDATE: INIT");
  const { body, headers } = event;
  const parsedBody = JSON.parse(body ?? "");
  const { account: accountId } = headersValidator.parse(headers);
  const channelsAndStores = validateStores(parsedBody, accountId);
  const { vendorId } = channelsAndStores;
  logger.appendKeys({ vendorId, accountId });
  logger.info("STORE VALIDATE: VALIDATING");
  const hash = sha1(JSON.stringify(channelsAndStores));
  const syncRequest: SyncRequest = {
    accountId,
    status: "PENDING",
    type: "CHANNELS_STORES",
    vendorId,
    hash
  };
  const dbSyncRequest = await fetchSyncRequest(syncRequest);
  if (dbSyncRequest) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Another sync is in progress with this configuration"
      })
    };
  }
  await saveSyncRequest(syncRequest);
  const newHeaders = { accountId };

  logger.info("STORE VALIDATE: SEND TO SQS");
  await sqsClient.sendMessage({
    QueueUrl: process.env.SYNC_STORES_SQS_URL ?? "",
    MessageBody: JSON.stringify({
      body: channelsAndStores,
      headers: { ...newHeaders }
    }),
    MessageGroupId: `${vendorId}-${accountId}`
  });

  logger.info("STORE VALIDATE: FINISHED");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "We've received your request. We'll notify you when it's done."
    })
  };
};
