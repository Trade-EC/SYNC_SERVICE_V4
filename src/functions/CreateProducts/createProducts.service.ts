import { Lists } from "./createProducts.types";

import { fetchDraftStores } from "/opt/nodejs/repositories/common.repository";
import { logger } from "/opt/nodejs/configs/observability.config";
import { SendMessageBatchRequestEntry } from "/opt/nodejs/node_modules/@aws-sdk/client-sqs";
import { sqsChunkEntries } from "/opt/nodejs/utils/common.utils";
//@ts-ignore
import sha1 from "/opt/nodejs/node_modules/sha1";

export const createProductsService = async (
  listInfo: Lists,
  accountId: string
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
  logger.appendKeys({ vendorId, accountId, listId });
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
