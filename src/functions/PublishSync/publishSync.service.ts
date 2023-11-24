import { APIGatewayProxyEvent } from "aws-lambda";

import { fetchProducts, fetchStores } from "./publishSync.repository";
import { savePublishRequest } from "./publishSync.repository";
import { updateStatusProducts } from "./publishSync.repository";
import { updateStatusStores } from "./publishSync.repository";
import { saveStoresInHistory } from "./publishSync.repository";
import { saveProductsInHistory } from "./publishSync.repository";
import { saveProductsInS3, saveStoresInS3 } from "./publishSync.repository";
import { transformQuestions } from "./publishSync.transform";
import { publishSyncValidator } from "./publishSync.validator";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import CONSTANTS from "/opt/nodejs/sync-service-layer/configs/constants";

const { BUCKET } = CONSTANTS.GENERAL;

const fetchOptions = {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  }
};

export const publishStores = async (vendorId: string, accountId: string) => {
  logger.info("PUBLISH STORES: FETCHING DATA", { type: "STORES" });
  const stores = await fetchStores(vendorId, accountId);
  if (stores.length === 0) {
    return {
      key: "",
      message: "No stores to publish"
    };
  }
  logger.info("PUBLISH STORES: SAVING IN S3", { type: "STORES" });
  const storeResponse = await saveStoresInS3(vendorId, accountId, stores);
  const { key: storesKey } = storeResponse;
  logger.info("PUBLISH STORES: SYNCING", { type: "STORES" });
  await fetch(
    `https://v9ti364z21.execute-api.us-east-2.amazonaws.com/Dev/publish?bucket=${BUCKET}&key=${storesKey}`,
    fetchOptions
  );
  logger.info("PUBLISH STORES: HISTORY", { type: "STORES" });
  await saveStoresInHistory(vendorId, accountId);
  logger.info("PUBLISH STORES: UPDATING STATUS", { type: "STORES" });
  await updateStatusStores(vendorId, accountId);
  logger.info("PUBLISH STORES: SAVING PUBLISH REQUEST", { type: "STORES" });
  await savePublishRequest(vendorId, accountId, "PRODUCTS");
  return storeResponse;
};

export const publishProducts = async (vendorId: string, accountId: string) => {
  logger.info("PUBLISH PRODUCTS: FETCHING DATA", { type: "PRODUCTS" });
  const rawProducts = await fetchProducts(vendorId, accountId);
  if (rawProducts.length === 0) {
    return {
      key: "",
      message: "No products to publish"
    };
  }
  const products = rawProducts.map(product => {
    const { questionsProducts } = product;
    const transformedQuestions = transformQuestions(
      product?.questions ?? [],
      questionsProducts,
      1
    );
    delete product.questionsProducts;
    return {
      ...product,
      questions: transformedQuestions
    };
  });
  logger.info("PUBLISH PRODUCTS: SAVING IN S3", { type: "PRODUCTS" });
  const productResponse = await saveProductsInS3(vendorId, accountId, products);
  const { key: productsKey } = productResponse;
  logger.info("PUBLISH PRODUCTS: SYNCING", { type: "PRODUCTS" });
  await fetch(
    `https://v9ti364z21.execute-api.us-east-2.amazonaws.com/Dev/publish?bucket=${BUCKET}&key=${productsKey}`,
    fetchOptions
  );
  logger.info("PUBLISH PRODUCTS: HISTORY", { type: "PRODUCTS" });
  await saveProductsInHistory(vendorId, accountId);
  logger.info("PUBLISH PRODUCTS: UPDATING STATUS", { type: "PRODUCTS" });
  await updateStatusProducts(vendorId, accountId);
  logger.info("PUBLISH PRODUCTS: SAVING PUBLISH REQUEST", { type: "PRODUCTS" });
  await savePublishRequest(vendorId, accountId, "PRODUCTS");
  return productResponse;
};

/**
 *
 * @param event
 * @description Publish sync, save in S3 and in history collection
 * @returns void
 */
export const publishSyncService = async (event: APIGatewayProxyEvent) => {
  const { body, headers } = event;
  const parsedBody = JSON.parse(body ?? "");
  const { account: accountId } = headersValidator.parse(headers);
  const info = publishSyncValidator.parse(parsedBody);
  const { vendorId } = info;
  logger.appendKeys({ vendorId, accountId });
  logger.info("PUBLISH: INIT");

  if (!accountId || !vendorId) {
    throw new Error("Missing required fields accountId or vendorId");
  }

  const [storeResponse, productResponse] = await Promise.all([
    publishStores(vendorId, accountId),
    publishProducts(vendorId, accountId)
  ]);

  logger.info("PUBLISH: FINISHED");
  return {
    statusCode: 200,
    body: JSON.stringify({
      stores: storeResponse,
      products: productResponse
    })
  };
};
