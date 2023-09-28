import { createOrUpdateProducts } from "./createLists.repository";
import { Lists } from "./createLists.types";

import { mergeCategories } from "/opt/nodejs/transforms/product.transform";
import { mergeEntity } from "/opt/nodejs/transforms/product.transform";
import { transformProduct } from "/opt/nodejs/transforms/product.transform";
import { fetchDraftStores } from "/opt/nodejs/repositories/common.repository";
import { findProduct } from "/opt/nodejs/repositories/common.repository";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";

export const syncListsService = async (listInfo: Lists, accountId: string) => {
  const { categories, list, modifierGroups, products } = listInfo;
  const { channelId, storeId, vendorId, listName } = list;
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

  const syncProductsPromise = products.map(async product => {
    const { productId } = product;
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

    if (!productDB) {
      return transformedProduct;
    }

    const { categories: dbCategories, prices: dbPrices } = productDB;
    const { statuses: dbStatuses, schedules: dbSchedules } = productDB;
    const { questions: dbQuestions, images: dbImages } = productDB;
    const { categories: newCategories, prices: newPrices } = transformedProduct;
    const { statuses: newStatuses, images: newImages } = transformedProduct;
    const { schedules: newSchedules } = transformedProduct;
    const { questions: newQuestions } = transformedProduct;

    const mergedCategories = mergeCategories(
      dbCategories,
      newCategories,
      vendorId,
      storesId,
      channelId
    );
    const mergedPrices = mergeEntity(
      dbPrices ?? [],
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
    return transformedProduct;
  });

  const syncProducts = await Promise.all(syncProductsPromise);

  const newProducts = await createOrUpdateProducts(
    syncProducts,
    storesId,
    vendorId,
    channelId,
    listName
  );

  const syncRequest: SyncRequest = {
    accountId,
    channelId,
    status: "SUCCESS",
    storesId: storeId,
    type: "LIST",
    vendorId
  };

  await saveSyncRequest(syncRequest);

  return newProducts;
};
