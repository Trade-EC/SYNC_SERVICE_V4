import { APIGatewayProxyEvent } from "aws-lambda";

import { PrepareStoresPayload } from "../PrepareStores/prepareStores.types";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { fetchSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/sync-service-layer/types/syncRequest.types";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { validateStores } from "/opt/nodejs/transforms-layer/validators/store.validator";
import { generateSyncS3Path } from "/opt/nodejs/sync-service-layer/utils/common.utils";
import { createFileS3 } from "/opt/nodejs/sync-service-layer/utils/s3.utils";
// @ts-ignore
import sha1 from "/opt/nodejs/sync-service-layer/node_modules/sha1";
import { fetchVendor } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";

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
  const vendor = await fetchVendor(vendorId, accountId);
  if (!vendor) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "Vendor not found"
      })
    };
  }
  const { active } = vendor;
  if (!active) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "Vendor is not active"
      })
    };
  }
  const { channels: vendorChannels } = vendor;
  const hash = sha1(JSON.stringify(channelsAndStores));
  const s3Path = generateSyncS3Path(accountId, vendorId, "CHANNELS_STORES");
  const { Location } = await createFileS3(s3Path, channelsAndStores);

  const syncRequest: SyncRequest = {
    accountId,
    status: "PENDING",
    type: "CHANNELS_STORES",
    vendorId,
    hash,
    createdAt: new Date(),
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

  logger.info("STORE VALIDATE: SEND TO PREPARE STORES");
  // TODO: implement syncAll
  const payload: PrepareStoresPayload = {
    channelsAndStores,
    accountId,
    storeHash: hash,
    vendorChannels
  };

  await sqsExtendedClient.sendMessage({
    QueueUrl: process.env.PREPARE_STORES_SQS_URL ?? "",
    MessageBody: JSON.stringify(payload),
    MessageGroupId: `${accountId}-${vendorId}`
  });

  logger.info("STORE VALIDATE: FINISHED");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "We've received your request. We'll notify you when it's done."
    })
  };
};
