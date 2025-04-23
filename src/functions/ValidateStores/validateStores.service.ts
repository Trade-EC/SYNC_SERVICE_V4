import { APIGatewayProxyEvent } from "aws-lambda";

import { handleError } from "/opt/nodejs/sync-service-layer/utils/error.utils";

import { PrepareStoresPayload } from "../PrepareStores/prepareStores.types";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { fetchSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/sync-service-layer/types/syncRequest.types";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { validateStores } from "/opt/nodejs/transforms-layer/validators/store.validator";
import {
  genErrorResponse,
  getDateNow
} from "/opt/nodejs/sync-service-layer/utils/common.utils";
import { generateSyncS3Path } from "/opt/nodejs/sync-service-layer/utils/common.utils";
import { createFileS3 } from "/opt/nodejs/sync-service-layer/utils/s3.utils";
// @ts-ignore
import sha1 from "/opt/nodejs/sync-service-layer/node_modules/sha1";
import { fetchMapAccount } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
import { fetchVendor } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";
// @ts-ignore
import { v4 as uuid } from "/opt/nodejs/sync-service-layer/node_modules/uuid";
import { fetchAccount } from "/opt/nodejs/sync-service-layer/repositories/accounts.repository";
import { fetchChannels } from "/opt/nodejs/sync-service-layer/repositories/channels.repository";

/**
 *
 * @param event
 * @description Validate stores service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const validateStoresService = async (event: APIGatewayProxyEvent) => {
  const requestUid = uuid();
  const { body, headers } = event;
  const parsedBody = JSON.parse(body ?? "");
  const headersValidate = headersValidator.parse(headers);
  const { account: requestAccountId, country: countryId } = headersValidate;
  // const { Account: accountId = "0" } = headers;
  let accountId = requestAccountId;
  try {
    logger.info("STORE VALIDATE: INIT");
    const channelsAndStores = validateStores(parsedBody, accountId);
    const { vendorId } = channelsAndStores;
    logger.appendKeys({
      vendorId,
      accountId,
      requestId: requestUid,
      countryId
    });
    logger.info("STORE VALIDATE: VALIDATING");
    const mapAccount = await fetchMapAccount(accountId);
    if (mapAccount) accountId = mapAccount;
    const account = await fetchAccount(accountId);
    // Validaciones
    if (!account) return genErrorResponse(404, "Account not found");
    const { active: accountActive, isSyncActive: accountIsSyncActive } =
      account;
    if (!accountActive) return genErrorResponse(404, "Account is not active");
    if (!accountIsSyncActive)
      return genErrorResponse(404, "Account sync is not active");

    const vendor = await fetchVendor(vendorId, accountId, countryId);
    if (!vendor) return genErrorResponse(404, "Vendor not found");
    const { active, isSyncActive } = vendor;
    if (!active) return genErrorResponse(404, "Vendor is not active");
    if (!isSyncActive)
      return genErrorResponse(404, "Vendor sync is not active");
    // Fin validaciones
    const hash = sha1(JSON.stringify(channelsAndStores));
    const s3Path = generateSyncS3Path(accountId, vendorId, "CHANNELS_STORES");
    const { Location } = await createFileS3(s3Path, parsedBody);
    const channels = await fetchChannels();
    if (channels.length === 0)
      return genErrorResponse(404, "Channels not found");

    const syncRequest: SyncRequest = {
      accountId,
      countryId,
      status: "PENDING",
      type: "CHANNELS_STORES",
      vendorId,
      hash,
      createdAt: getDateNow(),
      s3Path: Location,
      metadata: {}
    };
    const dbSyncRequest = await fetchSyncRequest(syncRequest);
    if (dbSyncRequest) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          message: "Another sync is in progress with this configuration"
        })
      };
    }
    syncRequest.requestId = requestUid;
    await saveSyncRequest(syncRequest);

    logger.info("STORE VALIDATE: SEND TO PREPARE STORES");
    // TODO: implement syncAll
    const payload: PrepareStoresPayload = {
      channelsAndStores,
      accountId,
      storeHash: hash,
      standardChannels: channels,
      requestId: requestUid,
      countryId
    };

    await sqsExtendedClient.sendMessage({
      QueueUrl: process.env.PREPARE_STORES_SQS_URL ?? "",
      MessageBody: JSON.stringify(payload),
      MessageGroupId: `${accountId}-${countryId}-${vendorId}`
    });

    logger.info("STORE VALIDATE: FINISHED");
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "We've received your request. We'll notify you when it's done."
      })
    };
  } catch (e) {
    const error = handleError(e);
    logger.error("STORE VALIDATE: ERROR", { e });
    const s3Path = generateSyncS3Path(accountId, "NAN", "CHANNELS_STORES");
    const { Location } = await createFileS3(s3Path, parsedBody);
    const syncRequest: SyncRequest = {
      accountId,
      countryId,
      status: "ERROR",
      type: "CHANNELS_STORES",
      vendorId: "NAN",
      hash: "",
      error: JSON.stringify({ error }),
      createdAt: getDateNow(),
      metadata: {},
      s3Path: Location
    };
    await saveSyncRequest(syncRequest);
    throw e;
  }
};
