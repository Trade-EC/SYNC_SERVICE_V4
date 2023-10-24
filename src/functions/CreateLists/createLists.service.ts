import { Lists } from "./createLists.types";

import { fetchDraftStores } from "/opt/nodejs/repositories/common.repository";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { lambdaClient } from "/opt/nodejs/configs/config";
import { logger } from "/opt/nodejs/configs/observability.config";

export const syncListsService = async (listInfo: Lists, accountId: string) => {
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

  logger.appendKeys({ vendorId, accountId, listId });
  logger.info("Creating list initiating");
  const sendMessagesPromises = products.map(async product => {
    const body = {
      product,
      storesId,
      channelId,
      accountId,
      vendorId,
      modifierGroups,
      categories,
      listName,
      listId
    };
    const messageBody = { vendorIdStoreIdChannelId, body };
    return await lambdaClient.invoke({
      FunctionName: "sync-service-v4-CreateProduct-R9EqUnslvEvJ",
      InvocationType: "RequestResponse",
      Payload: JSON.stringify(messageBody)
    });
  });

  logger.info("Wait for products in list responses");
  const sendMessages = await Promise.all(sendMessagesPromises);

  const syncRequest: SyncRequest = {
    accountId,
    channelId,
    status: "SUCCESS",
    storesId: storeId,
    type: "LIST",
    vendorId
  };

  await saveSyncRequest(syncRequest);

  logger.info("Creating lists finished");
  return sendMessages;
};
