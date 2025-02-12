import { getDateNow } from "/opt/nodejs/sync-service-layer/utils/common.utils";

import { createSyncStoresRecords } from "./prepareStores.repository";
import { deactivateStores } from "./prepareStores.repository";
import { PrepareStoresPayload } from "./prepareStores.types";

import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";

export const prepareStoreService = async (payload: PrepareStoresPayload) => {
  const { accountId, channelsAndStores, storeHash, standardChannels } = payload;
  const { syncAll = false, requestId, countryId } = payload;
  const { stores, vendorId, channels } = channelsAndStores;
  const logKeys = { vendorId, accountId, requestId };
  const storeIds = stores.map(
    store => `${accountId}.${countryId}.${vendorId}.${store.storeId}`
  );
  // deactivate stores that are not in the list
  logger.info("STORE PREPARE: DEACTIVATING STORES", logKeys);
  await deactivateStores(storeIds, accountId, vendorId, countryId);

  const syncStores = stores.map(store => {
    const { storeId } = store;
    return {
      storeId: `${accountId}.${countryId}.${vendorId}.${storeId}`,
      accountId,
      vendorId,
      countryId,
      status: "PENDING" as const,
      hash: storeHash,
      createdAt: getDateNow(),
      requestId
    };
  });
  logger.info("STORE PREPARE: CREATING SYNC STORE RECORDS", logKeys);
  await createSyncStoresRecords(syncStores);

  const productsPromises = stores.map(async store => {
    const { storeId } = store;
    const body = {
      store,
      accountId,
      vendorId,
      storeId,
      channels,
      countryId,
      standardChannels
    };
    const messageBody = { body, storeHash, syncAll, requestId };

    await sqsExtendedClient.sendMessage({
      QueueUrl: process.env.SYNC_STORES_SQS_URL ?? "",
      MessageBody: JSON.stringify(messageBody),
      MessageGroupId: `${accountId}-${countryId}-${vendorId}-${storeId}`
    });
  });

  logger.info("STORE PREPARE: SEND TO SQS", logKeys);
  const promises = await Promise.all(productsPromises);

  return promises;
};
