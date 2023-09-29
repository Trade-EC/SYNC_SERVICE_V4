import { createOrUpdateProduct } from "./createProduct.repository";
import { CreateProductProps } from "./createProduct.types";

import { findProduct } from "/opt/nodejs/repositories/common.repository";
import { transformProduct } from "/opt/nodejs/transforms/product.transform";
import { mergeCategories } from "/opt/nodejs/transforms/product.transform";
import { mergeEntity } from "/opt/nodejs/transforms/product.transform";
import { handleError } from "/opt/nodejs/utils/error.utils";

export const lambdaHandler = async (props: CreateProductProps) => {
  try {
    const { body, vendorIdStoreIdChannelId } = props;
    const { product, accountId, categories, channelId, modifierGroups } = body;
    const { storesId, vendorId, listName } = body;
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
      return await createOrUpdateProduct(
        transformedProduct,
        storesId,
        vendorId,
        channelId,
        listName
      );
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
    console.log("Running init");
    return await createOrUpdateProduct(
      transformedProduct,
      storesId,
      vendorId,
      channelId,
      listName
    );
  } catch (e) {
    console.log(JSON.stringify(e));
    return handleError(e);
  }
};
