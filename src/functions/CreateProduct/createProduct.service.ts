import { createOrUpdateProduct } from "./createProduct.repository";
import { verifyCompletedList } from "./createProduct.repository";
import { CreateProductProps } from "./createProduct.types";

import { findProduct } from "/opt/nodejs/repositories/common.repository";
import { transformProduct } from "/opt/nodejs/transforms/product.transform";
import { mergeEntity } from "/opt/nodejs/transforms/product.transform";
import { logger } from "/opt/nodejs/configs/observability.config";
import { SyncProductRecord } from "/opt/nodejs/types/common.types";
// @ts-ignore
import sha1 from "/opt/nodejs/node_modules/sha1";
import { sortObjectByKeys } from "/opt/nodejs/utils/common.utils";

/**
 *
 * @param props {@link CreateProductProps}
 * @description Create product
 * @returns void
 */
export const createProductService = async (props: CreateProductProps) => {
  const { body, vendorIdStoreIdChannelId, listHash } = props;
  const { product, accountId, categories, channelId, modifierGroups } = body;
  const { storesId, vendorId, listName, listId, isLast, storeId } = body;
  const { source } = body;
  const { productId } = product;
  const dbProductId = `${accountId}#${productId}`;
  logger.appendKeys({ vendorId, accountId, productId, listId, isLast });
  logger.info("PRODUCT: INIT");
  const productDB = await findProduct(dbProductId);
  const transformedProduct = await transformProduct({
    product,
    storesId,
    channelId,
    accountId,
    vendorId,
    modifierGroups,
    categories
  });
  const syncProductRequest: SyncProductRecord = {
    productId: dbProductId,
    accountId,
    listId,
    channelId,
    vendorId,
    storeId,
    status: "SUCCESS" as const
  };
  const orderedTransformProduct = sortObjectByKeys(transformedProduct);

  if (!productDB) {
    const hash = sha1(JSON.stringify(orderedTransformProduct));
    const version = new Date().getTime();
    orderedTransformProduct.hash = hash;
    orderedTransformProduct.version = version;
    logger.info("PRODUCT: CREATE", { product: orderedTransformProduct });
    await createOrUpdateProduct(
      orderedTransformProduct,
      storesId,
      vendorId,
      channelId,
      listName
    );
    await verifyCompletedList(syncProductRequest, source, listHash);
    logger.info("PRODUCT: FINISHED");
    return;
  }

  logger.info("PRODUCT: MERGE");
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
  orderedTransformProduct.categories = mergedCategories;
  orderedTransformProduct.prices = mergedPrices;
  orderedTransformProduct.statuses = mergedStatuses;
  orderedTransformProduct.schedules = mergedSchedules;
  orderedTransformProduct.questions = mergedQuestions;
  orderedTransformProduct.images = mergedImages;
  const newHash = sha1(JSON.stringify(orderedTransformProduct));
  const version = new Date().getTime();
  orderedTransformProduct.hash = newHash;
  orderedTransformProduct.version = version;
  const { hash } = productDB;
  if (hash === newHash) {
    logger.info("HASH COMPARE:", { hash, newHash });
    logger.info("PRODUCT: NO CHANGES");
    await verifyCompletedList(syncProductRequest, source, listHash);
    logger.info("PRODUCT: FINISHED");
    return;
  }

  logger.info("PRODUCT: STORE", { product: orderedTransformProduct });
  await createOrUpdateProduct(
    orderedTransformProduct,
    storesId,
    vendorId,
    channelId,
    listName
  );
  logger.info("PRODUCT: VERIFY COMPLETED LIST");
  await verifyCompletedList(syncProductRequest, source, listHash);
  logger.info("PRODUCT: FINISHED");
  return;
};
