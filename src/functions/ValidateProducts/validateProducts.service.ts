import { APIGatewayProxyEvent } from "aws-lambda";

import { Lists } from "./validateProducts.types";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { SendMessageBatchRequestEntry } from "/opt/nodejs/sync-service-layer/node_modules/@aws-sdk/client-sqs";
import { fetchSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/sync-service-layer/types/syncRequest.types";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { fetchDraftStores } from "/opt/nodejs/sync-service-layer/repositories/common.repository";
import { sqsChunkEntries } from "/opt/nodejs/sync-service-layer/utils/common.utils";
//@ts-ignore
import sha1 from "/opt/nodejs/sync-service-layer/node_modules/sha1";
import { validateProducts } from "/opt/nodejs/transforms-layer/validators/products.validator";

/**
 *
 * @param listInfo {@link Lists}
 * @param accountId
 * @description Sync products
 * @returns void
 */
export const syncProducts = async (listInfo: Lists, accountId: string) => {
  const { categories, list, modifierGroups, products } = listInfo;
  const { channelId, storeId, vendorId, listName, listId } = list;
  let storesId: string[];
  if (storeId === "replicate_in_all") {
    const dbStores = await fetchDraftStores(accountId, vendorId);
    storesId = dbStores.map(dbStore => dbStore.storeId);
  } else {
    storesId = storeId.split(",");
  }
  logger.info("Creating products initiating");
  const vendorIdStoreIdChannelId = storesId.map(
    storeId => `${vendorId}#${storeId}#${channelId}`
  );

  logger.appendKeys({ vendorId, accountId });
  logger.info("Send product to CreateProduct function");
  const Entries = products.map((product, index) => {
    const { productId, name } = product;
    const body1 = { product, storesId, channelId, accountId, vendorId };
    const body2 = { modifierGroups, categories, listName, listId };
    const body3 = { isLast: index === products.length - 1, storeId };
    const body = { ...body1, ...body2, ...body3, source: "PRODUCTS" };
    const messageBody = { vendorIdStoreIdChannelId, body };
    return {
      Id: sha1(`${vendorId}-${accountId}-${productId}-${name}`),
      MessageBody: JSON.stringify(messageBody),
      MessageGroupId: `${vendorId}-${accountId}-${productId}`
    } as SendMessageBatchRequestEntry;
  });

  logger.info("Send product to CreateProduct function");
  const sqsMessages = await sqsChunkEntries(Entries);

  logger.info("Creating products finished");
  return sqsMessages;
};

/**
 *
 * @param event {@link APIGatewayProxyEvent}
 * @description Validate products
 * @returns void
 */
export const validateProductsService = async (event: APIGatewayProxyEvent) => {
  logger.info("PRODUCTS VALIDATE: INIT");
  const { body, headers } = event;
  const parsedBody = JSON.parse(body ?? "");
  const { account: accountId } = headersValidator.parse(headers);
  const listInfo = validateProducts(parsedBody, accountId);
  const { list } = listInfo;
  const { storeId, vendorId, channelId, listId } = list;
  logger.appendKeys({ vendorId, accountId, listId, storeId });
  logger.info("PRODUCTS VALIDATE: VALIDATING");
  const syncRequest: SyncRequest = {
    accountId,
    channelId,
    status: "PENDING",
    storesId: storeId,
    type: "PRODUCTS",
    vendorId
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

  logger.info("PRODUCTS VALIDATE: SEND TO SQS");
  await syncProducts(listInfo, accountId);

  logger.info("PRODUCTS VALIDATE: FINISHED");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "We've received your request. We'll notify you when it's done."
    })
  };
};
