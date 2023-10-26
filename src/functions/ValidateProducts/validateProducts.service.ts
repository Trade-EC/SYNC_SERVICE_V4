import { APIGatewayProxyEvent } from "aws-lambda";

import { transformKFCProducts } from "./validateProducts.transform";
import { Lists } from "./validateProducts.types";

import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { SendMessageBatchRequestEntry } from "/opt/nodejs/node_modules/@aws-sdk/client-sqs";
import { fetchSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { productsValidator } from "/opt/nodejs/validators/lists.validator";
import { logger } from "/opt/nodejs/configs/observability.config";
import { fetchDraftStores } from "/opt/nodejs/repositories/common.repository";
import { sqsChunkEntries } from "/opt/nodejs/utils/common.utils";
//@ts-ignore
import sha1 from "/opt/nodejs/node_modules/sha1";

const kfcAccounts = ["1", "9"];

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

export const validateProductsService = async (event: APIGatewayProxyEvent) => {
  const { body, headers } = event;
  const parsedBody = JSON.parse(body ?? "");
  const { account: accountId } = headersValidator.parse(headers);
  let listInfo;
  // TODO: Reemplazar por validadores custom
  if (kfcAccounts.includes(accountId)) {
    listInfo = transformKFCProducts(parsedBody, productsValidator) as Lists;
  } else {
    listInfo = productsValidator.parse(parsedBody);
  }
  const { list } = listInfo;
  const { storeId, vendorId, channelId, listId } = list;
  logger.appendKeys({ vendorId, accountId, listId, storeId });
  logger.info("Validating Products");
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

  logger.info("Sending creation products requests to SQS");
  await syncProducts(listInfo, accountId);

  logger.info("Validation products finished");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "We've received your request. We'll notify you when it's done."
    })
  };
};
