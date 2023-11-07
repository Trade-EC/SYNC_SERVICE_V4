import { APIGatewayProxyEvent } from "aws-lambda";

import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { transformKFCStores } from "/opt/nodejs/transforms/kfcStore.transform";
import { sqsClient } from "/opt/nodejs/configs/config";
import { fetchSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { channelsAndStoresValidator } from "/opt/nodejs/validators/store.validator";
import { logger } from "/opt/nodejs/configs/observability.config";
// @ts-ignore
import sha1 from "/opt/nodejs/node_modules/sha1";

import { ChannelsAndStores } from "./validateStores.types";

const kfcAccounts = ["1", "9"];

/**
 *
 * @param event
 * @description Validate stores service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const validateStoresService = async (event: APIGatewayProxyEvent) => {
  logger.info("STORE VALIDATE: INIT");
  const { body, headers, requestContext } = event;
  const { requestId: xArtisnTraceId } = requestContext;
  const parsedBody = JSON.parse(body ?? "");
  const { account: accountId } = headersValidator.parse(headers);
  let channelsAndStores;
  if (kfcAccounts.includes(accountId)) {
    channelsAndStores = transformKFCStores(
      parsedBody,
      channelsAndStoresValidator
    ) as ChannelsAndStores;
  } else {
    channelsAndStores = channelsAndStoresValidator.parse(parsedBody);
  }
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
      headers: { ...newHeaders, xArtisnTraceId }
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
