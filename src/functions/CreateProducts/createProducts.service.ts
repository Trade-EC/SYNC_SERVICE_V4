import { transformProduct } from "/opt/nodejs/transforms/product.transform";
import { fetchDraftStores } from "/opt/nodejs/repositories/common.repository";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";

import { createProducts, findProduct } from "./createProducts.repository";
import { mergeCategories, mergeEntity } from "./createProducts.transform";
import { Lists } from "./createProducts.types";

export const createProductsService = async (
  listInfo: Lists,
  accountId: string
) => {
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

  const syncProducts: any[] = [];
  for (const product of products) {
    const { productId } = product;
    const productDB = await findProduct(productId);
    const transformedProduct = await transformProduct({
      product,
      storesId,
      channelId,
      accountId,
      vendorId,
      products,
      modifierGroups,
      categories
    });

    if (!productDB) {
      syncProducts.push(transformedProduct);
      continue;
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
    syncProducts.push(transformedProduct);
  }

  const newProducts = createProducts(
    syncProducts,
    storesId,
    vendorId,
    channelId,
    listName
  );

  const syncRequest: SyncRequest = {
    accountId,
    channelId,
    status: "PENDING",
    storesId: storeId,
    type: "PRODUCTS",
    vendorId
  };

  await saveSyncRequest(syncRequest);
  return newProducts;
};
