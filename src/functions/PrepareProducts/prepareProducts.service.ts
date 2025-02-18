import { CreateProductProps } from "../CreateProduct/createProduct.types";
import { DeleteProductsBody } from "../CreateProduct/createProduct.types";
import { CreateProductsBody } from "../CreateProduct/createProduct.types";
import { getDbProductToDeactivate } from "./prepareProducts.repository";
import { PrepareProductsPayload } from "./prepareProducts.types";

import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { createSyncRecords } from "/opt/nodejs/sync-service-layer/repositories/common.repository";
import { fetchDraftStores } from "/opt/nodejs/sync-service-layer/repositories/common.repository";
import translateText from "/opt/nodejs/sync-service-layer/configs/translate";

const buildSyncRecords = async (
  productsIds: string[],
  accountId: string,
  listId: string,
  channelId: string,
  countryId: string,
  vendorId: string,
  storeId: string,
  source: "PRODUCTS" | "LISTS",
  listHash: string,
  requestId: string
) => {
  const syncProducts = productsIds.map(productId => {
    return {
      productId,
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
      createdAt: new Date(
        new Date().toLocaleString("en", { timeZone: "America/Guayaquil" })
      )
    };
  });
  return syncProducts;
};

/**
 *
 * @param listInfo {@link Lists}
 * @param accountId
 * @description Sync products
 * @returns void
 */
export const prepareProductsService = async (props: PrepareProductsPayload) => {
  const { listInfo, accountId, listHash, channelId, vendorTaxes } = props;
  const { source, syncAll = false, requestId, countryId } = props;
  const { categories, list, modifierGroups, products } = listInfo;
  const { storeId, vendorId, listName, listId } = list;
  const logKeys = { vendorId, accountId, listId, storeId, requestId };
  let countCharacters = 0;
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
  const productsIds = products.map(
    product => `${accountId}.${countryId}.${vendorId}.${product.productId}`
  );

  // This logic is only for LISTS source
  if (source === "LISTS") {
    logger.info(`${source} PREPARE: DEACTIVATE STORE IN PRODUCT`, logKeys);
    const dbProductsToDeactivate = await getDbProductToDeactivate(
      productsIds,
      vendorIdStoreIdChannelId,
      accountId,
      vendorId,
      countryId
    );
    const dbProductsIdsToDeactivate = dbProductsToDeactivate.map(
      dbProduct => dbProduct.productId
    );
    const productsIdsToDeactivate = dbProductsToDeactivate.map(
      dbProduct => dbProduct.attributes.externalId
    );
    const syncProductsToDeactivate = await buildSyncRecords(
      dbProductsIdsToDeactivate,
      accountId,
      listId,
      channelId,
      countryId,
      vendorId,
      storeId,
      source,
      listHash,
      requestId
    );
    logger.info(
      `${source} PREPARE: CREATING SYNC LIST RECORDS TO DEACTIVATE`,
      logKeys
    );
    if (syncProductsToDeactivate.length > 0) {
      await createSyncRecords(syncProductsToDeactivate);
      const productsPromisesToDeactivate = productsIdsToDeactivate.map(
        productId => {
          const body1 = { productId, channelId, accountId, vendorId, listId };
          const body2 = { countryId, source, syncType: "DELETE", storeId };
          const body = { ...body1, ...body2 } as DeleteProductsBody;
          const messageBody: CreateProductProps = {
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
        }
      );
      logger.info(`${source} PREPARE: SEND TO SQS TO DEACTIVATE`, logKeys);
      await Promise.all(productsPromisesToDeactivate);
    }
  }

  const syncProducts = await buildSyncRecords(
    productsIds,
    accountId,
    listId,
    channelId,
    countryId,
    vendorId,
    storeId,
    source,
    listHash,
    requestId
  );
  logger.info(`${source} PREPARE: CREATING SYNC LIST RECORDS`, logKeys);
  await createSyncRecords(syncProducts);
  const modifierGroupsTranslate = await Promise.all(
    modifierGroups.map(async modifierGroup => {
      countCharacters += modifierGroup.modifier.length;
      return {
        ...modifierGroup,
        modifier: await translateText(modifierGroup.modifier, "es", "en")
      };
    })
  );
  const categoriesTranslate = await Promise.all(
    categories.map(async category => {
      countCharacters += category.name.length;
      return {
        ...category,
        name: await translateText(category.name, "es", "en")
      };
    })
  );
  const productsPromises = products.map(async product => {
    const { productId, name, description } = product;
    const nameEn = await translateText(name, "es", "en");
    const descriptionEn = description
      ? await translateText(description, "es", "en")
      : null;
    //console.log("nameEn", { name, nameEn });
    //console.log("descriptionEn", { description, descriptionEn });
    countCharacters += nameEn.length;
    countCharacters += descriptionEn ? descriptionEn.length : 0;
    const productTranslated = {
      ...product,
      name: nameEn,
      description: descriptionEn
    };
    const body1 = {
      product: productTranslated,
      storesId,
      channelId,
      accountId,
      vendorId,
      listId
    };
    const body2 = {
      modifierGroups: modifierGroupsTranslate,
      categories: categoriesTranslate,
      listName,
      productId,
      storeId
    };
    const body3 = { countryId, source, syncType: "NORMAL", vendorTaxes };
    const body = {
      ...body1,
      ...body2,
      ...body3
    } as CreateProductsBody;
    const messageBody: CreateProductProps = {
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
  console.log(`Count of characters: ${countCharacters}`);
  logger.info(`${source} PREPARE: SEND TO SQS`, logKeys);
  return await Promise.all(productsPromises);
};
