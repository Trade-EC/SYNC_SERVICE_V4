import { fetchProducts, fetchStores } from "./publishSync.repository";
import { setDraftStatusForQuestionsParentsProducts } from "./publishSync.repository";
import { findShippingCost } from "./publishSync.repository";
import { savePublishRequest } from "./publishSync.repository";
import { saveDocumentsInS3 } from "./publishSync.repository";
import { transformQuestions } from "./publishSync.transform";
import { PublishSyncServiceProps } from "./publishSync.types";

import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
// @ts-ignore
import { v4 as uuidv4 } from "/opt/nodejs/sync-service-layer/node_modules/uuid";

const SYNC_BUCKET = process.env.SYNC_BUCKET_SYNC ?? "";
const NEW_PRODUCTS_SERVICE_URL = process.env.NEW_PRODUCTS_SERVICE_URL ?? "";

const fetchOptions = {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  }
};

export const callPublishEP = async (
  key: string,
  type: "STORES" | "PRODUCTS",
  publishId: string
) => {
  const url = `${NEW_PRODUCTS_SERVICE_URL}/api/v4/publish?bucket=${SYNC_BUCKET}&key=${key}&publishId=${publishId}`;
  const response = await fetch(url, fetchOptions);
  const { status } = response;
  const body = await response.json();
  if (status > 399) {
    logger.error("PUBLISH: ERROR SYNCING", { status, type });
    throw new Error("Error syncing");
  }
};

export const publishStores = async (
  vendorId: string,
  accountId: string,
  version: number,
  all: boolean,
  publishId: string
) => {
  logger.info("PUBLISH STORES: FETCHING DATA", { type: "STORES" });
  const stores = await fetchStores(vendorId, accountId, all);
  const storesWithVersion = stores.map(store => ({ ...store, version }));
  const shippingCosts = await findShippingCost(vendorId, accountId);
  const shippingCostsWithVersion = shippingCosts.map(shippingCost => ({
    ...shippingCost,
    version
  }));
  const storesS3Url = `sync/${accountId}/${vendorId}/stores.json`;
  const shippingCostsS3Url = `sync/${accountId}/${vendorId}/shippingCosts.json`;
  if (stores.length === 0) {
    return {
      key: "",
      message: "No stores to publish"
    };
  }
  await savePublishRequest(vendorId, accountId, "STORES", publishId);
  logger.info("PUBLISH STORES: SAVING IN S3", { type: "STORES" });
  const storeResponse = await saveDocumentsInS3(storesWithVersion, storesS3Url);
  await saveDocumentsInS3(shippingCostsWithVersion, shippingCostsS3Url);
  const { key: storesKey } = storeResponse;
  logger.info("PUBLISH STORES: SYNCING", { type: "STORES" });
  await callPublishEP(storesKey, "STORES", publishId);
  await sendMessageToUpdateStatusSQS(
    vendorId,
    accountId,
    version,
    all,
    "STORES"
  );
  return storeResponse;
};

export const publishProducts = async (
  vendorId: string,
  accountId: string,
  version: number,
  all: boolean,
  publishId: string
) => {
  logger.info("PUBLISH PRODUCTS: FETCHING DATA", { type: "PRODUCTS" });
  if (!all) {
    logger.info("PUBLISH PRODUCTS: FETCHING DATA", { type: "PRODUCTS", all });
    await setDraftStatusForQuestionsParentsProducts(vendorId, accountId);
  }
  const rawProducts = await fetchProducts(vendorId, accountId, version, all);
  const productsS3Url = `sync/${accountId}/${vendorId}/products.json`;
  if (rawProducts.length === 0) {
    return {
      key: "",
      message: "No products to publish"
    };
  }
  await savePublishRequest(vendorId, accountId, "PRODUCTS", publishId);
  const products = rawProducts.map(product => {
    const { questionsProducts, upsellingProducts, _id } = product;
    const transformedQuestions = transformQuestions(
      product?.questions ?? [],
      questionsProducts,
      2
    );
    const transformedUpselling = product.upselling.map(
      (productExternalId: string) => {
        const upsellingProduct = upsellingProducts.find(
          (upSellingProduct: any) =>
            upSellingProduct.attributes.externalId === productExternalId
        );
        if (!upsellingProduct) {
          logger.info("PUBLISH: UPSSELLING PRODUCT NOT FOUND", {
            productExternalId
          });
          return null;
        }
        return upsellingProduct;
      }
    );
    delete product.questionsProducts;
    delete product.upsellingProducts;
    return {
      ...product,
      // This is necessary because the product has an _id field
      _id,
      questions: transformedQuestions,
      upselling: transformedUpselling.filter(Boolean)
    };
  });
  logger.info("PUBLISH PRODUCTS: SAVING IN S3", { type: "PRODUCTS" });
  const productResponse = await saveDocumentsInS3(products, productsS3Url);
  const { key: productsKey } = productResponse;
  logger.info("PUBLISH PRODUCTS: SYNCING", { type: "PRODUCTS" });
  await callPublishEP(productsKey, "PRODUCTS", publishId);
  await sendMessageToUpdateStatusSQS(
    vendorId,
    accountId,
    version,
    all,
    "PRODUCTS"
  );
  return productResponse;
};

export const sendMessageToUpdateStatusSQS = async (
  vendorId: string,
  accountId: string,
  version: number,
  all: boolean,
  type: "STORES" | "PRODUCTS"
) => {
  const messageBody = {
    vendorId,
    accountId,
    version,
    all,
    type
  };

  await sqsExtendedClient.sendMessage({
    QueueUrl: process.env.UPDATE_STATUS_SQS_URL ?? "",
    MessageBody: JSON.stringify(messageBody)
  });
};

/**
 *
 * @param event
 * @description Publish sync, save in S3 and in history collection
 * @returns void
 */
export const publishSyncService = async (props: PublishSyncServiceProps) => {
  const { vendorId, accountId, rePublish, all = false } = props;
  logger.appendKeys({ vendorId, accountId });
  logger.info("PUBLISH: INIT");
  const version = new Date().getTime();
  const productsPublishId = uuidv4();
  const storesPublishId = uuidv4();
  if (rePublish) {
    const storesKey = `sync/${accountId}/${vendorId}/stores.json`;
    const productsKey = `sync/${accountId}/${vendorId}/products.json`;
    await savePublishRequest(vendorId, accountId, "STORES", storesPublishId);
    await savePublishRequest(
      vendorId,
      accountId,
      "PRODUCTS",
      productsPublishId
    );
    logger.info("PUBLISH: REPUBLISH");
    await Promise.all([
      callPublishEP(storesKey, "STORES", storesPublishId),
      callPublishEP(productsKey, "PRODUCTS", productsPublishId)
    ]);
    logger.info("PUBLISH: FINISHED");
    return;
  }

  await Promise.all([
    publishStores(vendorId, accountId, version, all, storesPublishId),
    publishProducts(vendorId, accountId, version, all, productsPublishId)
  ]);

  logger.info("PUBLISH: FINISHED");
};
