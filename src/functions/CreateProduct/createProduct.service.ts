import { createOrUpdateProduct } from "./createProduct.repository";
import { deactivateStoreInProduct } from "./createProduct.repository";
import { verifyCompletedList } from "./createProduct.repository";
import { CreateProductProps } from "./createProduct.types";

import { findProduct } from "/opt/nodejs/sync-service-layer/repositories/common.repository";
import { transformProduct } from "/opt/nodejs/sync-service-layer/transforms/product.transform";
import { mergeEntity } from "/opt/nodejs/sync-service-layer/transforms/product.transform";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { SyncProductRecord } from "/opt/nodejs/sync-service-layer/types/common.types";
// @ts-ignore
import sha1 from "/opt/nodejs/sync-service-layer/node_modules/sha1";
import { sortObjectByKeys } from "/opt/nodejs/sync-service-layer/utils/common.utils";

/**
 *
 * @param props {@link CreateProductProps}
 * @description Create product
 * @returns void
 */
export const createProductService = async (props: CreateProductProps) => {
  const { body, vendorIdStoreIdChannelId, listHash, syncAll } = props;
  const { requestId } = props;
  const { accountId, channelId, vendorId, countryId, storeId } = body;
  const { source, syncType, productId, listId } = body;
  const dbProductId = `${accountId}.${countryId}.${vendorId}.${productId}`;
  const logKeys = { vendorId, accountId, productId, listId, requestId };
  logger.info("PRODUCT: INIT", logKeys);
  const syncProductRequest: SyncProductRecord = {
    productId: dbProductId,
    accountId,
    countryId,
    listId,
    channelId,
    vendorId,
    storeId,
    status: "SUCCESS" as const,
    source,
    requestId
  };

  if (syncType === "DELETE") {
    logger.info("PRODUCT: DELETE", logKeys);
    await deactivateStoreInProduct(
      dbProductId,
      vendorIdStoreIdChannelId,
      accountId,
      vendorId,
      countryId
    );
    logger.info("PRODUCT: VERIFY COMPLETED LIST", logKeys);
    logger.info("PRODUCT: INFO", { syncProductRequest }, logKeys);
    await verifyCompletedList(syncProductRequest, source, listHash);
    logger.info("PRODUCT: FINISHED", logKeys);
    return;
  }

  const { product, storesId, categories, modifierGroups, vendorTaxes } = body;

  logger.info("PRODUCT: SEARCH", logKeys);
  const productDB = await findProduct(dbProductId);
  const transformedProduct = await transformProduct({
    product,
    storesId,
    channelId,
    accountId,
    vendorId,
    modifierGroups,
    categories,
    countryId,
    vendorTaxes
  });
  const orderedTransformProduct = sortObjectByKeys(transformedProduct);

  if (!productDB) {
    const hash = sha1(JSON.stringify(orderedTransformProduct));
    const version = new Date().getTime();
    orderedTransformProduct.hash = hash;
    orderedTransformProduct.version = version;
    logger.info("PRODUCT: CREATE", {
      ...logKeys,
      product: orderedTransformProduct
    });
    await createOrUpdateProduct(orderedTransformProduct);
    logger.info("PRODUCT: VERIFY COMPLETED LIST", logKeys);
    await verifyCompletedList(syncProductRequest, source, listHash);
    logger.info("PRODUCT: FINISHED", logKeys);
    return;
  }

  logger.info("PRODUCT: MERGE", logKeys);
  const { categories: dbCategories, prices: dbPrices } = productDB;
  const { statuses: dbStatuses, schedules: dbSchedules } = productDB;
  const { questions: dbQuestions, images: dbImages } = productDB;
  const { categories: newCategories } = orderedTransformProduct;
  const { prices: newPrices } = orderedTransformProduct;
  const { statuses: newStatuses, images: newImages } = orderedTransformProduct;
  const { schedules: newSchedules } = orderedTransformProduct;
  const { questions: newQuestions } = orderedTransformProduct;

  const mergedCategories = mergeEntity(
    dbCategories,
    newCategories,
    vendorIdStoreIdChannelId
  );
  const mergedPrices = mergeEntity(
    dbPrices,
    newPrices,
    vendorIdStoreIdChannelId
  );
  const mergedStatuses = mergeEntity(
    dbStatuses,
    newStatuses,
    vendorIdStoreIdChannelId
  );
  const mergedSchedules = mergeEntity(
    dbSchedules,
    newSchedules,
    vendorIdStoreIdChannelId
  );
  const mergedQuestions = mergeEntity(
    dbQuestions,
    newQuestions,
    vendorIdStoreIdChannelId
  );
  const mergedImages = mergeEntity(
    dbImages,
    newImages,
    vendorIdStoreIdChannelId
  );
  const mergedMetadataTags = mergeEntity(
    productDB.metadata?.tags ?? [],
    orderedTransformProduct.metadata?.tags ?? [],
    vendorIdStoreIdChannelId
  );
  orderedTransformProduct.categories = mergedCategories;
  orderedTransformProduct.prices = mergedPrices;
  orderedTransformProduct.statuses = mergedStatuses;
  orderedTransformProduct.schedules = mergedSchedules;
  orderedTransformProduct.questions = mergedQuestions;
  orderedTransformProduct.images = mergedImages;
  orderedTransformProduct.metadata.tags = mergedMetadataTags;
  const newHash = sha1(JSON.stringify(orderedTransformProduct));
  const version = new Date().getTime();
  orderedTransformProduct.hash = newHash;
  orderedTransformProduct.version = version;
  const { hash } = productDB;
  if (hash === newHash && !syncAll) {
    logger.info("PRODUCT: NO CHANGES", logKeys);
    logger.info("PRODUCT: VERIFY COMPLETED LIST", logKeys);
    await verifyCompletedList(syncProductRequest, source, listHash);
    logger.info("PRODUCT: FINISHED", logKeys);
    return;
  }

  logger.info("PRODUCT: UPDATE", {
    ...logKeys,
    product: orderedTransformProduct
  });
  await createOrUpdateProduct(orderedTransformProduct);
  logger.info("PRODUCT: VERIFY COMPLETED LIST", logKeys);
  await verifyCompletedList(syncProductRequest, source, listHash);
  logger.info("PRODUCT: FINISHED", logKeys);
  return;
};
