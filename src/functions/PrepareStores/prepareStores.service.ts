import { createSyncStoresRecords } from "./prepareStores.repository";
import { PrepareStoresPayload } from "./prepareStores.types";

import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";

export const prepareStoreService = async (payload: PrepareStoresPayload) => {
  const { accountId, channelsAndStores, storeHash, vendorChannels } = payload;
  const { syncAll = false } = payload;
  const { stores, vendorId } = channelsAndStores;
  const syncStores = stores.map(store => {
    const { storeId } = store;
    return {
      storeId: `${accountId}.${vendorId}.${storeId}`,
      accountId,
      vendorId,
      status: "PENDING" as const
    };
  });
  logger.info("STORE PREPARE: CREATING SYNC STORE RECORDS");
  await createSyncStoresRecords(syncStores);

  const productsPromises = stores.map(async store => {
    const { storeId } = store;
    const body = { store, accountId, vendorId, storeId, vendorChannels };
    const messageBody = { body, storeHash, syncAll };

    await sqsClient.sendMessage({
      QueueUrl: process.env.SYNC_STORES_SQS_URL ?? "",
      MessageBody: JSON.stringify(messageBody),
      MessageGroupId: `${accountId}-${vendorId}-${storeId}`
    });
  });

  logger.info("STORE PREPARE: SEND TO SQS");
  const promises = await Promise.all(productsPromises);

  return promises;
};
