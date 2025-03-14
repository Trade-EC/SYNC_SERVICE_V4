import { APIGatewayProxyEvent } from "aws-lambda";

import { handleError } from "/opt/nodejs/sync-service-layer/utils/error.utils";

import { PrepareProductsPayload } from "../PrepareProducts/prepareProducts.types";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { productsQueryParamsValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { SyncRequest } from "/opt/nodejs/sync-service-layer/types/syncRequest.types";
import { fetchSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
//@ts-ignore
import sha1 from "/opt/nodejs/sync-service-layer/node_modules/sha1";
import { validateLists } from "/opt/nodejs/transforms-layer/validators/lists.validator";
import {
  blackListValidator,
  genErrorResponse,
  getDateNow
} from "/opt/nodejs/sync-service-layer/utils/common.utils";
import { generateSyncS3Path } from "/opt/nodejs/sync-service-layer/utils/common.utils";
import { createFileS3 } from "/opt/nodejs/sync-service-layer/utils/s3.utils";
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
 * @description Validate lists service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const validateListsService = async (event: APIGatewayProxyEvent) => {
  const requestUid = uuid();
  const { body, headers, queryStringParameters } = event;
  const { type } = productsQueryParamsValidator.parse(
    queryStringParameters ?? {}
  );
  const syncAll = type === "ALL";
  const parsedBody = JSON.parse(body ?? "");
  const { account: requestAccountId, country: countryId } =
    headersValidator.parse(headers);
  let accountId = requestAccountId;
  try {
    logger.info("LISTS VALIDATE: INIT");
    const listInfo = await validateLists(parsedBody, accountId);
    const { list } = listInfo;
    const { storeId, vendorId, listId } = list;
    logger.appendKeys({
      vendorId,
      accountId,
      listId,
      storeId,
      requestId: requestUid
    });
    logger.info("BLACKLIST VALIDATE: VALIDATING");
    const blacklist = process.env.SYNC_BLACK_LIST?.split(",") ?? [];
    const accountIdVendorIdCountryId = `${accountId}-${vendorId}-${countryId}`;
    if (blackListValidator(blacklist, accountIdVendorIdCountryId)) {
      logger.info("LISTS VALIDATE: BLACKLISTED");
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message:
            "We've received your request. We'll notify you when it's done."
        })
      };
    }
    logger.info("LISTS VALIDATE: VALIDATING");
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
    const { active, isSyncActive, taxes: vendorTaxes } = vendor;
    if (!active) return genErrorResponse(404, "Vendor is not active");
    if (!isSyncActive)
      return genErrorResponse(404, "Vendor sync is not active");
    // Fin validaciones

    const { channelReferenceName } = list;
    const { ecommerceChannelId } = list;
    const channels = await fetchChannels({
      ecommerceChannelId,
      channelReferenceName
    });
    if (channels.length === 0)
      return genErrorResponse(404, "Channel not found");
    const [channel] = channels;
    const { channelId } = channel;

    const hash = sha1(JSON.stringify(parsedBody));
    const s3Path = generateSyncS3Path(accountId, vendorId, "LISTS");
    const { Location } = await createFileS3(s3Path, parsedBody);
    const syncRequest: SyncRequest = {
      accountId,
      countryId,
      status: "PENDING",
      type: "LISTS",
      vendorId,
      hash,
      createdAt: getDateNow(),
      metadata: {
        channelId,
        storesId: storeId,
        listId
      },
      s3Path: Location
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
    logger.info("LISTS VALIDATE: TRANSFORMING LIST");

    const payload: PrepareProductsPayload = {
      listInfo,
      accountId,
      listHash: hash,
      channelId,
      syncAll,
      requestId: requestUid,
      countryId,
      source: "LISTS",
      vendorTaxes
    };

    await sqsExtendedClient.sendMessage({
      QueueUrl: process.env.PREPARE_PRODUCTS_SQS_URL ?? "",
      MessageBody: JSON.stringify(payload),
      MessageGroupId: `${accountId}-${countryId}-${vendorId}`
    });

    logger.info("LISTS VALIDATE: FINISHED");
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "We've received your request. We'll notify you when it's done."
      })
    };
  } catch (e) {
    const error = handleError(e);
    logger.error("LISTS VALIDATE: ERROR", { e });
    const s3Path = generateSyncS3Path(accountId, "NAN", "LISTS");
    const { Location } = await createFileS3(s3Path, parsedBody);
    const syncRequest: SyncRequest = {
      accountId,
      countryId,
      status: "ERROR",
      type: "LISTS",
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
