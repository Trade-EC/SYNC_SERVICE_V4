import { APIGatewayProxyEvent } from "aws-lambda";

import { createSyncRecords } from "./validateLists.repository";
import { transformKFCList } from "./validateLists.transform";
import { listsValidator } from "./validateLists.validator";
import { queryParamsValidator } from "./validateLists.validator";
import { Lists } from "./validateLists.types";

import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { fetchSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { logger } from "/opt/nodejs/configs/observability.config";
import { fetchDraftStores } from "/opt/nodejs/repositories/common.repository";
//@ts-ignore
import sha1 from "/opt/nodejs/node_modules/sha1";
import { sqsClient } from "/opt/nodejs/configs/config";

const kfcAccounts = ["1", "9"];

/**
 *
 * @param listInfo
 * @param accountId
 * @param hash
 * @description Sync list
 * @returns {Promise<SendMessageBatchRequestEntry[]>}
 */
export const syncList = async (
  listInfo: Lists,
  accountId: string,
  listHash: string,
  syncAll = false
) => {
  const { categories, list, modifierGroups, products } = listInfo;
  const { channelId, storeId, vendorId, listName, listId } = list;
  let storesId: string[];
  if (storeId === "replicate_in_all") {
    const dbStores = await fetchDraftStores(accountId, vendorId);
    storesId = dbStores.map(dbStore => dbStore.storeId);
  } else {
    storesId = storeId.split(",");
  }
  const vendorIdStoreIdChannelId = storesId.map(
    storeId => `${vendorId}#${storeId}#${channelId}`
  );
  const syncProducts = products.map(product => {
    const { productId } = product;
    return {
      productId: `${accountId}#${productId}`,
      accountId,
      listId,
      channelId,
      vendorId,
      storeId,
      status: "PENDING" as const
    };
  });
  logger.info("LISTS VALIDATE: CREATING SYNC LIST RECORDS");
  await createSyncRecords(syncProducts);

  const productsPromises = products.map((product, index) => {
    const isLast = products.length - 1 === index;
    const { productId } = product;
    const body1 = { product, storesId, channelId, accountId, vendorId };
    const body2 = { modifierGroups, categories, listName, listId };
    const body3 = { isLast, storeId };
    const body = { ...body1, ...body2, ...body3, source: "LIST" };
    const messageBody = { vendorIdStoreIdChannelId, body, listHash, syncAll };

    return sqsClient.sendMessage({
      QueueUrl: process.env.SYNC_PRODUCT_SQS_URL ?? "",
      MessageBody: JSON.stringify(messageBody),
      MessageGroupId: `${vendorId}-${accountId}-${productId}`
    });
  });

  logger.info("LISTS VALIDATE: SEND TO SQS");
  return await Promise.all(productsPromises);
};

/**
 *
 * @param event
 * @description Validate lists service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const validateListsService = async (event: APIGatewayProxyEvent) => {
  logger.info("LISTS VALIDATE: INIT");
  const { body, headers, queryStringParameters } = event;
  const { type } = queryParamsValidator.parse(queryStringParameters ?? {});
  const syncAll = type === "ALL";
  const parsedBody = JSON.parse(body ?? "");
  const { account: accountId } = headersValidator.parse(headers);
  let listInfo;
  if (kfcAccounts.includes(accountId)) {
    listInfo = transformKFCList(parsedBody, listsValidator) as Lists;
  } else {
    listInfo = listsValidator.parse(parsedBody);
  }
  const { list } = listInfo;
  const { storeId, vendorId, channelId, listId } = list;
  logger.appendKeys({ vendorId, accountId, listId, storeId });
  logger.info("LISTS VALIDATE: VALIDATING");
  const hash = sha1(JSON.stringify(parsedBody));
  const syncRequest: SyncRequest = {
    accountId,
    channelId,
    status: "PENDING",
    storesId: storeId,
    type: "LIST",
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
  logger.info("LISTS VALIDATE: TRANSFORMING LIST");
  await syncList(listInfo, accountId, hash, syncAll);

  logger.info("LISTS VALIDATE: FINISHED");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "We've received your request. We'll notify you when it's done."
    })
  };
};
