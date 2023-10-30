import { createOrUpdateProduct } from "./createProduct.repository";
import { verifyCompletedList } from "./createProduct.repository";
import { CreateProductProps } from "./createProduct.types";

import { findProduct } from "/opt/nodejs/repositories/common.repository";
import { transformProduct } from "/opt/nodejs/transforms/product.transform";
import { mergeEntity } from "/opt/nodejs/transforms/product.transform";
import { logger } from "/opt/nodejs/configs/observability.config";
import { SyncProductRecord } from "/opt/nodejs/types/common.types";

export const createProductService = async (props: CreateProductProps) => {
  const { body, vendorIdStoreIdChannelId } = props;
  const { product, accountId, categories, channelId, modifierGroups } = body;
  const { storesId, vendorId, listName, listId, isLast, storeId } = body;
  const { source } = body;
  const { productId } = product;
  logger.appendKeys({ vendorId, accountId, productId, listId, isLast });
  logger.info("PRODUCT: INIT");
  const productDB = await findProduct(productId);
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
    productId: `${accountId}#${productId}`,
    accountId,
    listId,
    channelId,
    vendorId,
    storeId,
    status: "SUCCESS" as const
  };

  if (!productDB) {
    logger.info("PRODUCT: CREATE", { product: transformedProduct });
    await createOrUpdateProduct(
      transformedProduct,
      storesId,
      vendorId,
      channelId,
      listName
    );
    await verifyCompletedList(syncProductRequest, source);
    return;
  }

  logger.info("PRODUCT: MERGE");
  const { categories: dbCategories, prices: dbPrices } = productDB;
  const { statuses: dbStatuses, schedules: dbSchedules } = productDB;
  const { questions: dbQuestions, images: dbImages } = productDB;
  const { categories: newCategories, prices: newPrices } = transformedProduct;
  const { statuses: newStatuses, images: newImages } = transformedProduct;
  const { schedules: newSchedules } = transformedProduct;
  const { questions: newQuestions } = transformedProduct;

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
  transformedProduct.categories = mergedCategories;
  transformedProduct.prices = mergedPrices;
  transformedProduct.statuses = mergedStatuses;
  transformedProduct.schedules = mergedSchedules;
  transformedProduct.questions = mergedQuestions;
  transformedProduct.images = mergedImages;

  logger.info("PRODUCT: STORE", { product: transformedProduct });
  await createOrUpdateProduct(
    transformedProduct,
    storesId,
    vendorId,
    channelId,
    listName
  );
  logger.info("PRODUCT: VERIFY COMPLETED LIST");
  await verifyCompletedList(syncProductRequest, source);
  logger.info("PRODUCT: FINISHED");
  return;
};
