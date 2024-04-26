import { PrepareProductsPayload } from "./prepareProducts.types";

import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { createSyncRecords } from "/opt/nodejs/sync-service-layer/repositories/common.repository";
import { fetchDraftStores } from "/opt/nodejs/sync-service-layer/repositories/common.repository";

/**
 *
 * @param listInfo {@link Lists}
 * @param accountId
 * @description Sync products
 * @returns void
 */
export const prepareProductsService = async (props: PrepareProductsPayload) => {
  const { listInfo, accountId, listHash, channelId } = props;
  const { source, syncAll = false, requestId, countryId } = props;
  const { categories, list, modifierGroups, products } = listInfo;
  const { storeId, vendorId, listName, listId } = list;
  const logKeys = { vendorId, accountId, listId, storeId, requestId };
  let storesId: string[];
  if (storeId === "replicate_in_all") {
    const dbStores = await fetchDraftStores(accountId, vendorId);
    storesId = dbStores.map(dbStore => dbStore.storeId);
  } else {
    storesId = storeId.split(",");
  }
  const vendorIdStoreIdChannelId = storesId.map(
    storeId => `${vendorId}.${storeId}.${channelId}`
  );

  const syncProducts = products.map(product => {
    const { productId } = product;
    return {
      productId: `${accountId}.${countryId}.${vendorId}.${productId}`,
      accountId,
      listId,
      channelId,
      countryId,
      vendorId,
      storeId,
      status: "PENDING" as const,
      source,
      hash: listHash,
      requestId,
      createdAt: new Date()
    };
  });
  logger.info(`${source} VALIDATE: CREATING SYNC LIST RECORDS`, logKeys);
  await createSyncRecords(syncProducts);

  const productsPromises = products.map((product, index) => {
    const { productId } = product;
    const body1 = { product, storesId, channelId, accountId, vendorId };
    const body2 = { modifierGroups, categories, listName, listId };
    const body3 = { storeId, countryId };
    const body = { ...body1, ...body2, ...body3, source };
    const messageBody = {
      vendorIdStoreIdChannelId,
      body,
      listHash,
      syncAll,
      requestId
    };
    return sqsExtendedClient.sendMessage({
      QueueUrl: process.env.SYNC_PRODUCT_SQS_URL ?? "",
      MessageBody: JSON.stringify(messageBody),
      MessageGroupId: `${accountId}-${countryId}-${vendorId}-${productId}`
    });
  });

  logger.info(`${source} VALIDATE: SEND TO SQS`, logKeys);
  return await Promise.all(productsPromises);
};
