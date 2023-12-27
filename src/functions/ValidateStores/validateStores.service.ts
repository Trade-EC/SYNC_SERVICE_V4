import { APIGatewayProxyEvent } from "aws-lambda";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";
import { fetchSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/sync-service-layer/types/syncRequest.types";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { validateStores } from "/opt/nodejs/transforms-layer/validators/store.validator";
import { generateSyncS3Path } from "/opt/nodejs/sync-service-layer/utils/common.utils";
import { createFileS3 } from "/opt/nodejs/sync-service-layer/utils/s3.utils";
// @ts-ignore
import sha1 from "/opt/nodejs/sync-service-layer/node_modules/sha1";

import { createSyncStoresRecords } from "./validateStores.repository";
import { ChannelsAndStores } from "./validateStores.types";

export const syncStores = async (
  channelsAndStores: ChannelsAndStores,
  accountId: string,
  storeHash: string,
  syncAll = false
) => {
  const { stores, vendorId } = channelsAndStores;
  const syncProducts = stores.map(store => {
    const { storeId } = store;
    return {
      storeId: `${accountId}.${vendorId}.${storeId}`,
      accountId,
      vendorId,
      status: "PENDING" as const
    };
  });
  logger.info("STORE VALIDATE: CREATING SYNC STORE RECORDS");
  await createSyncStoresRecords(syncProducts);

  const productsPromises = stores.map(async store => {
    const { storeId } = store;
    const body = { store, accountId, vendorId, storeId };
    const messageBody = { body, storeHash, syncAll };

    await sqsClient.sendMessage({
      QueueUrl: process.env.SYNC_STORES_SQS_URL ?? "",
      MessageBody: JSON.stringify(messageBody),
      MessageGroupId: `${accountId}-${vendorId}-${storeId}`
    });
  });

  logger.info("STORE VALIDATE: SEND TO SQS");
  const promises = await Promise.all(productsPromises);

  return promises;
};

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
  const headersValidate = headersValidator.parse(headers);
  const { account: accountId } = headersValidate;
  // const { Account: accountId = "0" } = headers;
  const channelsAndStores = validateStores(parsedBody, accountId);
  const { vendorId } = channelsAndStores;
  logger.appendKeys({ vendorId, accountId });
  logger.info("STORE VALIDATE: VALIDATING");
  const hash = sha1(JSON.stringify(channelsAndStores));
  const s3Path = generateSyncS3Path(accountId, vendorId, "CHANNELS_STORES");
  const { Location } = await createFileS3(s3Path, channelsAndStores);

  const syncRequest: SyncRequest = {
    accountId,
    status: "PENDING",
    type: "CHANNELS_STORES",
    vendorId,
    hash,
    createdAt: new Date().toISOString(),
    s3Path: Location,
    metadata: {}
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

  logger.info("STORE VALIDATE: TRANSFORMING STORES");
  // TODO: implement syncAll
  await syncStores(channelsAndStores, accountId, hash);

  logger.info("STORE VALIDATE: FINISHED");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "We've received your request. We'll notify you when it's done."
    })
  };
};
