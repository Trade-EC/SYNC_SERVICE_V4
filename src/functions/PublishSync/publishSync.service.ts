import { fetchProducts, fetchStores } from "./publishSync.repository";
import { findShippingCost } from "./publishSync.repository";
import { savePublishRequest } from "./publishSync.repository";
import { updateStatusProducts } from "./publishSync.repository";
import { updateStatusStores } from "./publishSync.repository";
import { saveStoresInHistory } from "./publishSync.repository";
import { saveProductsInHistory } from "./publishSync.repository";
import { saveDocumentsInS3 } from "./publishSync.repository";
import { transformQuestions } from "./publishSync.transform";
import { PublishSyncServiceProps } from "./publishSync.types";

import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import CONSTANTS from "/opt/nodejs/sync-service-layer/configs/constants";

const { SYNC_BUCKET } = CONSTANTS.GENERAL;

const fetchOptions = {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  }
};

export const callPublishEP = async (
  key: string,
  accountId: string,
  vendorId: string,
  type: "STORES" | "PRODUCTS"
) => {
  await fetch(
    `https://v9ti364z21.execute-api.us-east-2.amazonaws.com/Dev/api/v4/publish?bucket=${SYNC_BUCKET}&key=${key}`,
    fetchOptions
  );
  logger.info("PUBLISH PRODUCTS: SAVING PUBLISH REQUEST", { type });
  await savePublishRequest(vendorId, accountId, type);
};

export const publishStores = async (vendorId: string, accountId: string) => {
  logger.info("PUBLISH STORES: FETCHING DATA", { type: "STORES" });
  const stores = await fetchStores(vendorId, accountId);
  const shippingCosts = await findShippingCost(vendorId, accountId);
  const storesS3Url = `sync/${accountId}/${vendorId}/stores.json`;
  const shippingCostsS3Url = `sync/${accountId}/${vendorId}/shippingCosts.json`;
  if (stores.length === 0) {
    return {
      key: "",
      message: "No stores to publish"
    };
  }
  logger.info("PUBLISH STORES: SAVING IN S3", { type: "STORES" });
  const storeResponse = await saveDocumentsInS3(stores, storesS3Url);
  await saveDocumentsInS3(shippingCosts, shippingCostsS3Url);
  const { key: storesKey } = storeResponse;
  logger.info("PUBLISH STORES: SYNCING", { type: "STORES" });
  await callPublishEP(storesKey, accountId, vendorId, "STORES");
  logger.info("PUBLISH STORES: HISTORY", { type: "STORES" });
  await saveStoresInHistory(vendorId, accountId);
  logger.info("PUBLISH STORES: UPDATING STATUS", { type: "STORES" });
  await updateStatusStores(vendorId, accountId);
  return storeResponse;
};

export const publishProducts = async (vendorId: string, accountId: string) => {
  logger.info("PUBLISH PRODUCTS: FETCHING DATA", { type: "PRODUCTS" });
  const rawProducts = await fetchProducts(vendorId, accountId);
  const productsS3Url = `sync/${accountId}/${vendorId}/products.json`;
  if (rawProducts.length === 0) {
    return {
      key: "",
      message: "No products to publish"
    };
  }
  const products = rawProducts.map(product => {
    const { questionsProducts, _id } = product;
    const transformedQuestions = transformQuestions(
      product?.questions ?? [],
      questionsProducts,
      1
    );
    delete product.questionsProducts;
    return {
      ...product,
      // This is necessary because the product has an _id field
      _id,
      questions: transformedQuestions
    };
  });
  logger.info("PUBLISH PRODUCTS: SAVING IN S3", { type: "PRODUCTS" });
  const productResponse = await saveDocumentsInS3(products, productsS3Url);
  const { key: productsKey } = productResponse;
  logger.info("PUBLISH PRODUCTS: SYNCING", { type: "PRODUCTS" });
  await callPublishEP(productsKey, accountId, vendorId, "PRODUCTS");
  logger.info("PUBLISH PRODUCTS: HISTORY", { type: "PRODUCTS" });
  await saveProductsInHistory(vendorId, accountId);
  logger.info("PUBLISH PRODUCTS: UPDATING STATUS", { type: "PRODUCTS" });
  await updateStatusProducts(vendorId, accountId);
  return productResponse;
};

/**
 *
 * @param event
 * @description Publish sync, save in S3 and in history collection
 * @returns void
 */
export const publishSyncService = async (props: PublishSyncServiceProps) => {
  const { vendorId, accountId, rePublish } = props;
  logger.appendKeys({ vendorId, accountId });
  logger.info("PUBLISH: INIT");

  if (rePublish) {
    const storesKey = `sync/${accountId}/${vendorId}/stores.json`;
    const productsKey = `sync/${accountId}/${vendorId}/products.json`;
    logger.info("PUBLISH: REPUBLISH");
    await Promise.all([
      callPublishEP(storesKey, accountId, vendorId, "STORES"),
      callPublishEP(productsKey, accountId, vendorId, "PRODUCTS")
    ]);
    logger.info("PUBLISH: FINISHED");
    return;
  }

  await Promise.all([
    publishStores(vendorId, accountId),
    publishProducts(vendorId, accountId)
  ]);

  logger.info("PUBLISH: FINISHED");
};
