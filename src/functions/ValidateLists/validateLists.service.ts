import { APIGatewayProxyEvent } from "aws-lambda";

import { createSyncRecords } from "./validateLists.repository";
import { transformKFCList } from "./validateLists.transform";
import { listsValidator } from "./validateLists.validator";
import { Lists } from "./validateLists.types";

import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { fetchSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { logger } from "/opt/nodejs/configs/observability.config";
import { fetchDraftStores } from "/opt/nodejs/repositories/common.repository";
import { SendMessageBatchRequestEntry } from "/opt/nodejs/node_modules/@aws-sdk/client-sqs";
import { sqsChunkEntries } from "/opt/nodejs/utils/common.utils";
//@ts-ignore
import sha1 from "/opt/nodejs/node_modules/sha1";

const kfcAccounts = ["1", "9"];

export const syncList = async (listInfo: Lists, accountId: string) => {
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
      listId,
      channelId,
      vendorId,
      storeId,
      status: "PENDING" as const
    };
  });

  await createSyncRecords(syncProducts);

  logger.info("Creating list initiating");
  const Entries = products.map((product, index) => {
    const isLast = products.length - 1 === index;
    const { productId, name } = product;
    const body1 = { product, storesId, channelId, accountId, vendorId };
    const body2 = { modifierGroups, categories, listName, listId };
    const body3 = { isLast, storeId };
    const body = { ...body1, ...body2, ...body3, source: "LIST" };
    const messageBody = { vendorIdStoreIdChannelId, body };
    return {
      Id: sha1(`${vendorId}-${accountId}-${productId}-${name}`),
      MessageBody: JSON.stringify(messageBody),
      MessageGroupId: `${vendorId}-${accountId}-${productId}`
    } as SendMessageBatchRequestEntry;
  });

  logger.info("Send product to CreateProduct function");
  const sqsMessages = await sqsChunkEntries(Entries);

  return sqsMessages;
};

export const validateListsService = async (event: APIGatewayProxyEvent) => {
  const { body, headers } = event;
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
  logger.info("Validating lists");
  const syncRequest: SyncRequest = {
    accountId,
    channelId,
    status: "PENDING",
    storesId: storeId,
    type: "LIST",
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
  logger.info("Sending creation lists requests to SQS");
  await syncList(listInfo, accountId);

  logger.info("Validation lists finished");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "We've received your request. We'll notify you when it's done."
    })
  };
};
