import { APIGatewayProxyEvent } from "aws-lambda";

import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";

import { validateExecuteSync } from "./executeSync.validator";
import { fetchSyncRequests } from "./executeSync.repository";

import { fetchAccount } from "/opt/nodejs/sync-service-layer/repositories/accounts.repository";
// @ts-ignore
import { v4 as uuid } from "/opt/nodejs/sync-service-layer/node_modules/uuid";
import { fetchVendor } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
import {
  genErrorResponse,
  getDateNow
} from "/opt/nodejs/sync-service-layer/utils/common.utils";
import { getDataFromJson } from "/opt/nodejs/sync-service-layer/utils/s3.utils";
import { SyncRequest } from "/opt/nodejs/sync-service-layer/types/syncRequest.types";
import { fetchChannels } from "/opt/nodejs/sync-service-layer/repositories/channels.repository";
import { saveSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";
import { validateProducts } from "/opt/nodejs/transforms-layer/validators/products.validator";
import { validateStores } from "/opt/nodejs/transforms-layer/validators/store.validator";
import { validateLists } from "/opt/nodejs/transforms-layer/validators/lists.validator";

/**
 *
 * @param event
 * @description Validate lists service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const executeSyncService = async (event: APIGatewayProxyEvent) => {
  const body = validateExecuteSync(event);
  try {
    logger.info("EXECUTE SYNC: INIT", { body });

    const syncRequests = await fetchSyncRequests(body);
    const response = {
      totalRequests: syncRequests.length,
      correctProcessed: 0,
      errorProcessed: 0
    };

    for (const request of syncRequests) {
      logger.info("EXECUTE SYNC: REQUEST", { request });
      const { type, s3Path } = request;
      if (!s3Path) continue;
      const data = await getDataFromJson(s3Path);
      let sync;
      switch (type) {
        case "LISTS":
          sync = await syncList(request, data);
          break;
        case "CHANNELS_STORES":
          sync = await syncStore(request, data);
          break;
        case "PRODUCTS":
          sync = await syncProducts(request, data);
          break;
      }
      if (sync) {
        response.correctProcessed++;
      } else {
        response.errorProcessed++;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };
  } catch (e) {
    logger.error("LISTS VALIDATE: ERROR", { e });
    throw e;
  }
};

const syncList = async (syncRequest: SyncRequest, data: any) => {
  const { accountId, countryId, s3Path, hash } = syncRequest;
  const listInfo = await validateLists(data, accountId);
  const requestUid = uuid();
  const { list } = listInfo;
  const { storeId, vendorId, listId } = list;

  try {
    const account = await fetchAccount(accountId);

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

    const newSyncRequest: SyncRequest = {
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
      s3Path
    };
    newSyncRequest.requestId = requestUid;
    await saveSyncRequest(newSyncRequest);

    const payload = {
      listInfo,
      accountId,
      listHash: hash,
      channelId,
      syncAll: false, //TODO: Guardar esto en el syncRequest
      requestId: requestUid,
      countryId,
      source: "LISTS",
      vendorTaxes,
      metadata: { lambda: "PrepareLists" }
    };

    await sqsExtendedClient.sendMessage({
      QueueUrl: process.env.PREPARE_PRODUCTS_SQS_URL ?? "",
      MessageBody: JSON.stringify(payload),
      MessageGroupId: `${accountId}-${countryId}-${vendorId}`
    });
  } catch (error) {
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
      s3Path
    };
    await saveSyncRequest(syncRequest);
    return false;
  }

  return true;
};

const syncStore = async (syncRequest: SyncRequest, data: any) => {
  const { accountId, countryId, s3Path, hash } = syncRequest;
  const requestUid = uuid();
  try {
    const channelsAndStores = validateStores(data, accountId);
    const { vendorId } = channelsAndStores;
    logger.appendKeys({ vendorId, accountId, requestId: requestUid });
    logger.info("STORE VALIDATE: VALIDATING");

    const channels = await fetchChannels();
    if (channels.length === 0)
      return genErrorResponse(404, "Channels not found");

    const newSyncRequest: SyncRequest = {
      accountId,
      countryId,
      status: "PENDING",
      type: "CHANNELS_STORES",
      vendorId,
      hash,
      createdAt: getDateNow(),
      s3Path,
      metadata: {}
    };

    newSyncRequest.requestId = requestUid;
    await saveSyncRequest(newSyncRequest);

    const payload = {
      channelsAndStores,
      accountId,
      storeHash: hash,
      standardChannels: channels,
      requestId: requestUid,
      countryId,
      metadata: { lambda: "PrepareStores" }
    };

    await sqsExtendedClient.sendMessage({
      QueueUrl: process.env.PREPARE_STORES_SQS_URL ?? "",
      MessageBody: JSON.stringify(payload),
      MessageGroupId: `${accountId}-${countryId}-${vendorId}`
    });

    logger.info("STORE VALIDATE: FINISHED");
  } catch (error) {
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
      s3Path
    };
    await saveSyncRequest(syncRequest);
    return false;
  }

  return true;
};

const syncProducts = async (syncRequest: SyncRequest, data: any) => {
  const { accountId, countryId, s3Path, hash } = syncRequest;
  const requestUid = uuid();
  try {
    const listInfo = validateProducts(data, accountId);
    const { list } = listInfo;
    const { storeId, vendorId, listId } = list;

    const { channelReferenceName } = list;
    const { ecommerceChannelId } = list;
    const channels = await fetchChannels({
      ecommerceChannelId,
      channelReferenceName
    });
    const vendor = await fetchVendor(vendorId, accountId, countryId);
    if (!vendor) return genErrorResponse(404, "Vendor not found");
    const { taxes: vendorTaxes } = vendor;

    const [channel] = channels;
    const { channelId } = channel;
    const syncRequest: SyncRequest = {
      accountId,
      countryId,
      status: "PENDING",
      type: "PRODUCTS",
      vendorId,
      hash,
      createdAt: getDateNow(),
      metadata: { channelId, storesId: storeId, listId },
      s3Path
    };
    syncRequest.requestId = requestUid;
    await saveSyncRequest(syncRequest);

    logger.info("PRODUCTS VALIDATE: SEND TO SQS");

    const payload = {
      listInfo,
      accountId,
      listHash: hash,
      channelId,
      syncAll: false,
      source: "PRODUCTS",
      requestId: requestUid,
      countryId,
      vendorTaxes,
      metadata: { lambda: "PrepareProducts" }
    };

    await sqsExtendedClient.sendMessage({
      QueueUrl: process.env.PREPARE_PRODUCTS_SQS_URL ?? "",
      MessageBody: JSON.stringify(payload),
      MessageGroupId: `${accountId}-${countryId}-${vendorId}`
    });
  } catch (error) {
    const syncRequest: SyncRequest = {
      accountId,
      countryId,
      status: "ERROR",
      type: "PRODUCTS",
      vendorId: "NAN",
      hash: "",
      error: JSON.stringify({ error }),
      createdAt: getDateNow(),
      metadata: {},
      s3Path
    };
    await saveSyncRequest(syncRequest);
    return false;
  }

  return true;
};
