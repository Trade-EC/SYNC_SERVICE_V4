import { APIGatewayProxyEvent } from "aws-lambda";

import { transformProduct } from "/opt/nodejs/transforms/product.transform";

import { createProducts, findProduct } from "./createProducts.repository";
import { mergeCategories, mergeEntity } from "./createProducts.transform";
import { createProductsValidator } from "./createProducts.validator";

export const createProductsService = async (event: APIGatewayProxyEvent) => {
  const { body } = event;
  const parsedBody = JSON.parse(body ?? "");
  const validatedInfo = createProductsValidator.parse(parsedBody);
  const { categories, list, modifierGroups, products } = validatedInfo;
  const { channelId, storeId, vendorId, listName } = list;
  let storesId: string[];
  if (storeId === "replicate_in_all") {
    // TODO: get all storesId from mongo
    storesId = storeId.split(",");
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
    const transformedProduct = transformProduct({
      product,
      storesId,
      channelId,
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
    const { questions: dbQuestions } = productDB;
    const { categories: newCategories, prices: newPrices } = transformedProduct;
    const { statuses: newStatuses } = transformedProduct;
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
    transformedProduct.categories = mergedCategories;
    transformedProduct.prices = mergedPrices;
    transformedProduct.statuses = mergedStatuses;
    transformedProduct.schedules = mergedSchedules;
    transformedProduct.questions = mergedQuestions;
    syncProducts.push(transformedProduct);
  }

  const newProducts = createProducts(
    syncProducts,
    storesId,
    vendorId,
    channelId,
    listName
  );

  return newProducts;
};
